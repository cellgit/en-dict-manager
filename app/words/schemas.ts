import { z } from "zod";

const metaSchema = z.record(z.string(), z.unknown());

export const exampleSentenceSchema = z.object({
  source: z.string().trim().min(1, "例句内容不能为空"),
  translation: z.string().trim().optional().nullable(),
  meta: metaSchema.optional().nullable()
});

export const wordDefinitionSchema = z.object({
  partOfSpeech: z.string().trim().optional().nullable(),
  pos: z.string().trim().optional().nullable(),
  meaningCn: z.string().trim().optional().nullable(),
  meaningEn: z.string().trim().optional().nullable(),
  note: z.string().trim().optional().nullable(),
  examples: z.array(exampleSentenceSchema).default([])
});

export const synonymGroupSchema = z.object({
  partOfSpeech: z.string().trim().optional().nullable(),
  meaningCn: z.string().trim().optional().nullable(),
  note: z.string().trim().optional().nullable(),
  items: z.array(z.string().trim().min(1, "近义词不能为空")).default([])
});

export const phraseSchema = z.object({
  content: z.string().trim().min(1, "短语内容不能为空"),
  meaningCn: z.string().trim().optional().nullable(),
  meaningEn: z.string().trim().optional().nullable()
});

export const relatedWordSchema = z.object({
  headword: z.string().trim().min(1, "相关词不能为空"),
  partOfSpeech: z.string().trim().optional().nullable(),
  meaningCn: z.string().trim().optional().nullable()
});

export const antonymSchema = z.object({
  headword: z.string().trim().min(1, "反义词不能为空"),
  meta: metaSchema.optional().nullable()
});

export const examChoiceSchema = z.object({
  value: z.string().trim().min(1, "选项内容不能为空"),
  index: z.number().int().optional().nullable()
});

export const examQuestionSchema = z.object({
  question: z.string().trim().min(1, "题干不能为空"),
  examType: z.number().int().optional().nullable(),
  explanation: z.string().trim().optional().nullable(),
  rightIndex: z.number().int().optional().nullable(),
  choices: z.array(examChoiceSchema).default([])
});

export const realExamSentenceSchema = z.object({
  content: z.string().trim().min(1, "真题例句内容不能为空"),
  level: z.string().trim().optional().nullable(),
  paper: z.string().trim().optional().nullable(),
  sourceType: z.string().trim().optional().nullable(),
  year: z.string().trim().optional().nullable(),
  order: z.number().int().optional().nullable(),
  sourceInfo: metaSchema.optional().nullable()
});

export const normalizedWordSchema = z.object({
  headword: z.string().trim().min(1, "单词必填"),
  rank: z.number().int().positive().optional().nullable(),
  bookId: z.string().trim().optional().nullable(),
  phoneticUs: z.string().trim().optional().nullable(),
  phoneticUk: z.string().trim().optional().nullable(),
  audioUs: z.string().trim().optional().nullable(),
  audioUk: z.string().trim().optional().nullable(),
  audioUsRaw: z.string().trim().optional().nullable(),
  audioUkRaw: z.string().trim().optional().nullable(),
  phonetic: z.string().trim().optional().nullable(),
  speech: z.string().trim().optional().nullable(),
  star: z.number().int().nonnegative().optional().nullable(),
  sourceWordId: z.string().trim().optional().nullable(),
  memoryTip: z.string().trim().optional().nullable(),
  memoryTipDesc: z.string().trim().optional().nullable(),
  sentenceDesc: z.string().trim().optional().nullable(),
  synonymDesc: z.string().trim().optional().nullable(),
  phraseDesc: z.string().trim().optional().nullable(),
  relatedDesc: z.string().trim().optional().nullable(),
  antonymDesc: z.string().trim().optional().nullable(),
  realExamSentenceDesc: z.string().trim().optional().nullable(),
  pictureUrl: z.string().trim().optional().nullable(),
  definitions: z.array(wordDefinitionSchema).default([]),
  examples: z.array(exampleSentenceSchema).default([]),
  synonymGroups: z.array(synonymGroupSchema).default([]),
  phrases: z.array(phraseSchema).default([]),
  relatedWords: z.array(relatedWordSchema).default([]),
  antonyms: z.array(antonymSchema).default([]),
  realExamSentences: z.array(realExamSentenceSchema).default([]),
  examQuestions: z.array(examQuestionSchema).default([])
});

export const listWordsInputSchema = z.object({
  query: z.string().trim().optional(),
  bookId: z.string().trim().optional(),
  skip: z.number().int().nonnegative().default(0),
  take: z.number().int().positive().max(100).default(20),
  exact: z.boolean().optional().default(false)
});

export const getWordInputSchema = z.object({
  id: z.string().uuid({ message: "无效的词条 ID" })
});

export const createWordInputSchema = z.object({
  word: normalizedWordSchema
});

export const updateWordInputSchema = z.object({
  id: z.string().uuid({ message: "无效的词条 ID" }),
  word: normalizedWordSchema
});

export const deleteWordInputSchema = z.object({
  id: z.string().uuid({ message: "无效的词条 ID" })
});

export type NormalizedWordInput = z.infer<typeof normalizedWordSchema>;
export type ListWordsInput = z.infer<typeof listWordsInputSchema>;
export type GetWordInput = z.infer<typeof getWordInputSchema>;
export type CreateWordInput = z.infer<typeof createWordInputSchema>;
export type UpdateWordInput = z.infer<typeof updateWordInputSchema>;
export type DeleteWordInput = z.infer<typeof deleteWordInputSchema>;
