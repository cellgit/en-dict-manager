import { z } from "zod";

const metaSchema = z.record(z.string(), z.unknown());

export const exampleSentenceSchema = z.object({
  source: z.string().trim().min(1, "例句内容不能为空"),
  translation: z.string().trim().optional().nullable(),
  meta: metaSchema.optional().nullable()
});

export const wordDefinitionSchema = z.object({
  partOfSpeech: z.string().trim().optional().nullable(),
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

export const normalizedWordSchema = z.object({
  headword: z.string().trim().min(1, "单词必填"),
  rank: z.number().int().positive().optional().nullable(),
  bookId: z.string().trim().optional().nullable(),
  phoneticUs: z.string().trim().optional().nullable(),
  phoneticUk: z.string().trim().optional().nullable(),
  audioUs: z.string().trim().optional().nullable(),
  audioUk: z.string().trim().optional().nullable(),
  memoryTip: z.string().trim().optional().nullable(),
  definitions: z.array(wordDefinitionSchema).default([]),
  examples: z.array(exampleSentenceSchema).default([]),
  synonymGroups: z.array(synonymGroupSchema).default([]),
  phrases: z.array(phraseSchema).default([]),
  relatedWords: z.array(relatedWordSchema).default([])
});

export const listWordsInputSchema = z.object({
  query: z.string().trim().optional(),
  skip: z.number().int().nonnegative().default(0),
  take: z.number().int().positive().max(100).default(20)
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
