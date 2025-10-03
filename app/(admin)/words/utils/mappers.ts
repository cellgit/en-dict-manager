import type { NormalizedWordInput } from "@/app/words/schemas";
import type { WordWithRelations } from "@/lib/word-service";
import type { WordViewModel } from "@/app/(admin)/words/types";
import { getYoudaoDictVoicePair } from "@/lib/utils";

export const mapWordToForm = (word: WordWithRelations): NormalizedWordInput => {
  const voice = getYoudaoDictVoicePair(word.headword);
  return {
    headword: word.headword,
    rank: word.rank,
    bookId: word.book_id,
    phoneticUs: word.phonetic_us,
    phoneticUk: word.phonetic_uk,
    audioUs: voice.us,
    audioUk: voice.uk,
    memoryTip: word.memory_tip,
  definitions: word.definitions.map((definition) => ({
    partOfSpeech: definition.part_of_speech,
    meaningCn: definition.meaning_cn,
    meaningEn: definition.meaning_en,
    note: definition.note,
    examples: definition.exampleSentences.map((example) => ({
      source: example.source,
      translation: example.translation ?? null,
      meta: example.meta ? (example.meta as Record<string, unknown>) : null
    }))
  })),
  examples: word.exampleSentences.map((example) => ({
    source: example.source,
    translation: example.translation ?? null,
    meta: example.meta ? (example.meta as Record<string, unknown>) : null
  })),
  synonymGroups: word.synonymGroups.map((group) => ({
    partOfSpeech: group.part_of_speech,
    meaningCn: group.meaning_cn,
    note: group.note,
    items: group.synos.map((syn) => syn.value)
  })),
  phrases: word.phrases.map((phrase) => ({
    content: phrase.content,
    meaningCn: phrase.meaning_cn,
    meaningEn: phrase.meaning_en
  })),
  relatedWords: word.relatedWords.map((related) => ({
    headword: related.headword,
    partOfSpeech: related.part_of_speech,
    meaningCn: related.meaning_cn
  }))
  };
};

export const mapWordToViewModel = (word: WordWithRelations): WordViewModel => {
  const voice = getYoudaoDictVoicePair(word.headword);
  return {
    id: word.id,
    headword: word.headword,
    rank: word.rank,
    bookId: word.book_id,
    phoneticUs: word.phonetic_us,
    phoneticUk: word.phonetic_uk,
    audioUs: voice.us,
    audioUk: voice.uk,
    memoryTip: word.memory_tip,
  createdAt: new Date(word.created_at),
  updatedAt: new Date(word.updated_at),
  definitions: word.definitions.map((definition) => ({
    partOfSpeech: definition.part_of_speech,
    meaningCn: definition.meaning_cn,
    meaningEn: definition.meaning_en,
    note: definition.note,
    examples: definition.exampleSentences.map((example) => ({
      source: example.source,
      translation: example.translation ?? null
    }))
  })),
  examples: word.exampleSentences.map((example) => ({
    source: example.source,
    translation: example.translation ?? null
  })),
  synonymGroups: word.synonymGroups.map((group) => ({
    partOfSpeech: group.part_of_speech,
    meaningCn: group.meaning_cn,
    note: group.note,
    items: group.synos.map((syn) => syn.value)
  })),
  phrases: word.phrases.map((phrase) => ({
    content: phrase.content,
    meaningCn: phrase.meaning_cn,
    meaningEn: phrase.meaning_en
  })),
  relatedWords: word.relatedWords.map((related) => ({
    headword: related.headword,
    partOfSpeech: related.part_of_speech,
    meaningCn: related.meaning_cn
  })),
  importLogs: (word.importLogs ?? []).map((log) => ({
    id: log.id,
    status: log.status,
    message: log.message,
    rawHeadword: log.raw_headword,
    createdAt: new Date(log.created_at)
  }))
  };
};
