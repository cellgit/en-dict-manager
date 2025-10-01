/**
 * 词汇服务层：封装 Prisma 访问逻辑，供 Server Actions 与导入流程复用。
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  type ListWordsParams,
  type ListWordsResult,
  type NormalizedExampleSentence,
  type NormalizedPhrase,
  type NormalizedRelatedWord,
  type NormalizedSynonymGroup,
  type NormalizedWord,
  type NormalizedWordDefinition
} from "@/lib/types";
import { NotFoundError } from "@/lib/errors";

const DEFAULT_TAKE = 20;
const MAX_TAKE = 100;

const isKnownRequestError = (
  error: unknown
): error is Prisma.PrismaClientKnownRequestError =>
  error instanceof Prisma.PrismaClientKnownRequestError;

const wordDetailInclude = {
  definitions: {
    include: {
      exampleSentences: {
        orderBy: {
          id: "asc"
        }
      }
    },
    orderBy: {
      id: "asc"
    }
  },
  exampleSentences: {
    orderBy: {
      id: "asc"
    }
  },
  synonymGroups: {
    include: {
      synos: {
        orderBy: {
          value: "asc"
        }
      }
    },
    orderBy: {
      id: "asc"
    }
  },
  phrases: {
    orderBy: {
      id: "asc"
    }
  },
  relatedWords: {
    orderBy: {
      id: "asc"
    }
  },
  importLogs: {
    orderBy: {
      created_at: "desc"
    },
    take: 10
  }
} satisfies Prisma.dict_wordInclude;

type WordWithRelations = Prisma.dict_wordGetPayload<{
  include: typeof wordDetailInclude;
}>;

type ExampleWriteModel = {
  source: string;
  translation: string | null;
  meta: Prisma.InputJsonValue | null;
};

type DefinitionWriteModel = {
  data: {
    part_of_speech: string | null;
    meaning_cn: string | null;
    meaning_en: string | null;
    note: string | null;
  };
  examples: ExampleWriteModel[];
};

type SynonymGroupWriteModel = {
  data: {
    part_of_speech: string | null;
    meaning_cn: string | null;
    note: string | null;
  };
  items: string[];
};

type PhraseWriteModel = {
  content: string;
  meaning_cn: string | null;
  meaning_en: string | null;
};

type RelatedWordWriteModel = {
  headword: string;
  part_of_speech: string | null;
  meaning_cn: string | null;
};

type PreparedWordData = {
  baseData: Prisma.dict_wordUncheckedCreateInput;
  definitions: DefinitionWriteModel[];
  examples: ExampleWriteModel[];
  synonymGroups: SynonymGroupWriteModel[];
  phrases: PhraseWriteModel[];
  relatedWords: RelatedWordWriteModel[];
};

const toNullableString = (value?: string | null): string | null => {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toNullableInt = (value?: number | null): number | null => {
  if (value === undefined || value === null) {
    return null;
  }
  return Number.isFinite(value) ? Math.trunc(value) : null;
};

const mapExample = (example: NormalizedExampleSentence): ExampleWriteModel => {
  const translation = toNullableString(example.translation ?? undefined);
  const meta = example.meta ?? null;
  return {
    source: example.source.trim(),
    translation,
    meta: (meta ?? null) as Prisma.InputJsonValue | null
  };
};

const prepareDefinition = (definition: NormalizedWordDefinition): DefinitionWriteModel | null => {
  const examples = (definition.examples ?? [])
    .map(mapExample)
    .filter((example) => example.source.length > 0);

  const data = {
    part_of_speech: toNullableString(definition.partOfSpeech ?? undefined),
    meaning_cn: toNullableString(definition.meaningCn ?? undefined),
    meaning_en: toNullableString(definition.meaningEn ?? undefined),
    note: toNullableString(definition.note ?? undefined)
  };

  const hasContent =
    data.part_of_speech !== null ||
    data.meaning_cn !== null ||
    data.meaning_en !== null ||
    data.note !== null ||
    examples.length > 0;

  return hasContent
    ? {
        data,
        examples
      }
    : null;
};

const prepareTopExamples = (examples: NormalizedExampleSentence[]) =>
  examples
    .map(mapExample)
    .filter((example) => example.source.length > 0);

const prepareSynonymGroup = (group: NormalizedSynonymGroup): SynonymGroupWriteModel | null => {
  const items = (group.items ?? [])
    .map((value) => toNullableString(value ?? undefined))
    .filter((value): value is string => Boolean(value));

  const data = {
    part_of_speech: toNullableString(group.partOfSpeech ?? undefined),
    meaning_cn: toNullableString(group.meaningCn ?? undefined),
    note: toNullableString(group.note ?? undefined)
  };

  const hasContent =
    data.part_of_speech !== null ||
    data.meaning_cn !== null ||
    data.note !== null ||
    items.length > 0;

  return hasContent
    ? {
        data,
        items
      }
    : null;
};

const preparePhrase = (phrase: NormalizedPhrase): PhraseWriteModel | null => {
  const content = toNullableString(phrase.content);
  if (!content) {
    return null;
  }
  return {
    content,
    meaning_cn: toNullableString(phrase.meaningCn ?? undefined),
    meaning_en: toNullableString(phrase.meaningEn ?? undefined)
  };
};

const prepareRelatedWord = (related: NormalizedRelatedWord): RelatedWordWriteModel | null => {
  const headword = toNullableString(related.headword);
  if (!headword) {
    return null;
  }
  return {
    headword,
    part_of_speech: toNullableString(related.partOfSpeech ?? undefined),
    meaning_cn: toNullableString(related.meaningCn ?? undefined)
  };
};

const prepareWordWriteData = (input: NormalizedWord): PreparedWordData => {
  const definitions = (input.definitions ?? [])
    .map(prepareDefinition)
    .filter((definition): definition is DefinitionWriteModel => Boolean(definition));

  const exampleSentences = prepareTopExamples(input.examples ?? []);

  const synonymGroups = (input.synonymGroups ?? [])
    .map(prepareSynonymGroup)
    .filter((group): group is SynonymGroupWriteModel => Boolean(group));

  const phrases = (input.phrases ?? [])
    .map(preparePhrase)
    .filter((phrase): phrase is PhraseWriteModel => Boolean(phrase));

  const relatedWords = (input.relatedWords ?? [])
    .map(prepareRelatedWord)
    .filter((related): related is RelatedWordWriteModel => Boolean(related));

  return {
    baseData: {
      headword: input.headword.trim(),
      rank: toNullableInt(input.rank ?? undefined),
      book_id: toNullableString(input.bookId ?? undefined),
      phonetic_us: toNullableString(input.phoneticUs ?? undefined),
      phonetic_uk: toNullableString(input.phoneticUk ?? undefined),
      audio_us: toNullableString(input.audioUs ?? undefined),
      audio_uk: toNullableString(input.audioUk ?? undefined),
      memory_tip: toNullableString(input.memoryTip ?? undefined)
    } satisfies Prisma.dict_wordUncheckedCreateInput,
    definitions,
    examples: exampleSentences,
    synonymGroups,
    phrases,
    relatedWords
  };
};

const writeWordRelations = async (
  tx: Prisma.TransactionClient,
  wordId: string,
  prepared: PreparedWordData
) => {
  for (const definition of prepared.definitions) {
    const definitionRecord = await tx.dict_definition.create({
      data: {
        ...definition.data,
        word_id: wordId
      }
    });

    if (definition.examples.length > 0) {
      await tx.dict_example_sentence.createMany({
        data: definition.examples.map((example) => ({
          word_id: wordId,
          definition_id: definitionRecord.id,
          source: example.source,
          translation: example.translation,
          meta: example.meta ?? undefined
        }))
      });
    }
  }

  if (prepared.examples.length > 0) {
    await tx.dict_example_sentence.createMany({
      data: prepared.examples.map((example) => ({
        word_id: wordId,
        definition_id: null,
        source: example.source,
        translation: example.translation,
        meta: example.meta ?? undefined
      }))
    });
  }

  for (const group of prepared.synonymGroups) {
    const groupRecord = await tx.dict_synonym_group.create({
      data: {
        ...group.data,
        word_id: wordId
      }
    });

    if (group.items.length > 0) {
      await tx.dict_synonym.createMany({
        data: group.items.map((value) => ({
          group_id: groupRecord.id,
          value
        }))
      });
    }
  }

  if (prepared.phrases.length > 0) {
    await tx.dict_phrase.createMany({
      data: prepared.phrases.map((phrase) => ({
        word_id: wordId,
        content: phrase.content,
        meaning_cn: phrase.meaning_cn,
        meaning_en: phrase.meaning_en
      }))
    });
  }

  if (prepared.relatedWords.length > 0) {
    await tx.dict_related_word.createMany({
      data: prepared.relatedWords.map((related) => ({
        word_id: wordId,
        headword: related.headword,
        part_of_speech: related.part_of_speech,
        meaning_cn: related.meaning_cn
      }))
    });
  }
};

const createWordRecord = async (tx: Prisma.TransactionClient, prepared: PreparedWordData) => {
  const created = await tx.dict_word.create({
    data: prepared.baseData
  });

  await writeWordRelations(tx, created.id, prepared);

  return created.id;
};

const replaceWordRecord = async (
  tx: Prisma.TransactionClient,
  id: string,
  prepared: PreparedWordData
) => {
  await tx.dict_example_sentence.deleteMany({ where: { word_id: id } });
  await tx.dict_synonym_group.deleteMany({ where: { word_id: id } });
  await tx.dict_phrase.deleteMany({ where: { word_id: id } });
  await tx.dict_related_word.deleteMany({ where: { word_id: id } });
  await tx.dict_definition.deleteMany({ where: { word_id: id } });

  await tx.dict_word.update({
    where: { id },
    data: prepared.baseData
  });

  await writeWordRelations(tx, id, prepared);
};

export async function listWords(params: ListWordsParams = {}): Promise<ListWordsResult> {
  const skip = Math.max(0, params.skip ?? 0);
  const takeCandidate = params.take ?? DEFAULT_TAKE;
  const take = Math.min(Math.max(takeCandidate, 1), MAX_TAKE);

  const where: Prisma.dict_wordWhereInput = {};

  // 搜索条件
  if (params.query) {
    where.headword = {
      contains: params.query.trim(),
      mode: "insensitive" as const
    };
  }

  // bookId 筛选
  if (params.bookId) {
    where.book_id = params.bookId;
  }

  const [items, total] = await prisma.$transaction([
    prisma.dict_word.findMany({
      where,
      skip,
      take,
      orderBy: {
        updated_at: "desc"
      },
      select: {
        id: true,
        headword: true,
        rank: true,
        book_id: true,
        phonetic_us: true,
        phonetic_uk: true,
        updated_at: true
      }
    }),
    prisma.dict_word.count({ where })
  ]);

  return {
    total,
    items: items.map((item: {
      id: string;
      headword: string;
      rank: number | null;
      book_id: string | null;
      phonetic_us: string | null;
      phonetic_uk: string | null;
      updated_at: Date;
    }) => ({
      id: item.id,
      headword: item.headword,
      rank: item.rank,
      bookId: item.book_id,
      phoneticUs: item.phonetic_us,
      phoneticUk: item.phonetic_uk,
      updatedAt: item.updated_at
    }))
  } satisfies ListWordsResult;
}

export async function getWordById(id: string): Promise<WordWithRelations> {
  const word = await prisma.dict_word.findUnique({
    where: { id },
    include: wordDetailInclude
  });

  if (!word) {
    throw new NotFoundError("词条不存在或已被删除");
  }

  return word;
}

export async function createWord(input: NormalizedWord): Promise<WordWithRelations> {
  const prepared = prepareWordWriteData(input);

  const wordId = await prisma.$transaction(async (tx) => createWordRecord(tx, prepared));

  return getWordById(wordId);
}

export async function updateWord(id: string, input: NormalizedWord): Promise<WordWithRelations> {
  const prepared = prepareWordWriteData(input);

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const exists = await tx.dict_word.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!exists) {
      throw new NotFoundError("词条不存在或已被删除");
    }

    await replaceWordRecord(tx, id, prepared);
  });

  return getWordById(id);
}

export async function createWordWithinTransaction(
  tx: Prisma.TransactionClient,
  input: NormalizedWord
): Promise<string> {
  const prepared = prepareWordWriteData(input);
  return createWordRecord(tx, prepared);
}

export async function replaceWordWithinTransaction(
  tx: Prisma.TransactionClient,
  id: string,
  input: NormalizedWord
): Promise<void> {
  const prepared = prepareWordWriteData(input);
  await replaceWordRecord(tx, id, prepared);
}

export async function deleteWord(id: string): Promise<void> {
  try {
    await prisma.dict_word.delete({ where: { id } });
  } catch (error: unknown) {
    if (isKnownRequestError(error) && error.code === "P2025") {
      throw new NotFoundError("词条不存在或已被删除");
    }
    throw error;
  }
}

export type { WordWithRelations };
