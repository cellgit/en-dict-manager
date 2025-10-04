/**
 * 统一的数据结构定义，确保服务层、导入流程与 UI 使用同一套类型。
 */
export interface NormalizedExampleSentence {
  source: string;
  translation?: string | null;
  meta?: Record<string, unknown> | null;
}

export interface NormalizedWordDefinition {
  partOfSpeech?: string | null;
  pos?: string | null;
  meaningCn?: string | null;
  meaningEn?: string | null;
  note?: string | null;
  examples: NormalizedExampleSentence[];
}

export interface NormalizedSynonymGroup {
  partOfSpeech?: string | null;
  meaningCn?: string | null;
  note?: string | null;
  items: string[];
}

export interface NormalizedPhrase {
  content: string;
  meaningCn?: string | null;
  meaningEn?: string | null;
}

export interface NormalizedRelatedWord {
  headword: string;
  partOfSpeech?: string | null;
  meaningCn?: string | null;
}

export interface NormalizedAntonym {
  headword: string;
  meta?: Record<string, unknown> | null;
}

export interface NormalizedExamChoice {
  value: string;
  index?: number | null;
}

export interface NormalizedExamQuestion {
  question: string;
  examType?: number | null;
  explanation?: string | null;
  rightIndex?: number | null;
  choices: NormalizedExamChoice[];
}

export interface NormalizedRealExamSentence {
  content: string;
  level?: string | null;
  paper?: string | null;
  sourceType?: string | null;
  year?: string | null;
  order?: number | null;
  sourceInfo?: Record<string, unknown> | null;
}

export interface NormalizedWord {
  headword: string;
  rank?: number | null;
  bookId?: string | null;
  phoneticUs?: string | null;
  phoneticUk?: string | null;
  audioUs?: string | null;
  audioUk?: string | null;
  audioUsRaw?: string | null;
  audioUkRaw?: string | null;
  phonetic?: string | null;
  speech?: string | null;
  star?: number | null;
  sourceWordId?: string | null;
  memoryTip?: string | null;
  memoryTipDesc?: string | null;
  sentenceDesc?: string | null;
  synonymDesc?: string | null;
  phraseDesc?: string | null;
  relatedDesc?: string | null;
  antonymDesc?: string | null;
  realExamSentenceDesc?: string | null;
  pictureUrl?: string | null;
  definitions: NormalizedWordDefinition[];
  examples: NormalizedExampleSentence[];
  synonymGroups: NormalizedSynonymGroup[];
  phrases: NormalizedPhrase[];
  relatedWords: NormalizedRelatedWord[];
  antonyms: NormalizedAntonym[];
  realExamSentences: NormalizedRealExamSentence[];
  examQuestions: NormalizedExamQuestion[];
}

export interface ListWordsParams {
  query?: string;
  bookId?: string;
  skip?: number;
  take?: number;
  exact?: boolean;
}

export interface ListWordsResultItem {
  id: string;
  headword: string;
  rank: number | null;
  bookId: string | null;
  phoneticUs: string | null;
  phoneticUk: string | null;
  updatedAt: Date;
}

export interface ListWordsResult {
  items: ListWordsResultItem[];
  total: number;
}
