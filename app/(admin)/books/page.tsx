import { listBooks } from "@/lib/book-service";
import BookManager from "@/app/(admin)/books/BookManager";

export default async function BooksPage() {
  const books = await listBooks();

  return <BookManager initialBooks={books} />;
}
