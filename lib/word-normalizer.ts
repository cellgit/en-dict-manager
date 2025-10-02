import type { NormalizedWordInput } from "@/app/words/schemas";
import type {
  NormalizedExampleSentence,
  NormalizedPhrase,
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

export const createEmptyWordInput = (): NormalizedWordInput => ({
  headword: "",
  rank: null,
  bookId: null,
  phoneticUs: null,
  phoneticUk: null,
  audioUs: null,
  audioUk: null,
  memoryTip: null,
  definitions: [],
  examples: [],
  synonymGroups: [],
  phrases: [],
  relatedWords: []
});

const normalizeDefinition = (definition: DefinitionInput): NormalizedWordDefinition => ({
  partOfSpeech: toNullableString(definition.partOfSpeech),
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

export const sanitizeWordInput = (form: NormalizedWordInput): NormalizedWord => ({
  headword: form.headword.trim(),
  rank: form.rank ?? null,
  bookId: toNullableString(form.bookId),
  phoneticUs: toNullableString(form.phoneticUs),
  phoneticUk: toNullableString(form.phoneticUk),
  audioUs: toNullableString(form.audioUs),
  audioUk: toNullableString(form.audioUk),
  memoryTip: toNullableString(form.memoryTip),
  definitions: form.definitions
    .map((definition) => normalizeDefinition(definition))
    .filter((definition) =>
      definition.partOfSpeech !== null ||
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
    .filter((related): related is NormalizedRelatedWord => Boolean(related))
});

export const sanitizeWordInputForForm = (form: NormalizedWordInput): NormalizedWordInput => {
  return sanitizeWordInput(form) as NormalizedWordInput;
};
