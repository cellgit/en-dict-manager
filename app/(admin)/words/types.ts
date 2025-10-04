import type { ChangeEvent, FormEvent } from "react";

import type { NormalizedWordInput } from "@/app/words/schemas";
import type { ListWordsResultItem } from "@/lib/types";

export type FormMode = "create" | "edit";

export type DefinitionForm = NormalizedWordInput["definitions"][number];
export type ExampleForm = NormalizedWordInput["examples"][number];
export type SynonymGroupForm = NormalizedWordInput["synonymGroups"][number];
export type PhraseForm = NormalizedWordInput["phrases"][number];
export type RelatedWordForm = NormalizedWordInput["relatedWords"][number];
export type AntonymForm = NormalizedWordInput["antonyms"][number];
export type RealExamSentenceForm = NormalizedWordInput["realExamSentences"][number];
export type ExamQuestionForm = NormalizedWordInput["examQuestions"][number];
export type ExamChoiceForm = ExamQuestionForm["choices"][number];

export type InputChangeEvent = ChangeEvent<HTMLInputElement>;
export type TextareaChangeEvent = ChangeEvent<HTMLTextAreaElement>;

export type WordListState = {
  items: ListWordsResultItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type WordViewModel = {
  id: string;
  headword: string;
  rank: number | null;
  bookId: string | null;
  phoneticUs: string | null;
  phoneticUk: string | null;
  phonetic: string | null;
  speech: string | null;
  star: number | null;
  audioUs: string | null;
  audioUk: string | null;
  audioUsRaw: string | null;
  audioUkRaw: string | null;
  memoryTip: string | null;
  memoryTipDesc: string | null;
  sentenceDesc: string | null;
  synonymDesc: string | null;
  phraseDesc: string | null;
  relatedDesc: string | null;
  antonymDesc: string | null;
  realExamSentenceDesc: string | null;
  pictureUrl: string | null;
  sourceWordId: string | null;
  createdAt: Date;
  updatedAt: Date;
  definitions: Array<{
    descCn: string | null;
    descOther: string | null;
    pos: string | null;
    tranCn: string | null;
    tranOther: string | null;
    examples: Array<{ source: string; translation: string | null }>;
  }>;
  examples: Array<{ source: string; translation: string | null }>;
  synonymGroups: Array<{
    pos: string | null;
    meaningCn: string | null;
    note: string | null;
    items: string[];
  }>;
  phrases: Array<{ content: string; meaningCn: string | null; meaningEn: string | null }>;
  relatedWords: Array<{ headword: string; pos: string | null; meaningCn: string | null }>;
  antonyms: Array<{ value: string; meta: Record<string, unknown> | null }>;
  realExamSentences: Array<{
    content: string;
    level: string | null;
    paper: string | null;
    sourceType: string | null;
    year: string | null;
    order: number | null;
    sourceInfo: Record<string, unknown> | null;
  }>;
  examQuestions: Array<{
    question: string;
    examType: number | null;
    explanation: string | null;
    rightIndex: number | null;
    choices: Array<{ value: string; index: number | null }>;
  }>;
  importLogs: Array<{
    id: string;
    status: string;
    message: string | null;
    createdAt: Date;
    rawHeadword: string;
  }>;
};

export type WordFormProps = {
  formData: NormalizedWordInput;
  setFormData: (value: NormalizedWordInput) => void;
};

export type WordEditorSheetProps = {
  mode: FormMode;
  formData: NormalizedWordInput;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitting: boolean;
  submitDisabled: boolean;
  setFormData: (value: NormalizedWordInput) => void;
  error: string | null;
};
