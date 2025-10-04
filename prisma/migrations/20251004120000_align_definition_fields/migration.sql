-- Align dictionary tables with JSON semantics

ALTER TABLE "dict_definition"
  RENAME COLUMN "part_of_speech" TO "pos";

ALTER TABLE "dict_definition"
  RENAME COLUMN "meaning_cn" TO "tran_cn";

ALTER TABLE "dict_definition"
  RENAME COLUMN "meaning_en" TO "tran_other";

ALTER TABLE "dict_definition"
  RENAME COLUMN "note" TO "desc_other";

ALTER TABLE "dict_definition"
  ADD COLUMN "desc_cn" TEXT;

ALTER TABLE "dict_synonym_group"
  RENAME COLUMN "part_of_speech" TO "pos";

ALTER TABLE "dict_related_word"
  RENAME COLUMN "part_of_speech" TO "pos";
