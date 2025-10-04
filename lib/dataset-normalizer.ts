import { normalizedWordSchema } from "@/app/words/schemas";
import type {
  NormalizedAntonym,
  NormalizedExamChoice,
  NormalizedExamQuestion,
  NormalizedExampleSentence,
  NormalizedPhrase,
  NormalizedRealExamSentence,
  NormalizedRelatedWord,
  NormalizedSynonymGroup,
  NormalizedWord,
  NormalizedWordDefinition
} from "@/lib/types";
import { getYoudaoDictVoicePair } from "@/lib/utils";

const toTrimmedString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toPositiveInt = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
};

const asArray = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) {
    return value as T[];
  }
  return [];
};

const toRecord = (value: unknown): Record<string, unknown> | null => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
};

type RawTranslation = {
  desc_cn?: unknown;
  desc_other?: unknown;
  tran_cn?: unknown;
  tran_other?: unknown;
  pos?: unknown;
};

type RawSentence = {
  s_cn?: unknown;
  s_content?: unknown;
  s_content_eng?: unknown;
  s_speech?: unknown;
  [key: string]: unknown;
};

type RawAntonym = {
  hwd?: unknown;
  [key: string]: unknown;
};

type RawAntonymContainer = {
  desc?: unknown;
  anto?: RawAntonym[] | unknown;
} | null;

type RawSynonymWord = {
  w?: unknown;
};

type RawSynonymGroup = {
  pos?: unknown;
  tran?: unknown;
  hwds?: RawSynonymWord[] | unknown;
};

type RawPhrase = {
  p_content?: unknown;
  p_cn?: unknown;
  p_en?: unknown;
};

type RawRelWord = {
  hwd?: unknown;
  tran?: unknown;
};

type RawRelGroup = {
  pos?: unknown;
  words?: RawRelWord[] | unknown;
};

type RawExamChoice = {
  choice?: unknown;
  choice_index?: unknown;
};

type RawExamAnswer = {
  explain?: unknown;
  right_index?: unknown;
} | null;

type RawExamItem = {
  question?: unknown;
  exam_type?: unknown;
  choices?: RawExamChoice[] | unknown;
  answer?: RawExamAnswer;
};

type RawRealExamSentence = {
  s_content?: unknown;
  source_info?: Record<string, unknown> | unknown;
};

type RawRealExamContainer = {
  desc?: unknown;
  sentences?: RawRealExamSentence[] | unknown;
} | null;

type RawWordContent = {
  phone?: unknown;
  ukphone?: unknown;
  usphone?: unknown;
  ukspeech?: unknown;
  usspeech?: unknown;
  speech?: unknown;
  star?: unknown;
  picture?: unknown;
  rem_method?: { desc?: unknown; val?: unknown } | null;
  trans?: RawTranslation[] | unknown;
  sentence?: { desc?: unknown; sentences?: RawSentence[] | unknown } | null;
  syno?: { desc?: unknown; synos?: RawSynonymGroup[] | unknown } | null;
  phrase?: { desc?: unknown; phrases?: RawPhrase[] | unknown } | null;
  rel_word?: { desc?: unknown; rels?: RawRelGroup[] | unknown } | null;
  antos?: RawAntonymContainer;
  exam?: RawExamItem[] | unknown;
  real_exam_sentence?: RawRealExamContainer;
};

type RawWordEntry = {
  book_id?: unknown;
  head_word?: unknown;
  word_rank?: unknown;
  content?: {
    word?: {
      word_id?: unknown;
      word_head?: unknown;
      content?: RawWordContent | null;
    } | null;
  } | null;
};

export type NormalizationResult =
  | { ok: true; word: NormalizedWord }
  | { ok: false; reason: string };

const buildDefinitions = (content: RawWordContent | null | undefined): NormalizedWordDefinition[] => {
  const transArray = asArray<RawTranslation>(content?.trans);
  const definitions: NormalizedWordDefinition[] = [];

  for (const item of transArray) {
    const meaningCn = toTrimmedString(item?.tran_cn ?? null);
    const meaningEn = toTrimmedString(item?.tran_other ?? null);
    const note = toTrimmedString(item?.desc_other ?? null);
    const partOfSpeech = toTrimmedString(item?.desc_cn ?? null);
    const pos = toTrimmedString(item?.pos ?? null);

    if (meaningCn || meaningEn || note || partOfSpeech || pos) {
      definitions.push({
        partOfSpeech,
        pos,
        meaningCn,
        meaningEn,
        note,
        examples: []
      });
    }
  }

  return definitions;
};

