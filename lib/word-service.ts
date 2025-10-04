/**
 * 词汇服务层：封装 Prisma 访问逻辑，供 Server Actions 与导入流程复用。
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toNullableInt, toNullableString } from "@/lib/word-normalizer";
import {
  type ListWordsParams,
  type ListWordsResult,
  type NormalizedAntonym,
  type NormalizedExamQuestion,
  type NormalizedExampleSentence,
  type NormalizedPhrase,
  type NormalizedRealExamSentence,
  type NormalizedRelatedWord,
  type NormalizedSynonymGroup,
  type NormalizedWord,
  type NormalizedWordDefinition
} from "@/lib/types";
import { NotFoundError } from "@/lib/errors";
import { getYoudaoDictVoicePair } from "@/lib/utils";

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
  antonyms: {
    orderBy: {
      value: "asc"
    }
  },
  realExamSentences: {
    orderBy: [
      {
        order: "asc"
      },
      {
        id: "asc"
      }
    ]
  },
  examQuestions: {
    include: {
      choices: {
        orderBy: {
          choice_index: "asc"
        }
      }
    },
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
    desc_cn: string | null;
    desc_other: string | null;
    pos: string | null;
    tran_cn: string | null;
    tran_other: string | null;
  };
  examples: ExampleWriteModel[];
};

type SynonymGroupWriteModel = {
  data: {
    pos: string | null;
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
  pos: string | null;
  meaning_cn: string | null;
};

type AntonymWriteModel = {
  value: string;
  meta: Prisma.InputJsonValue | null;
};

type RealExamSentenceWriteModel = {
  content: string;
  level: string | null;
  paper: string | null;
  source_type: string | null;
  year: string | null;
  order: number | null;
  meta: Prisma.InputJsonValue | null;
};

type ExamChoiceWriteModel = {
  value: string;
  choice_index: number | null;
};

type ExamQuestionWriteModel = {
  data: {
    question: string;
    exam_type: number | null;
    explanation: string | null;
    right_index: number | null;
  };
  choices: ExamChoiceWriteModel[];
};

type PreparedWordData = {
  baseData: Prisma.dict_wordUncheckedCreateInput;
  definitions: DefinitionWriteModel[];
  examples: ExampleWriteModel[];
  synonymGroups: SynonymGroupWriteModel[];
  phrases: PhraseWriteModel[];
  relatedWords: RelatedWordWriteModel[];
  antonyms: AntonymWriteModel[];
  realExamSentences: RealExamSentenceWriteModel[];
  examQuestions: ExamQuestionWriteModel[];
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
    desc_cn: toNullableString(definition.descCn ?? undefined),
    desc_other: toNullableString(definition.descOther ?? undefined),
    pos: toNullableString(definition.pos ?? undefined),
    tran_cn: toNullableString(definition.tranCn ?? undefined),
    tran_other: toNullableString(definition.tranOther ?? undefined)
  };

  const hasContent =
    data.desc_cn !== null ||
    data.desc_other !== null ||
    data.pos !== null ||
    data.tran_cn !== null ||
    data.tran_other !== null ||
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
    pos: toNullableString(group.pos ?? undefined),
    meaning_cn: toNullableString(group.meaningCn ?? undefined),
    note: toNullableString(group.note ?? undefined)
  };

  const hasContent =
    data.pos !== null ||
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
    pos: toNullableString(related.pos ?? undefined),
    meaning_cn: toNullableString(related.meaningCn ?? undefined)
  };
};

const prepareAntonym = (antonym: NormalizedAntonym): AntonymWriteModel | null => {
  const value = toNullableString(antonym.headword);
  if (!value) {
    return null;
  }
  const meta = antonym.meta ?? null;
  return {
    value,
    meta: (meta ?? null) as Prisma.InputJsonValue | null
  };
};

const prepareRealExamSentence = (
  sentence: NormalizedRealExamSentence
): RealExamSentenceWriteModel | null => {
  const content = toNullableString(sentence.content);
  if (!content) {
    return null;
  }
  const meta = sentence.sourceInfo ?? null;
  return {
    content,
    level: toNullableString(sentence.level ?? undefined),
    paper: toNullableString(sentence.paper ?? undefined),
    source_type: toNullableString(sentence.sourceType ?? undefined),
    year: toNullableString(sentence.year ?? undefined),
    order: toNullableInt(sentence.order ?? undefined),
    meta: (meta ?? null) as Prisma.InputJsonValue | null
  };
};

const prepareExamChoice = (choice: NormalizedExamQuestion["choices"][number]): ExamChoiceWriteModel | null => {
  const value = toNullableString(choice.value);
  if (!value) {
    return null;
  }
  return {
    value,
    choice_index: toNullableInt(choice.index ?? undefined)
  };
};

const prepareExamQuestion = (
  question: NormalizedExamQuestion
): ExamQuestionWriteModel | null => {
  const preparedQuestion = toNullableString(question.question);
  if (!preparedQuestion) {
    return null;
  }
  const choices = (question.choices ?? [])
    .map((choice) => prepareExamChoice(choice))
    .filter((choice): choice is ExamChoiceWriteModel => Boolean(choice));

  return {
    data: {
      question: preparedQuestion,
      exam_type: toNullableInt(question.examType ?? undefined),
      explanation: toNullableString(question.explanation ?? undefined),
      right_index: toNullableInt(question.rightIndex ?? undefined)
    },
    choices
  };
};

const prepareWordWriteData = (input: NormalizedWord): PreparedWordData => {
  const voice = getYoudaoDictVoicePair(input.headword);
  const normalizedAudioUs = toNullableString(input.audioUs ?? undefined);
  const normalizedAudioUk = toNullableString(input.audioUk ?? undefined);
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

  const antonyms = (input.antonyms ?? [])
    .map(prepareAntonym)
    .filter((antonym): antonym is AntonymWriteModel => Boolean(antonym));

  const realExamSentences = (input.realExamSentences ?? [])
    .map(prepareRealExamSentence)
    .filter((sentence): sentence is RealExamSentenceWriteModel => Boolean(sentence));

  const examQuestions = (input.examQuestions ?? [])
    .map(prepareExamQuestion)
    .filter((question): question is ExamQuestionWriteModel => Boolean(question));

  return {
    baseData: {
      headword: input.headword.trim(),
      rank: toNullableInt(input.rank ?? undefined),
      book_id: toNullableString(input.bookId ?? undefined),
      phonetic_us: toNullableString(input.phoneticUs ?? undefined),
      phonetic_uk: toNullableString(input.phoneticUk ?? undefined),
      audio_us: normalizedAudioUs ?? voice.us,
      audio_uk: normalizedAudioUk ?? voice.uk,
      audio_us_raw: toNullableString(input.audioUsRaw ?? undefined),
      audio_uk_raw: toNullableString(input.audioUkRaw ?? undefined),
      memory_tip: toNullableString(input.memoryTip ?? undefined),
      memory_tip_desc: toNullableString(input.memoryTipDesc ?? undefined),
      source_word_id: toNullableString(input.sourceWordId ?? undefined),
      phonetic: toNullableString(input.phonetic ?? undefined),
      speech_text: toNullableString(input.speech ?? undefined),
      star: toNullableInt(input.star ?? undefined),
      sentence_desc: toNullableString(input.sentenceDesc ?? undefined),
      synonym_desc: toNullableString(input.synonymDesc ?? undefined),
      phrase_desc: toNullableString(input.phraseDesc ?? undefined),
      related_desc: toNullableString(input.relatedDesc ?? undefined),
      antonym_desc: toNullableString(input.antonymDesc ?? undefined),
      real_exam_sentence_desc: toNullableString(input.realExamSentenceDesc ?? undefined),
      picture_url: toNullableString(input.pictureUrl ?? undefined)
    } satisfies Prisma.dict_wordUncheckedCreateInput,
    definitions,
    examples: exampleSentences,
    synonymGroups,
    phrases,
    relatedWords,
    antonyms,
    realExamSentences,
    examQuestions
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
        pos: related.pos,
        meaning_cn: related.meaning_cn
      }))
    });
  }

  if (prepared.antonyms.length > 0) {
    await tx.dict_antonym.createMany({
      data: prepared.antonyms.map((antonym) => ({
        word_id: wordId,
        value: antonym.value,
        meta: antonym.meta ?? undefined
      }))
    });
  }

  if (prepared.realExamSentences.length > 0) {
    await tx.dict_real_exam_sentence.createMany({
      data: prepared.realExamSentences.map((sentence) => ({
        word_id: wordId,
        content: sentence.content,
        level: sentence.level,
        paper: sentence.paper,
        source_type: sentence.source_type,
        year: sentence.year,
        order: sentence.order,
        meta: sentence.meta ?? undefined
      }))
    });
  }

  for (const question of prepared.examQuestions) {
    const questionRecord = await tx.dict_exam_question.create({
      data: {
        ...question.data,
        word_id: wordId
      }
    });

    if (question.choices.length > 0) {
      await tx.dict_exam_choice.createMany({
        data: question.choices.map((choice) => ({
          question_id: questionRecord.id,
          value: choice.value,
          choice_index: choice.choice_index
        }))
      });
    }
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
  await tx.dict_antonym.deleteMany({ where: { word_id: id } });
  await tx.dict_real_exam_sentence.deleteMany({ where: { word_id: id } });
  await tx.dict_exam_choice.deleteMany({ where: { question: { word_id: id } } });
  await tx.dict_exam_question.deleteMany({ where: { word_id: id } });
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
  const exact = params.exact ?? false;
  const normalizedQuery = params.query?.trim();

  const mapListItem = (item: {
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
  });

  const listSelect = {
    id: true,
    headword: true,
    rank: true,
    book_id: true,
    phonetic_us: true,
    phonetic_uk: true,
    updated_at: true
  } satisfies Prisma.dict_wordSelect;

  if (exact && normalizedQuery) {
    const filters = [Prisma.sql`LOWER("headword") = LOWER(${normalizedQuery})`];

    if (params.bookId) {
      filters.push(Prisma.sql`"book_id" = ${params.bookId}`);
    }

    const exactRows = await prisma.$queryRaw<Array<{
      id: string;
      headword: string;
      rank: number | null;
      book_id: string | null;
      phonetic_us: string | null;
      phonetic_uk: string | null;
      updated_at: Date;
    }>>(Prisma.sql`
      SELECT "id", "headword", "rank", "book_id", "phonetic_us", "phonetic_uk", "updated_at"
      FROM "dict_word"
      WHERE ${Prisma.join(filters, " AND ")}
      ORDER BY "updated_at" DESC
      LIMIT 1
    `);

    const hasRow = exactRows.length > 0;
    const includeRow = hasRow && skip === 0 && take > 0;

    return {
      total: hasRow ? 1 : 0,
      items: includeRow ? exactRows.map(mapListItem) : []
    } satisfies ListWordsResult;
  }

  const where: Prisma.dict_wordWhereInput = {};

  // 搜索条件
  if (normalizedQuery) {
    where.headword = {
      contains: normalizedQuery,
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
      select: listSelect
    }),
    prisma.dict_word.count({ where })
  ]);

  return {
    total,
    items: items.map(mapListItem)
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
