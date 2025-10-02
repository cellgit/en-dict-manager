import { z } from "zod";

/**
 * 单词书输入验证 schema
 */
export const bookInputSchema = z.object({
  bookId: z.string().min(1, "单词书 ID 不能为空").max(255, "单词书 ID 过长"),
  name: z.string().min(1, "单词书名称不能为空").max(255, "单词书名称过长"),
  description: z.string().max(5000, "描述过长").nullable().optional(),
  coverUrl: z.string().url("封面链接格式错误").nullable().optional().or(z.literal("")),
  grade: z.string().max(64, "年级信息过长").nullable().optional(),
  level: z.string().max(64, "难度等级过长").nullable().optional(),
  publisher: z.string().max(255, "出版社名称过长").nullable().optional(),
  tags: z.array(z.string()).default([]),
  sortOrder: z.number().int().nullable().optional(),
  isActive: z.boolean().default(true)
});

/**
 * 单词书更新验证 schema（所有字段可选）
 */
export const bookUpdateSchema = bookInputSchema.partial();

/**
 * 获取单词书详情参数
 */
export const getBookSchema = z.object({
  bookId: z.string().min(1, "单词书 ID 不能为空")
});

/**
 * 删除单词书参数
 */
export const deleteBookSchema = z.object({
  id: z.string().uuid("无效的单词书 ID")
});

/**
 * 删除单词书所有单词参数
 */
export const deleteAllWordsSchema = z.object({
  bookId: z.string().min(1, "单词书 ID 不能为空")
});

export type BookInput = z.infer<typeof bookInputSchema>;
export type BookUpdate = z.infer<typeof bookUpdateSchema>;
