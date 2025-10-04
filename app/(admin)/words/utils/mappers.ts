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
    phonetic: word.phonetic,
    speech: word.speech_text,
    star: word.star,
    audioUs: word.audio_us ?? voice.us,
    audioUk: word.audio_uk ?? voice.uk,
    audioUsRaw: word.audio_us_raw,
    audioUkRaw: word.audio_uk_raw,
    memoryTip: word.memory_tip,
    memoryTipDesc: word.memory_tip_desc,
    sentenceDesc: word.sentence_desc,
    synonymDesc: word.synonym_desc,
    phraseDesc: word.phrase_desc,
    relatedDesc: word.related_desc,
    antonymDesc: word.antonym_desc,
    realExamSentenceDesc: word.real_exam_sentence_desc,
    pictureUrl: word.picture_url,
    sourceWordId: word.source_word_id,
  definitions: word.definitions.map((definition) => ({
    descCn: definition.desc_cn ?? null,
    descOther: definition.desc_other ?? null,
    pos: definition.pos ?? null,
    tranCn: definition.tran_cn ?? null,
    tranOther: definition.tran_other ?? null,
    examples: (definition.exampleSentences ?? []).map((example) => ({
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
    pos: group.pos ?? null,
    meaningCn: group.meaning_cn ?? null,
    note: group.note ?? null,
    items: (group.synos ?? []).map((syn) => syn.value)
  })),
  phrases: word.phrases.map((phrase) => ({
    content: phrase.content,
    meaningCn: phrase.meaning_cn,
    meaningEn: phrase.meaning_en
  })),
  relatedWords: word.relatedWords.map((related) => ({
    headword: related.headword,
    pos: related.pos ?? null,
    meaningCn: related.meaning_cn ?? null
  })),
    antonyms: word.antonyms.map((antonym) => ({
      headword: antonym.value,
      meta: antonym.meta ? (antonym.meta as Record<string, unknown>) : null
    })),
    realExamSentences: word.realExamSentences.map((sentence) => ({
      content: sentence.content,
      level: sentence.level,
      paper: sentence.paper,
      sourceType: sentence.source_type,
      year: sentence.year,
      order: sentence.order,
      sourceInfo: sentence.meta ? (sentence.meta as Record<string, unknown>) : null
    })),
    examQuestions: word.examQuestions.map((question) => ({
      question: question.question,
      examType: question.exam_type,
      explanation: question.explanation,
      rightIndex: question.right_index,
      choices: question.choices.map((choice) => ({
        value: choice.value,
        index: choice.choice_index
      }))
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
    phonetic: word.phonetic,
    speech: word.speech_text,
    star: word.star,
    audioUs: word.audio_us ?? voice.us,
    audioUk: word.audio_uk ?? voice.uk,
    audioUsRaw: word.audio_us_raw,
    audioUkRaw: word.audio_uk_raw,
    memoryTip: word.memory_tip,
    memoryTipDesc: word.memory_tip_desc,
    sentenceDesc: word.sentence_desc,
    synonymDesc: word.synonym_desc,
    phraseDesc: word.phrase_desc,
    relatedDesc: word.related_desc,
    antonymDesc: word.antonym_desc,
    realExamSentenceDesc: word.real_exam_sentence_desc,
    pictureUrl: word.picture_url,
    sourceWordId: word.source_word_id,
  createdAt: new Date(word.created_at),
  updatedAt: new Date(word.updated_at),
  definitions: word.definitions.map((definition) => ({
    descCn: definition.desc_cn ?? null,
    descOther: definition.desc_other ?? null,
    pos: definition.pos ?? null,
    tranCn: definition.tran_cn ?? null,
    tranOther: definition.tran_other ?? null,
    examples: (definition.exampleSentences ?? []).map((example) => ({
      source: example.source,
      translation: example.translation ?? null
    }))
  })),
  examples: word.exampleSentences.map((example) => ({
    source: example.source,
    translation: example.translation ?? null
  })),
  synonymGroups: word.synonymGroups.map((group) => ({
    pos: group.pos ?? null,
    meaningCn: group.meaning_cn ?? null,
    note: group.note ?? null,
    items: (group.synos ?? []).map((syn) => syn.value)
  })),
  phrases: word.phrases.map((phrase) => ({
    content: phrase.content,
    meaningCn: phrase.meaning_cn,
    meaningEn: phrase.meaning_en
  })),
  relatedWords: word.relatedWords.map((related) => ({
    headword: related.headword,
    pos: related.pos ?? null,
    meaningCn: related.meaning_cn ?? null
  })),
    antonyms: word.antonyms.map((antonym) => ({
      value: antonym.value,
      meta: antonym.meta ? (antonym.meta as Record<string, unknown>) : null
    })),
    realExamSentences: word.realExamSentences.map((sentence) => ({
      content: sentence.content,
      level: sentence.level,
      paper: sentence.paper,
      sourceType: sentence.source_type,
      year: sentence.year,
      order: sentence.order,
      sourceInfo: sentence.meta ? (sentence.meta as Record<string, unknown>) : null
    })),
    examQuestions: word.examQuestions.map((question) => ({
      question: question.question,
      examType: question.exam_type,
      explanation: question.explanation,
      rightIndex: question.right_index,
      choices: question.choices.map((choice) => ({
        value: choice.value,
        index: choice.choice_index
      }))
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
