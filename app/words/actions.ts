"use server";

import { revalidatePath } from "next/cache";
import { ActionError, actionClient } from "@/lib/safe-action";
import { NotFoundError } from "@/lib/errors";
import { createWord, deleteWord, getWordById, listWords, updateWord } from "@/lib/word-service";
import {
  createWordInputSchema,
  type CreateWordInput,
  deleteWordInputSchema,
  type DeleteWordInput,
  getWordInputSchema,
  type GetWordInput,
  listWordsInputSchema,
  type ListWordsInput,
  updateWordInputSchema,
  type UpdateWordInput
} from "@/app/words/schemas";

const WORDS_PATH = "/words";

const handleNotFound = async <T>(operation: () => Promise<T>) => {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new ActionError(error.message);
    }
    throw error;
  }
};

export const listWordsAction = actionClient(listWordsInputSchema, async (input: ListWordsInput) => {
  const { query, bookId, skip, take, exact } = input;
  return listWords({ query, bookId, skip, take, exact });
});

export const getWordDetailAction = actionClient(getWordInputSchema, async (input: GetWordInput) => {
  const { id } = input;
  return handleNotFound(() => getWordById(id));
});

export const createWordAction = actionClient(createWordInputSchema, async (input: CreateWordInput) => {
  const { word } = input;
  const created = await createWord(word);
  revalidatePath(WORDS_PATH);
  return created;
});

export const updateWordAction = actionClient(updateWordInputSchema, async (input: UpdateWordInput) => {
  const { id, word } = input;
  const updated = await handleNotFound(() => updateWord(id, word));
  revalidatePath(WORDS_PATH);
  return updated;
});

export const deleteWordAction = actionClient(deleteWordInputSchema, async (input: DeleteWordInput) => {
  const { id } = input;
  await handleNotFound(() => deleteWord(id));
  revalidatePath(WORDS_PATH);
  return { success: true } as const;
});
