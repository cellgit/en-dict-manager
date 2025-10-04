import type { NormalizedWordInput } from "@/app/words/schemas";
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

export type DefinitionInput = NormalizedWordInput["definitions"][number];
export type ExampleInput = NormalizedWordInput["examples"][number];
export type SynonymGroupInput = NormalizedWordInput["synonymGroups"][number];
export type PhraseInput = NormalizedWordInput["phrases"][number];
export type RelatedWordInput = NormalizedWordInput["relatedWords"][number];
export type AntonymInput = NormalizedWordInput["antonyms"][number];
export type ExamQuestionInput = NormalizedWordInput["examQuestions"][number];
export type ExamChoiceInput = ExamQuestionInput["choices"][number];
export type RealExamSentenceInput = NormalizedWordInput["realExamSentences"][number];

export const toNullableString = (value?: string | null): string | null => {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const toNullableInt = (value?: number | null): number | null => {
  if (value === undefined || value === null) {
    return null;
  }
  return Number.isFinite(value) ? Math.trunc(value) : null;
};

export const createEmptyDefinition = (): DefinitionInput => ({
  partOfSpeech: "",
  pos: "",
  meaningCn: "",
  meaningEn: "",
  note: "",
  examples: []
});

export const createEmptyExample = (): ExampleInput => ({
  source: "",
  translation: "",
  meta: null
});

export const createEmptySynonymGroup = (): SynonymGroupInput => ({
  partOfSpeech: "",
  meaningCn: "",
  note: "",
  items: [""]
});

export const createEmptyPhrase = (): PhraseInput => ({
  content: "",
  meaningCn: "",
  meaningEn: ""
});

export const createEmptyRelatedWord = (): RelatedWordInput => ({
  headword: "",
  partOfSpeech: "",
  meaningCn: ""
});

export const createEmptyAntonym = (): AntonymInput => ({
  headword: "",
  meta: null
});

export const createEmptyExamChoice = (): ExamChoiceInput => ({
  value: "",
  index: null
});

export const createEmptyExamQuestion = (): ExamQuestionInput => ({
  question: "",
  examType: null,
  explanation: "",
  rightIndex: null,
  choices: [createEmptyExamChoice()]
});

export const createEmptyRealExamSentence = (): RealExamSentenceInput => ({
  content: "",
  level: "",
  paper: "",
  sourceType: "",
  year: "",
  order: null,
  sourceInfo: null
});

export const createEmptyWordInput = (): NormalizedWordInput => ({
  headword: "",
  rank: null,
  bookId: null,
  phoneticUs: null,
  phoneticUk: null,
  audioUs: null,
  audioUk: null,
  audioUsRaw: null,
  audioUkRaw: null,
  phonetic: null,
  speech: null,
  star: null,
  sourceWordId: null,
  memoryTip: null,
  memoryTipDesc: null,
  sentenceDesc: null,
  synonymDesc: null,
  phraseDesc: null,
  relatedDesc: null,
  antonymDesc: null,
  realExamSentenceDesc: null,
  pictureUrl: null,
  definitions: [],
  examples: [],
  synonymGroups: [],
  phrases: [],
  relatedWords: [],
  antonyms: [],
  realExamSentences: [],
  examQuestions: []
});

const normalizeDefinition = (definition: DefinitionInput): NormalizedWordDefinition => ({
  partOfSpeech: toNullableString(definition.partOfSpeech),
  pos: toNullableString(definition.pos),
  meaningCn: toNullableString(definition.meaningCn),
  meaningEn: toNullableString(definition.meaningEn),
  note: toNullableString(definition.note),
  examples: definition.examples
    .map((example) => normalizeExample(example))
    .filter((example) => example.source.length > 0)
});

const normalizeExample = (example: ExampleInput): NormalizedExampleSentence => ({
  source: example.source.trim(),
  translation: toNullableString(example.translation),
  meta: example.meta ?? null
});

const normalizeSynonymGroup = (group: SynonymGroupInput): NormalizedSynonymGroup => ({
  partOfSpeech: toNullableString(group.partOfSpeech),
  meaningCn: toNullableString(group.meaningCn),
  note: toNullableString(group.note),
  items: group.items
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
});

const normalizePhrase = (phrase: PhraseInput): NormalizedPhrase | null => {
  const content = phrase.content.trim();
  if (!content) {
    return null;
  }
  return {
    content,
    meaningCn: toNullableString(phrase.meaningCn),
    meaningEn: toNullableString(phrase.meaningEn)
  };
};

const normalizeRelatedWord = (related: RelatedWordInput): NormalizedRelatedWord | null => {
  const headword = related.headword.trim();
  if (!headword) {
    return null;
  }
  return {
    headword,
    partOfSpeech: toNullableString(related.partOfSpeech),
    meaningCn: toNullableString(related.meaningCn)
  };
};

const normalizeAntonym = (antonym: AntonymInput): NormalizedAntonym | null => {
  const headword = antonym.headword.trim();
  if (!headword) {
    return null;
  }
  return {
    headword,
    meta: antonym.meta ?? null
  };
};

const normalizeExamChoice = (choice: ExamChoiceInput): NormalizedExamChoice | null => {
  const value = choice.value.trim();
  if (!value) {
    return null;
  }
  return {
    value,
    index: toNullableInt(choice.index)
  };
};

const normalizeExamQuestion = (question: ExamQuestionInput): NormalizedExamQuestion | null => {
  const q = question.question.trim();
  if (!q) {
    return null;
  }
  const choices = question.choices
    .map((choice) => normalizeExamChoice(choice))
    .filter((choice): choice is NormalizedExamChoice => Boolean(choice));
  return {
    question: q,
    examType: toNullableInt(question.examType),
    explanation: toNullableString(question.explanation),
    rightIndex: toNullableInt(question.rightIndex),
    choices
  };
};

const normalizeRealExamSentence = (
  sentence: RealExamSentenceInput
): NormalizedRealExamSentence | null => {
  const content = sentence.content.trim();
  if (!content) {
    return null;
  }
  return {
    content,
    level: toNullableString(sentence.level),
    paper: toNullableString(sentence.paper),
    sourceType: toNullableString(sentence.sourceType),
    year: toNullableString(sentence.year),
    order: toNullableInt(sentence.order),
    sourceInfo: sentence.sourceInfo ?? null
  };
};

export const sanitizeWordInput = (form: NormalizedWordInput): NormalizedWord => ({
  headword: form.headword.trim(),
  rank: form.rank ?? null,
  bookId: toNullableString(form.bookId),
  phoneticUs: toNullableString(form.phoneticUs),
  phoneticUk: toNullableString(form.phoneticUk),
  audioUs: toNullableString(form.audioUs),
  audioUk: toNullableString(form.audioUk),
  audioUsRaw: toNullableString(form.audioUsRaw),
  audioUkRaw: toNullableString(form.audioUkRaw),
  phonetic: toNullableString(form.phonetic),
  speech: toNullableString(form.speech),
  star: toNullableInt(form.star),
  sourceWordId: toNullableString(form.sourceWordId),
  memoryTip: toNullableString(form.memoryTip),
  memoryTipDesc: toNullableString(form.memoryTipDesc),
  sentenceDesc: toNullableString(form.sentenceDesc),
  synonymDesc: toNullableString(form.synonymDesc),
  phraseDesc: toNullableString(form.phraseDesc),
  relatedDesc: toNullableString(form.relatedDesc),
  antonymDesc: toNullableString(form.antonymDesc),
  realExamSentenceDesc: toNullableString(form.realExamSentenceDesc),
  pictureUrl: toNullableString(form.pictureUrl),
  definitions: form.definitions
    .map((definition) => normalizeDefinition(definition))
    .filter((definition) =>
      definition.partOfSpeech !== null ||
      definition.pos !== null ||
      definition.meaningCn !== null ||
      definition.meaningEn !== null ||
      definition.note !== null ||
      definition.examples.length > 0
    ),
  examples: form.examples
    .map((example) => normalizeExample(example))
    .filter((example) => example.source.length > 0),
  synonymGroups: form.synonymGroups
    .map((group) => normalizeSynonymGroup(group))
    .filter((group) =>
      group.partOfSpeech !== null ||
      group.meaningCn !== null ||
      group.note !== null ||
      group.items.length > 0
    ),
  phrases: form.phrases
    .map((phrase) => normalizePhrase(phrase))
    .filter((phrase): phrase is NormalizedPhrase => Boolean(phrase)),
  relatedWords: form.relatedWords
    .map((related) => normalizeRelatedWord(related))
    .filter((related): related is NormalizedRelatedWord => Boolean(related)),
  antonyms: form.antonyms
    .map((antonym) => normalizeAntonym(antonym))
    .filter((antonym): antonym is NormalizedAntonym => Boolean(antonym)),
  realExamSentences: form.realExamSentences
    .map((sentence) => normalizeRealExamSentence(sentence))
    .filter((sentence): sentence is NormalizedRealExamSentence => Boolean(sentence)),
  examQuestions: form.examQuestions
    .map((question) => normalizeExamQuestion(question))
    .filter((question): question is NormalizedExamQuestion => Boolean(question))
});

export const sanitizeWordInputForForm = (form: NormalizedWordInput): NormalizedWordInput => {
  return sanitizeWordInput(form) as NormalizedWordInput;
};
