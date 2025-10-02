"use server";

import { revalidatePath } from "next/cache";
import { actionClient } from "@/lib/safe-action";
import {
  listBooks,
  getBookByBookId,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  deleteAllWordsInBook,
  type BookWithStats,
  type BookListItem
} from "@/lib/book-service";
import {
  bookInputSchema,
  bookUpdateSchema,
  getBookSchema,
  deleteBookSchema,
  deleteAllWordsSchema
} from "@/app/books/schemas";
import { z } from "zod";

const emptySchema = z.object({}).optional();

/**
 * 获取所有单词书列表
 */
export const listBooksAction = actionClient(emptySchema, async (): Promise<BookListItem[]> => {
  return await listBooks();
});

/**
 * 根据 bookId 获取单词书详情
 */
export const getBookDetailAction = actionClient(getBookSchema, async (input): Promise<BookWithStats> => {
  return await getBookByBookId(input.bookId);
});

/**
 * 根据 UUID 获取单词书详情
 */
export const getBookByIdAction = actionClient(z.object({ id: z.string().uuid() }), async (input): Promise<BookWithStats> => {
  return await getBookById(input.id);
});

/**
 * 创建新单词书
 */
export const createBookAction = actionClient(z.object({ book: bookInputSchema }), async (input): Promise<BookWithStats> => {
  return await createBook(input.book);
});

/**
 * 更新单词书信息
 */
export const updateBookAction = actionClient(
  z.object({
    id: z.string().uuid(),
    book: bookUpdateSchema
  }),
  async (input): Promise<BookWithStats> => {
    return await updateBook(input.id, input.book);
  }
);

/**
 * 删除单词书
 */
export const deleteBookAction = actionClient(deleteBookSchema, async (input): Promise<void> => {
  await deleteBook(input.id);
});

/**
 * 删除单词书中的所有单词
 */
export const deleteAllWordsInBookAction = actionClient(
  deleteAllWordsSchema,
  async (input): Promise<{ deletedCount: number }> => {
    const count = await deleteAllWordsInBook(input.bookId);

    // 清除缓存，确保页面数据立即更新
    revalidatePath(`/books/${input.bookId}`);  // 刷新单词书详情页
    revalidatePath("/books");                   // 刷新单词书列表页
    revalidatePath("/words");                   // 刷新单词列表页

    return { deletedCount: count };
  }
);
