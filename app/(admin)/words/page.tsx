import WordManager from "./WordManager";
import { listWords } from "@/lib/word-service";

export const dynamic = "force-dynamic";

export default async function WordsPage() {
  const initialList = await listWords({ skip: 0, take: 20 });
  return <WordManager initialList={initialList} />;
}
