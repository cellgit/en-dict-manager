import { PrismaClient, Prisma } from "@prisma/client";
import { readFile } from "fs/promises";
import path from "path";

type DictionaryEntry = {
  book_id?: string;
  head_word?: string;
  word_rank?: number;
  content?: {
    word?: {
      word_id?: string;
      word_head?: string;
      content?: {
        ukphone?: string;
        usphone?: string;
        ukspeech?: string;
        usspeech?: string;
        rem_method?: {
          desc?: string;
          val?: string;
        } | null;
        trans?: Array<{
          desc_cn?: string;
          desc_other?: string;
          tran_cn?: string;
          tran_other?: string;
          pos?: string;
        }> | null;
        sentence?: {
          desc?: string;
          sentences?: Array<{
            s_cn?: string;
            s_content?: string;
            s_content_eng?: string;
            s_speech?: string;
          }> | null;
        } | null;
        syno?: {
          desc?: string;
          synos?: Array<{
            pos?: string;
            tran?: string;
            hwds?: Array<{
              w?: string;
            }> | null;
          }> | null;
        } | null;
        phrase?: {
          desc?: string;
          phrases?: Array<{
            p_cn?: string;
            p_content?: string;
          }> | null;
        } | null;
        rel_word?: {
          desc?: string;
          rels?: Array<{
            pos?: string;
            words?: Array<{
              hwd?: string;
              tran?: string;
            }> | null;
          }> | null;
        } | null;
        // JSON 中可能还包含其它字段，使用索引签名忽略
        [key: string]: unknown;
      } | null;
    } | null;
  } | null;
};

const prisma = new PrismaClient();

async function loadEntries(): Promise<DictionaryEntry[]> {
  const dataPath = path.resolve(process.cwd(), "PEPXiaoXue3_1.json");
  const json = await readFile(dataPath, "utf-8");
  const parsed = JSON.parse(json);
  if (!Array.isArray(parsed)) {
    throw new Error("Seed 数据格式错误：JSON 根节点应为数组");
  }
  return parsed as DictionaryEntry[];
}

function createDefinitionData(entry: DictionaryEntry): Prisma.dict_definitionCreateWithoutWordInput[] {
  const trans = entry.content?.word?.content?.trans;
  if (!Array.isArray(trans)) {
    return [];
  }

  return trans
    .map((item) => ({
      desc_cn: item?.desc_cn?.trim() || null,
      desc_other: item?.desc_other?.trim() || null,
      pos: item?.pos?.trim() || null,
      tran_cn: item?.tran_cn?.trim() || null,
      tran_other: item?.tran_other?.trim() || null,
    }))
    .filter(
      (definition) =>
        definition.tran_cn ||
        definition.tran_other ||
        definition.desc_cn ||
        definition.desc_other ||
        definition.pos
    );
}

function createExampleSentenceData(entry: DictionaryEntry): Prisma.dict_example_sentenceCreateWithoutWordInput[] {
  const sentences = entry.content?.word?.content?.sentence?.sentences;
  if (!Array.isArray(sentences)) {
    return [];
  }

  return sentences
    .map((item) => {
      const source = item?.s_content?.trim() || item?.s_content_eng?.trim();
      if (!source) {
        return null;
      }
      return {
        source,
        translation: item?.s_cn?.trim() || null,
        meta: item ? (item as Prisma.JsonObject) : undefined,
      } satisfies Prisma.dict_example_sentenceCreateWithoutWordInput;
    })
    .filter(Boolean) as Prisma.dict_example_sentenceCreateWithoutWordInput[];
}

function createSynonymGroupData(entry: DictionaryEntry): Prisma.dict_synonym_groupCreateWithoutWordInput[] {
  const synos = entry.content?.word?.content?.syno?.synos;
  if (!Array.isArray(synos)) {
    return [];
  }

  return synos
    .map((group) => {
      const words = Array.isArray(group?.hwds)
        ? group?.hwds
            ?.map((hw) => hw?.w?.trim())
            .filter((value): value is string => Boolean(value))
        : [];
      if (!words.length && !group?.tran) {
        return null;
      }
      return {
        pos: group?.pos?.trim() || null,
        meaning_cn: group?.tran?.trim() || null,
        synos: {
          create: words.map((value) => ({ value })),
        },
      } satisfies Prisma.dict_synonym_groupCreateWithoutWordInput;
    })
    .filter(Boolean) as Prisma.dict_synonym_groupCreateWithoutWordInput[];
}

function createPhraseData(entry: DictionaryEntry): Prisma.dict_phraseCreateWithoutWordInput[] {
  const phrases = entry.content?.word?.content?.phrase?.phrases;
  if (!Array.isArray(phrases)) {
    return [];
  }

  return phrases
    .map((phrase) => {
      const content = phrase?.p_content?.trim();
      if (!content) {
        return null;
      }
      return {
        content,
        meaning_cn: phrase?.p_cn?.trim() || null,
      } satisfies Prisma.dict_phraseCreateWithoutWordInput;
    })
    .filter(Boolean) as Prisma.dict_phraseCreateWithoutWordInput[];
}

function createRelatedWordData(entry: DictionaryEntry): Prisma.dict_related_wordCreateWithoutWordInput[] {
  const rels = entry.content?.word?.content?.rel_word?.rels;
  if (!Array.isArray(rels)) {
    return [];
  }

  const relatedWords: Prisma.dict_related_wordCreateWithoutWordInput[] = [];
  for (const group of rels) {
    if (!Array.isArray(group?.words)) {
      continue;
    }
    for (const word of group.words) {
      const headword = word?.hwd?.trim();
      if (!headword) {
        continue;
      }
      relatedWords.push({
        headword,
        pos: group?.pos?.trim() || null,
        meaning_cn: word?.tran?.trim() || null,
      });
    }
  }
  return relatedWords;
}

async function main() {
  const entries = await loadEntries();

  await prisma.$transaction([
    prisma.dict_import_log.deleteMany(),
    prisma.dict_import_batch.deleteMany(),
    prisma.dict_word.deleteMany(),
  ]);

  let success = 0;
  for (const entry of entries) {
    const headword = entry.head_word?.trim();
    if (!headword) {
      continue;
    }

    const bookId = entry.book_id?.trim() || null;
    const content = entry.content?.word?.content;

    const definitions = createDefinitionData(entry);
    const exampleSentences = createExampleSentenceData(entry);
    const synonymGroups = createSynonymGroupData(entry);
    const phrases = createPhraseData(entry);
    const relatedWords = createRelatedWordData(entry);

    await prisma.dict_word.create({
      data: {
        headword,
        book_id: bookId,
        rank: typeof entry.word_rank === "number" ? entry.word_rank : null,
        phonetic_us: content?.usphone?.trim() || null,
        phonetic_uk: content?.ukphone?.trim() || null,
        memory_tip: content?.rem_method?.val?.trim() || null,
        definitions: definitions.length
          ? {
              create: definitions,
            }
          : undefined,
        exampleSentences: exampleSentences.length
          ? {
              create: exampleSentences,
            }
          : undefined,
        synonymGroups: synonymGroups.length
          ? {
              create: synonymGroups,
            }
          : undefined,
        phrases: phrases.length
          ? {
              create: phrases,
            }
          : undefined,
        relatedWords: relatedWords.length
          ? {
              create: relatedWords,
            }
          : undefined,
      },
    });
    success += 1;
  }

  console.log(`✅ 已写入 ${success} 条词条`);
}

main()
  .catch((error) => {
    console.error("❌ 种子数据导入失败", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