const buildExamples = (content: RawWordContent | null | undefined): NormalizedExampleSentence[] => {
  const sentences = asArray<RawSentence>(content?.sentence?.sentences);
  const result: NormalizedExampleSentence[] = [];

  for (const item of sentences) {
    const source =
      toTrimmedString(item?.s_content ?? null) ??
      toTrimmedString(item?.s_content_eng ?? null);
    if (!source) {
      continue;
    }
    result.push({
      source,
      translation: toTrimmedString(item?.s_cn ?? null) ?? null,
      meta: item as Record<string, unknown>
    });
  }

  return result;
};

const buildSynonymGroups = (
  content: RawWordContent | null | undefined
): NormalizedSynonymGroup[] => {
  const synoGroups = asArray<RawSynonymGroup>(content?.syno?.synos);
  const groups: NormalizedSynonymGroup[] = [];

  for (const group of synoGroups) {
    const items = asArray<RawSynonymWord>(group?.hwds)
      .map((synonym) => toTrimmedString(synonym?.w ?? null))
      .filter((value): value is string => Boolean(value));

    const partOfSpeech = toTrimmedString(group?.pos ?? null);
    const meaningCn = toTrimmedString(group?.tran ?? null);

    if (items.length > 0 || partOfSpeech || meaningCn) {
      groups.push({
        partOfSpeech,
        meaningCn,
        note: null,
        items
      });
    }
  }

  return groups;
};

const buildPhrases = (content: RawWordContent | null | undefined): NormalizedPhrase[] => {
  const phrases = asArray<RawPhrase>(content?.phrase?.phrases);
  const result: NormalizedPhrase[] = [];

  for (const phrase of phrases) {
    const contentValue = toTrimmedString(phrase?.p_content ?? null);
    if (!contentValue) {
      continue;
    }
    result.push({
      content: contentValue,
      meaningCn: toTrimmedString(phrase?.p_cn ?? null) ?? null,
      meaningEn: toTrimmedString(phrase?.p_en ?? null) ?? null
    });
  }

  return result;
};

const buildRelatedWords = (
  content: RawWordContent | null | undefined
): NormalizedRelatedWord[] => {
  const relGroups = asArray<RawRelGroup>(content?.rel_word?.rels);
  const related: NormalizedRelatedWord[] = [];

  for (const group of relGroups) {
    const partOfSpeech = toTrimmedString(group?.pos ?? null);
    const words = asArray<RawRelWord>(group?.words);

    for (const word of words) {
      const headword = toTrimmedString(word?.hwd ?? null);
      if (!headword) {
        continue;
      }
      related.push({
        headword,
        partOfSpeech,
        meaningCn: toTrimmedString(word?.tran ?? null)
      });
    }
  }

  return related;
};

const buildAntonyms = (content: RawWordContent | null | undefined): NormalizedAntonym[] => {
  const rawAntonyms = asArray<RawAntonym>(content?.antos?.anto);
  const result: NormalizedAntonym[] = [];

  for (const entry of rawAntonyms) {
    const headword = toTrimmedString(entry?.hwd ?? null);
    if (!headword) {
      continue;
    }
    const metaSource = { ...entry };
    delete metaSource.hwd;
    const meta = Object.keys(metaSource).length > 0 ? metaSource : null;
    result.push({
      headword,
      meta
    });
  }

  return result;
};

const buildRealExamSentences = (
  content: RawWordContent | null | undefined
): NormalizedRealExamSentence[] => {
  const sentences = asArray<RawRealExamSentence>(content?.real_exam_sentence?.sentences);
  const result: NormalizedRealExamSentence[] = [];

  sentences.forEach((item, index) => {
    const sentenceContent = toTrimmedString(item?.s_content ?? null);
    if (!sentenceContent) {
      return;
    }

    const sourceInfo = toRecord(item?.source_info);
    result.push({
      content: sentenceContent,
      level: toTrimmedString(sourceInfo?.level ?? null),
      paper: toTrimmedString(sourceInfo?.paper ?? null),
      sourceType: toTrimmedString(sourceInfo?.type ?? null),
      year: toTrimmedString(sourceInfo?.year ?? null),
      order: index,
      sourceInfo
    });
  });

  return result;
};

