import type { BookListItem, BookWithStats } from "@/lib/book-service";
import type { ImportSummary } from "@/lib/data-import";
import type { ListWordsResultItem } from "@/lib/types";
import type { WordWithRelations } from "@/lib/word-service";
import { getYoudaoDictVoicePair } from "@/lib/utils";

const toISOString = (value: Date) => value.toISOString();

export const serializeBookListItem = (book: BookListItem) => ({
  id: book.id,
  bookId: book.bookId,
  name: book.name,
  coverUrl: book.coverUrl,
  grade: book.grade,
  level: book.level,
  publisher: book.publisher,
  sortOrder: book.sortOrder,
  isActive: book.isActive,
  createdAt: toISOString(book.createdAt),
  updatedAt: toISOString(book.updatedAt),
  wordCount: book.wordCount
});

export const serializeBook = (book: BookWithStats) => ({
  id: book.id,
  bookId: book.bookId,
  name: book.name,
  description: book.description,
  coverUrl: book.coverUrl,
  grade: book.grade,
  level: book.level,
  publisher: book.publisher,
  tags: book.tags,
  sortOrder: book.sortOrder,
  isActive: book.isActive,
  createdAt: toISOString(book.createdAt),
  updatedAt: toISOString(book.updatedAt),
  wordCount: book.wordCount
});

export const serializeWordListItem = (item: ListWordsResultItem) => ({
  id: item.id,
  headword: item.headword,
  rank: item.rank,
  bookId: item.bookId,
  phoneticUs: item.phoneticUs,
  phoneticUk: item.phoneticUk,
  updatedAt: toISOString(item.updatedAt)
});

export const serializeWord = (word: WordWithRelations) => {
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
  createdAt: toISOString(word.created_at),
  updatedAt: toISOString(word.updated_at),
  definitions: word.definitions.map((definition) => ({
    id: definition.id,
    partOfSpeech: definition.part_of_speech,
      pos: definition.pos,
    meaningCn: definition.meaning_cn,
    meaningEn: definition.meaning_en,
    note: definition.note,
    examples: (definition.exampleSentences ?? []).map((example) => ({
      id: example.id,
      source: example.source,
      translation: example.translation,
      meta: example.meta ?? null
    }))
  })),
  examples: (word.exampleSentences ?? []).map((example) => ({
    id: example.id,
    source: example.source,
    translation: example.translation,
    meta: example.meta ?? null
  })),
  synonymGroups: word.synonymGroups.map((group) => ({
    id: group.id,
    partOfSpeech: group.part_of_speech,
    meaningCn: group.meaning_cn,
    note: group.note,
    items: (group.synos ?? []).map((synonym) => ({
      id: synonym.id,
      value: synonym.value
    }))
  })),
  phrases: word.phrases.map((phrase) => ({
    id: phrase.id,
    content: phrase.content,
    meaningCn: phrase.meaning_cn,
    meaningEn: phrase.meaning_en
  })),
  relatedWords: word.relatedWords.map((related) => ({
    id: related.id,
    headword: related.headword,
    partOfSpeech: related.part_of_speech,
    meaningCn: related.meaning_cn
  })),
    antonyms: word.antonyms.map((antonym) => ({
      id: antonym.id,
      value: antonym.value,
      meta: antonym.meta ?? null
    })),
    realExamSentences: word.realExamSentences.map((sentence) => ({
      id: sentence.id,
      content: sentence.content,
      level: sentence.level,
      paper: sentence.paper,
      sourceType: sentence.source_type,
      year: sentence.year,
      order: sentence.order,
      sourceInfo: sentence.meta ?? null
    })),
    examQuestions: word.examQuestions.map((question) => ({
      id: question.id,
      question: question.question,
      examType: question.exam_type,
      explanation: question.explanation,
      rightIndex: question.right_index,
      choices: question.choices.map((choice) => ({
        id: choice.id,
        value: choice.value,
        index: choice.choice_index
      }))
    })),
    importLogs: (word.importLogs ?? []).map((log) => ({
      id: log.id,
      status: log.status,
      message: log.message,
      rawHeadword: log.raw_headword,
      createdAt: toISOString(log.created_at)
    }))
  };
};

export const serializeImportSummary = (summary: ImportSummary) => ({
  total: summary.total,
  success: summary.success,
  skipped: summary.skipped,
  failed: summary.failed,
  batchId: summary.batchId,
  errors: summary.errors.map((error) => ({
    index: error.index,
    headword: error.headword,
    reason: error.reason,
    status: error.status
  }))
});
