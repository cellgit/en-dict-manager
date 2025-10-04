-- Create functional index to support case-insensitive exact headword lookup
CREATE INDEX IF NOT EXISTS "idx_dict_word_headword_lower" ON "dict_word" ((LOWER("headword")));
