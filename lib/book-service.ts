/**
 * 单词书服务层：封装 Prisma 访问逻辑
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";

export type BookWithStats = {
  id: string;
  bookId: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  grade: string | null;
  level: string | null;
  publisher: string | null;
  tags: string[];
  sortOrder: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  wordCount: number;
};

export type BookListItem = Omit<BookWithStats, "description" | "tags">;

export type BookInput = {
  bookId: string;
  name: string;
  description?: string | null;
  coverUrl?: string | null;
  grade?: string | null;
  level?: string | null;
  publisher?: string | null;
  tags?: string[];
  sortOrder?: number | null;
  isActive?: boolean;
};

const toNullableString = (value?: string | null): string | null => {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toNullableInt = (value?: number | null): number | null => {
  if (value === undefined || value === null) {
    return null;
  }
  return Number.isFinite(value) ? Math.trunc(value) : null;
};

/**
 * 查询所有单词书列表（带单词统计）
 */
export async function listBooks(): Promise<BookListItem[]> {
  const books = await prisma.dict_book.findMany({
    where: {
      is_active: true
    },
    orderBy: [
      { sort_order: "asc" },
      { created_at: "desc" }
    ],
    include: {
      _count: {
        select: { words: true }
      }
    }
  });

  return books.map((book) => ({
    id: book.id,
    bookId: book.book_id,
    name: book.name,
    coverUrl: book.cover_url,
    grade: book.grade,
    level: book.level,
    publisher: book.publisher,
    sortOrder: book.sort_order,
    isActive: book.is_active,
    createdAt: book.created_at,
    updatedAt: book.updated_at,
    wordCount: book._count.words
  }));
}

/**
 * 根据 bookId 获取单词书详情
 */
export async function getBookByBookId(bookId: string): Promise<BookWithStats> {
  const book = await prisma.dict_book.findUnique({
    where: { book_id: bookId },
    include: {
      _count: {
        select: { words: true }
      }
    }
  });

  if (!book) {
    throw new NotFoundError("单词书不存在或已被删除");
  }

  return {
    id: book.id,
    bookId: book.book_id,
    name: book.name,
    description: book.description,
    coverUrl: book.cover_url,
    grade: book.grade,
    level: book.level,
    publisher: book.publisher,
    tags: book.tags,
    sortOrder: book.sort_order,
    isActive: book.is_active,
    createdAt: book.created_at,
    updatedAt: book.updated_at,
    wordCount: book._count.words
  };
}

/**
 * 根据 UUID 获取单词书详情
 */
export async function getBookById(id: string): Promise<BookWithStats> {
  const book = await prisma.dict_book.findUnique({
    where: { id },
    include: {
      _count: {
        select: { words: true }
      }
    }
  });

  if (!book) {
    throw new NotFoundError("单词书不存在或已被删除");
  }

  return {
    id: book.id,
    bookId: book.book_id,
    name: book.name,
    description: book.description,
    coverUrl: book.cover_url,
    grade: book.grade,
    level: book.level,
    publisher: book.publisher,
    tags: book.tags,
    sortOrder: book.sort_order,
    isActive: book.is_active,
    createdAt: book.created_at,
    updatedAt: book.updated_at,
    wordCount: book._count.words
  };
}

/**
 * 创建新单词书
 */
export async function createBook(input: BookInput): Promise<BookWithStats> {
  const created = await prisma.dict_book.create({
    data: {
      book_id: input.bookId.trim(),
      name: input.name.trim(),
      description: toNullableString(input.description),
      cover_url: toNullableString(input.coverUrl),
      grade: toNullableString(input.grade),
      level: toNullableString(input.level),
      publisher: toNullableString(input.publisher),
      tags: input.tags ?? [],
      sort_order: toNullableInt(input.sortOrder),
      is_active: input.isActive ?? true
    },
    include: {
      _count: {
        select: { words: true }
      }
    }
  });

  return {
    id: created.id,
    bookId: created.book_id,
    name: created.name,
    description: created.description,
    coverUrl: created.cover_url,
    grade: created.grade,
    level: created.level,
    publisher: created.publisher,
    tags: created.tags,
    sortOrder: created.sort_order,
    isActive: created.is_active,
    createdAt: created.created_at,
    updatedAt: created.updated_at,
    wordCount: created._count.words
  };
}

/**
 * 更新单词书信息
 */
export async function updateBook(
  id: string,
  input: Partial<BookInput>
): Promise<BookWithStats> {
  const exists = await prisma.dict_book.findUnique({
    where: { id },
    select: { id: true }
  });

  if (!exists) {
    throw new NotFoundError("单词书不存在或已被删除");
  }

  const updated = await prisma.dict_book.update({
    where: { id },
    data: {
      ...(input.bookId && { book_id: input.bookId.trim() }),
      ...(input.name && { name: input.name.trim() }),
      ...(input.description !== undefined && { description: toNullableString(input.description) }),
      ...(input.coverUrl !== undefined && { cover_url: toNullableString(input.coverUrl) }),
      ...(input.grade !== undefined && { grade: toNullableString(input.grade) }),
      ...(input.level !== undefined && { level: toNullableString(input.level) }),
      ...(input.publisher !== undefined && { publisher: toNullableString(input.publisher) }),
      ...(input.tags !== undefined && { tags: input.tags }),
      ...(input.sortOrder !== undefined && { sort_order: toNullableInt(input.sortOrder) }),
      ...(input.isActive !== undefined && { is_active: input.isActive })
    },
    include: {
      _count: {
        select: { words: true }
      }
    }
  });

  return {
    id: updated.id,
    bookId: updated.book_id,
    name: updated.name,
    description: updated.description,
    coverUrl: updated.cover_url,
    grade: updated.grade,
    level: updated.level,
    publisher: updated.publisher,
    tags: updated.tags,
    sortOrder: updated.sort_order,
    isActive: updated.is_active,
    createdAt: updated.created_at,
    updatedAt: updated.updated_at,
    wordCount: updated._count.words
  };
}

/**
 * 删除单词书（需要先检查是否有关联单词）
 */
export async function deleteBook(id: string): Promise<void> {
  const book = await prisma.dict_book.findUnique({
    where: { id },
    include: {
      _count: {
        select: { words: true }
      }
    }
  });

  if (!book) {
    throw new NotFoundError("单词书不存在或已被删除");
  }

  if (book._count.words > 0) {
    throw new Error(`无法删除单词书：该书还有 ${book._count.words} 个单词。请先删除或转移单词。`);
  }

  await prisma.dict_book.delete({ where: { id } });
}

/**
 * 检查 bookId 是否存在
 */
export async function bookExists(bookId: string): Promise<boolean> {
  const count = await prisma.dict_book.count({
    where: { book_id: bookId }
  });
  return count > 0;
}
