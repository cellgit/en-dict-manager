import type { ChangeEvent, FormEvent } from "react";

import type { NormalizedWordInput } from "@/app/words/schemas";
import type { ListWordsResultItem } from "@/lib/types";

export type FormMode = "create" | "edit";

export type DefinitionForm = NormalizedWordInput["definitions"][number];
export type ExampleForm = NormalizedWordInput["examples"][number];
export type SynonymGroupForm = NormalizedWordInput["synonymGroups"][number];
export type PhraseForm = NormalizedWordInput["phrases"][number];
export type RelatedWordForm = NormalizedWordInput["relatedWords"][number];

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
  audioUs: string | null;
  audioUk: string | null;
  memoryTip: string | null;
  createdAt: Date;
  updatedAt: Date;
  definitions: Array<{
    partOfSpeech: string | null;
    meaningCn: string | null;
    meaningEn: string | null;
    note: string | null;
    examples: Array<{ source: string; translation: string | null }>;
  }>;
  examples: Array<{ source: string; translation: string | null }>;
  synonymGroups: Array<{
    partOfSpeech: string | null;
    meaningCn: string | null;
    note: string | null;
    items: string[];
  }>;
  phrases: Array<{ content: string; meaningCn: string | null; meaningEn: string | null }>;
  relatedWords: Array<{ headword: string; partOfSpeech: string | null; meaningCn: string | null }>;
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