const buildExamQuestions = (
  content: RawWordContent | null | undefined
): NormalizedExamQuestion[] => {
  const exams = asArray<RawExamItem>(content?.exam);
  const result: NormalizedExamQuestion[] = [];

  for (const item of exams) {
    const question = toTrimmedString(item?.question ?? null);
    if (!question) {
      continue;
    }

    const choices: NormalizedExamChoice[] = [];
    for (const choice of asArray<RawExamChoice>(item?.choices)) {
      const value = toTrimmedString(choice?.choice ?? null);
      if (!value) {
        continue;
      }
      const indexValue = toPositiveInt(choice?.choice_index ?? null);
      choices.push({
        value,
        index: indexValue ?? null
      });
    }

    const answer = item?.answer ?? null;

    result.push({
      question,
      examType: toPositiveInt(item?.exam_type ?? null),
      explanation: toTrimmedString(answer?.explain ?? null),
      rightIndex: toPositiveInt(answer?.right_index ?? null),
      choices
    });
  }

  return result;
};

export const normalizeDictionaryEntry = (entry: unknown): NormalizationResult => {
  if (!entry || typeof entry !== "object") {
    return { ok: false, reason: "数据不是对象格式" };
  }

  const raw = entry as RawWordEntry;
  const content = raw.content?.word?.content ?? null;

  const headword =
    toTrimmedString(raw.head_word ?? null) ?? toTrimmedString(raw.content?.word?.word_head ?? null);
  if (!headword) {
    return { ok: false, reason: "缺少有效的 head_word 字段" };
  }

  const voice = getYoudaoDictVoicePair(headword);

  const normalized: NormalizedWord = {
    headword,
    rank: toPositiveInt(raw.word_rank ?? null),
    bookId: toTrimmedString(raw.book_id ?? null),
    phoneticUs: toTrimmedString(content?.usphone ?? null),
    phoneticUk: toTrimmedString(content?.ukphone ?? null),
    audioUs: voice.us,
    audioUk: voice.uk,
    audioUsRaw: toTrimmedString(content?.usspeech ?? null),
    audioUkRaw: toTrimmedString(content?.ukspeech ?? null),
    phonetic: toTrimmedString(content?.phone ?? null),
    speech: toTrimmedString(content?.speech ?? null),
    star: toPositiveInt(content?.star ?? null),
    sourceWordId: toTrimmedString(raw.content?.word?.word_id ?? null),
    memoryTip: toTrimmedString(content?.rem_method?.val ?? null),
    memoryTipDesc: toTrimmedString(content?.rem_method?.desc ?? null),
    sentenceDesc: toTrimmedString(content?.sentence?.desc ?? null),
    synonymDesc: toTrimmedString(content?.syno?.desc ?? null),
    phraseDesc: toTrimmedString(content?.phrase?.desc ?? null),
    relatedDesc: toTrimmedString(content?.rel_word?.desc ?? null),
    antonymDesc: toTrimmedString(content?.antos?.desc ?? null),
    realExamSentenceDesc: toTrimmedString(content?.real_exam_sentence?.desc ?? null),
    pictureUrl: toTrimmedString(content?.picture ?? null),
    definitions: buildDefinitions(content),
    examples: buildExamples(content),
    synonymGroups: buildSynonymGroups(content),
    phrases: buildPhrases(content),
    relatedWords: buildRelatedWords(content),
    antonyms: buildAntonyms(content),
    realExamSentences: buildRealExamSentences(content),
    examQuestions: buildExamQuestions(content)
  };

  const validation = normalizedWordSchema.safeParse(normalized);
  if (!validation.success) {
    const reason = validation.error.errors.map((err) => err.message).join("；");
    return { ok: false, reason: reason || "转换后的数据未通过校验" };
  }

  return { ok: true, word: validation.data };
};
