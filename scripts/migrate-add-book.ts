/**
 * 手动迁移脚本：添加 dict_book 表
 * 运行方式: npx ts-node scripts/migrate-add-book.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("开始迁移：添加 dict_book 表...");

  try {
    // Step 1: Create dict_book table
    console.log("1. 创建 dict_book 表...");
    await prisma.$executeRawUnsafe(`
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
      )
    `);
    console.log("✓ dict_book 表创建成功");

    // Step 2: Create indexes
    console.log("2. 创建索引...");
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "dict_book_book_id_key" ON "dict_book"("book_id")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "dict_book_book_id_idx" ON "dict_book"("book_id")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "dict_book_is_active_idx" ON "dict_book"("is_active")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "dict_book_sort_order_idx" ON "dict_book"("sort_order")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "dict_word_book_id_idx" ON "dict_word"("book_id")`);
    console.log("✓ 索引创建成功");

    // Step 3: Migrate existing book_id data
    console.log("3. 迁移现有 book_id 数据...");
    const result = await prisma.$executeRawUnsafe(`
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
      ON CONFLICT (book_id) DO NOTHING
    `);
    console.log(`✓ 迁移了现有数据，插入了 ${result} 条记录`);

    // Step 4: Add foreign key constraint
    console.log("4. 添加外键约束...");
    await prisma.$executeRawUnsafe(`ALTER TABLE "dict_word" DROP CONSTRAINT IF EXISTS "dict_word_book_id_fkey"`);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "dict_word"
      ADD CONSTRAINT "dict_word_book_id_fkey"
      FOREIGN KEY ("book_id") REFERENCES "dict_book"("book_id")
      ON DELETE SET NULL
      ON UPDATE CASCADE
    `);
    console.log("✓ 外键约束添加成功");

    // Verify migration
    console.log("\n验证迁移结果...");
    const bookCount = await prisma.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*) as count FROM "dict_book"`;
    console.log(`✓ dict_book 表中共有 ${bookCount[0].count} 条记录`);

    console.log("\n✅ 迁移完成！");
  } catch (error) {
    console.error("❌ 迁移失败:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
