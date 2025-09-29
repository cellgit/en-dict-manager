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

export interface NormalizedWord {
  headword: string;
  rank?: number | null;
  bookId?: string | null;
  phoneticUs?: string | null;
  phoneticUk?: string | null;
  audioUs?: string | null;
  audioUk?: string | null;
  memoryTip?: string | null;
  definitions: NormalizedWordDefinition[];
  examples: NormalizedExampleSentence[];
  synonymGroups: NormalizedSynonymGroup[];
  phrases: NormalizedPhrase[];
  relatedWords: NormalizedRelatedWord[];
}

export interface ListWordsParams {
  query?: string;
  skip?: number;
  take?: number;
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
