-- Step 1: Create dict_book table
CREATE TABLE IF NOT EXISTS "dict_book" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "book_id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "cover_url" TEXT,
    "grade" VARCHAR(64),
    "level" VARCHAR(64),
    "publisher" VARCHAR(255),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sort_order" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dict_book_pkey" PRIMARY KEY ("id")
);

-- Step 2: Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "dict_book_book_id_key" ON "dict_book"("book_id");
CREATE INDEX IF NOT EXISTS "dict_book_book_id_idx" ON "dict_book"("book_id");
CREATE INDEX IF NOT EXISTS "dict_book_is_active_idx" ON "dict_book"("is_active");
CREATE INDEX IF NOT EXISTS "dict_book_sort_order_idx" ON "dict_book"("sort_order");
CREATE INDEX IF NOT EXISTS "dict_word_book_id_idx" ON "dict_word"("book_id");

-- Step 3: Migrate existing book_id data to dict_book table
INSERT INTO "dict_book" ("id", "book_id", "name", "created_at", "updated_at")
SELECT
    gen_random_uuid(),
    book_id,
    book_id,
    MIN(created_at),
    MAX(updated_at)
FROM "dict_word"
WHERE book_id IS NOT NULL
GROUP BY book_id
ON CONFLICT (book_id) DO NOTHING;

-- Step 4: Add foreign key constraint
ALTER TABLE "dict_word"
DROP CONSTRAINT IF EXISTS "dict_word_book_id_fkey";

ALTER TABLE "dict_word"
ADD CONSTRAINT "dict_word_book_id_fkey"
FOREIGN KEY ("book_id") REFERENCES "dict_book"("book_id")
ON DELETE SET NULL
ON UPDATE CASCADE;
