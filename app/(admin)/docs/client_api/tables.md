# NestJS 数据表映射参考

> 目标：在 NestJS（TypeORM） 工程中实现与现有数据库结构一致的实体模型。下文根据 `prisma/schema.prisma` 中的全部表（`dict_*` 系列）整理成 NestJS/TypeORM 写法，便于快速建模。请按需拆分到各自模块的 `entities` 目录。

## 使用说明

- 所有实体均以 `@Entity({ name: 'dict_xxx' })` 指定真实表名，与 Prisma 保持一致。
- 日期字段推荐使用 `@CreateDateColumn({ type: 'timestamptz', precision: 6 })` / `@UpdateDateColumn(...)`，便于自动维护。
- 数组字段（`tags`）使用 PostgreSQL 数组类型，`@Column('text', { array: true, default: '{}' })`。
- 外键关系严格对应 Prisma 中的 onDelete/onUpdate 行为；若需要 `CASCADE`/`SET NULL`，请在 `@ManyToOne` 的选项中声明。
- 为保持可读性，以下示例将所有实体置于同一文件；实际项目中可拆分，并在需要处 `forwardRef` 或调整导入顺序。

---

## dict_book — 单词书表

### 字段
- `id`：主键 UUID。
- `book_id`：业务唯一 ID。
- `name`：单词书名称。
- `description`：单词书介绍。
- `cover_url`：封面图地址。
- `grade`：适用年级。
- `level`：难度等级。
- `publisher`：出版社。
- `tags`：标签数组。
- `sort_order`：展示排序。
- `is_active`：是否启用。
- `created_at`：创建时间。
- `updated_at`：更新时间。
- 关系 `words`：关联的 `dict_word` 词条集合。

### TypeORM 实体
```ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index
} from 'typeorm';

@Index('dict_book_book_id_idx', ['book_id'])
@Index('dict_book_is_active_idx', ['is_active'])
@Index('dict_book_sort_order_idx', ['sort_order'])
@Entity({ name: 'dict_book' })
export class DictBookEntity {
  /** 主键 UUID */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 业务唯一标识 */
  @Column({ name: 'book_id', type: 'varchar', length: 255, unique: true })
  book_id: string;

  /** 单词书名称 */
  @Column({ type: 'varchar', length: 255 })
  name: string;

  /** 单词书介绍 */
  @Column({ type: 'text', nullable: true })
  description?: string | null;

  /** 封面图地址 */
  @Column({ name: 'cover_url', type: 'text', nullable: true })
  cover_url?: string | null;

  /** 适用年级 */
  @Column({ type: 'varchar', length: 64, nullable: true })
  grade?: string | null;

  /** 难度等级 */
  @Column({ type: 'varchar', length: 64, nullable: true })
  level?: string | null;

  /** 出版社 */
  @Column({ type: 'varchar', length: 255, nullable: true })
  publisher?: string | null;

  /** 标签数组（PostgreSQL 文本数组） */
  @Column('text', { array: true, default: '{}' })
  tags: string[];

  /** 展示排序 */
  @Column({ name: 'sort_order', type: 'integer', nullable: true })
  sort_order?: number | null;

  /** 是否启用 */
  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;

  /** 创建时间 */
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 6 })
  created_at: Date;

  /** 更新时间 */
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', precision: 6 })
  updated_at: Date;

  /** 该词书下的词条集合 */
  @OneToMany(() => DictWordEntity, (word) => word.book)
  words: DictWordEntity[];
}
```

---

## dict_word — 主词表

### 字段
- `id`：主键 UUID。
- `rank`：词频或排名。
- `headword`：词头。
- `phonetic_us`、`phonetic_uk`：美式/英式音标。
- `audio_us`、`audio_uk`：读音链接（使用有道 DictVoice 自动生成，type=1/2）。
- `book_id`：所属单词书业务 ID，可为空。
- `memory_tip`：记忆提示。
- `created_at` / `updated_at`：时间戳。
- 关系：`book`（所属单词书）、`definitions`、`example_sentences`、`synonym_groups`、`phrases`、`related_words`、`import_logs`。

### TypeORM 实体
```ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn
} from 'typeorm';

@Index('dict_word_headword_idx', ['headword'])
@Index('dict_word_book_id_idx', ['book_id'])
@Index('dict_word_headword_book_id_uk', ['headword', 'book_id'], { unique: true })
@Entity({ name: 'dict_word' })
export class DictWordEntity {
  /** 主键 UUID */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 词频或排名 */
  @Column({ type: 'integer', nullable: true })
  rank?: number | null;

  /** 词头 */
  @Column({ type: 'varchar', length: 255 })
  headword: string;

  /** 美式音标 */
  @Column({ name: 'phonetic_us', type: 'varchar', length: 255, nullable: true })
  phonetic_us?: string | null;

  /** 英式音标 */
  @Column({ name: 'phonetic_uk', type: 'varchar', length: 255, nullable: true })
  phonetic_uk?: string | null;

  /** 美式音频链接（DictVoice type=1 自动生成） */
  @Column({ name: 'audio_us', type: 'text', nullable: true })
  audio_us?: string | null;

  /** 英式音频链接（DictVoice type=2 自动生成） */
  @Column({ name: 'audio_uk', type: 'text', nullable: true })
  audio_uk?: string | null;

  /** 所属单词书业务 ID，可为空 */
  @Column({ name: 'book_id', type: 'varchar', length: 255, nullable: true })
  book_id?: string | null;

  /** 记忆提示 */
  @Column({ name: 'memory_tip', type: 'text', nullable: true })
  memory_tip?: string | null;

  /** 创建时间 */
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 6 })
  created_at: Date;

  /** 更新时间 */
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', precision: 6 })
  updated_at: Date;

  /** 所属单词书 */
  @ManyToOne(() => DictBookEntity, (book) => book.words, {
    nullable: true,
    onDelete: 'SET NULL'
  })
  @JoinColumn({ name: 'book_id', referencedColumnName: 'book_id' })
  book?: DictBookEntity | null;

  /** 释义列表 */
  @OneToMany(() => DictDefinitionEntity, (definition) => definition.word)
  definitions: DictDefinitionEntity[];

  /** 例句列表 */
  @OneToMany(() => DictExampleSentenceEntity, (sentence) => sentence.word)
  example_sentences: DictExampleSentenceEntity[];

  /** 近义词分组集合 */
  @OneToMany(() => DictSynonymGroupEntity, (group) => group.word)
  synonym_groups: DictSynonymGroupEntity[];

  /** 短语集合 */
  @OneToMany(() => DictPhraseEntity, (phrase) => phrase.word)
  phrases: DictPhraseEntity[];

  /** 同根/相关词集合 */
  @OneToMany(() => DictRelatedWordEntity, (related) => related.word)
  related_words: DictRelatedWordEntity[];

  /** 导入日志集合 */
  @OneToMany(() => DictImportLogEntity, (log) => log.word)
  import_logs: DictImportLogEntity[];
}
```

---

## dict_definition — 释义表

```ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn
} from 'typeorm';

@Index('dict_definition_word_id_idx', ['word_id'])
@Entity({ name: 'dict_definition' })
export class DictDefinitionEntity {
  /** 主键 UUID */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 所属词条 ID */
  @Column({ name: 'word_id', type: 'uuid' })
  word_id: string;

  /** 词性 */
  @Column({ name: 'part_of_speech', type: 'varchar', length: 64, nullable: true })
  part_of_speech?: string | null;

  /** 中文释义 */
  @Column({ name: 'meaning_cn', type: 'text', nullable: true })
  meaning_cn?: string | null;

  /** 英文解释 */
  @Column({ name: 'meaning_en', type: 'text', nullable: true })
  meaning_en?: string | null;

  /** 备注说明 */
  @Column({ type: 'text', nullable: true })
  note?: string | null;

  /** 创建时间 */
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 6 })
  created_at: Date;

  /** 所属词条 */
  @ManyToOne(() => DictWordEntity, (word) => word.definitions, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'word_id' })
  word: DictWordEntity;

  /** 绑定的例句集合 */
  @OneToMany(() => DictExampleSentenceEntity, (sentence) => sentence.definition)
  example_sentences: DictExampleSentenceEntity[];
}
```

---

## dict_example_sentence — 例句表

```ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  Index,
  JoinColumn
} from 'typeorm';

@Index('dict_example_sentence_word_id_idx', ['word_id'])
@Index('dict_example_sentence_definition_id_idx', ['definition_id'])
@Entity({ name: 'dict_example_sentence' })
export class DictExampleSentenceEntity {
  /** 主键 UUID */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 关联的词条 ID */
  @Column({ name: 'word_id', type: 'uuid' })
  word_id: string;

  /** 可选关联释义 ID */
  @Column({ name: 'definition_id', type: 'uuid', nullable: true })
  definition_id?: string | null;

  /** 英文原句 */
  @Column({ type: 'text' })
  source: string;

  /** 中文翻译 */
  @Column({ type: 'text', nullable: true })
  translation?: string | null;

  /** 附加元数据（JSON） */
  @Column({ type: 'json', nullable: true })
  meta?: Record<string, any> | null;

  /** 创建时间 */
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 6 })
  created_at: Date;

  /** 所属词条 */
  @ManyToOne(() => DictWordEntity, (word) => word.example_sentences, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'word_id' })
  word: DictWordEntity;

  /** 可选关联释义 */
  @ManyToOne(() => DictDefinitionEntity, (definition) => definition.example_sentences, {
    nullable: true
  })
  @JoinColumn({ name: 'definition_id' })
  definition?: DictDefinitionEntity | null;
}
```

---

## dict_synonym_group — 近义词分组

```ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn
} from 'typeorm';

@Index('dict_synonym_group_word_id_idx', ['word_id'])
@Entity({ name: 'dict_synonym_group' })
export class DictSynonymGroupEntity {
  /** 主键 UUID */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 关联的词条 ID */
  @Column({ name: 'word_id', type: 'uuid' })
  word_id: string;

  /** 词性 */
  @Column({ name: 'part_of_speech', type: 'varchar', length: 64, nullable: true })
  part_of_speech?: string | null;

  /** 中文释义（概述） */
  @Column({ name: 'meaning_cn', type: 'text', nullable: true })
  meaning_cn?: string | null;

  /** 备注说明 */
  @Column({ type: 'text', nullable: true })
  note?: string | null;

  /** 所属词条 */
  @ManyToOne(() => DictWordEntity, (word) => word.synonym_groups, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'word_id' })
  word: DictWordEntity;

  /** 近义词条目集合 */
  @OneToMany(() => DictSynonymEntity, (synonym) => synonym.group)
  synonym_items: DictSynonymEntity[];
}
```

---

## dict_synonym — 近义词条目

```ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  Index,
  JoinColumn
} from 'typeorm';

@Index('dict_synonym_group_id_idx', ['group_id'])
@Entity({ name: 'dict_synonym' })
export class DictSynonymEntity {
  /** 主键 UUID */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 所属近义词分组 ID */
  @Column({ name: 'group_id', type: 'uuid' })
  group_id: string;

  /** 近义词文本 */
  @Column({ type: 'varchar', length: 255 })
  value: string;

  /** 所属近义词分组 */
  @ManyToOne(() => DictSynonymGroupEntity, (group) => group.synonym_items, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'group_id' })
  group: DictSynonymGroupEntity;
}
```

---

## dict_phrase — 短语表

```ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  Index,
  JoinColumn
} from 'typeorm';

@Index('dict_phrase_word_id_idx', ['word_id'])
@Entity({ name: 'dict_phrase' })
export class DictPhraseEntity {
  /** 主键 UUID */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 关联的词条 ID */
  @Column({ name: 'word_id', type: 'uuid' })
  word_id: string;

  /** 短语内容 */
  @Column({ type: 'text' })
  content: string;

  /** 中文释义 */
  @Column({ name: 'meaning_cn', type: 'text', nullable: true })
  meaning_cn?: string | null;

  /** 英文释义 */
  @Column({ name: 'meaning_en', type: 'text', nullable: true })
  meaning_en?: string | null;

  /** 所属词条 */
  @ManyToOne(() => DictWordEntity, (word) => word.phrases, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'word_id' })
  word: DictWordEntity;
}
```

---

## dict_related_word — 同根/相关词

```ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  Index,
  JoinColumn
} from 'typeorm';

@Index('dict_related_word_word_id_idx', ['word_id'])
@Entity({ name: 'dict_related_word' })
export class DictRelatedWordEntity {
  /** 主键 UUID */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 关联的词条 ID */
  @Column({ name: 'word_id', type: 'uuid' })
  word_id: string;

  /** 词性 */
  @Column({ name: 'part_of_speech', type: 'varchar', length: 64, nullable: true })
  part_of_speech?: string | null;

  /** 同根词或相关词词头 */
  @Column({ type: 'varchar', length: 255 })
  headword: string;

  /** 中文释义 */
  @Column({ name: 'meaning_cn', type: 'text', nullable: true })
  meaning_cn?: string | null;

  /** 所属词条 */
  @ManyToOne(() => DictWordEntity, (word) => word.related_words, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'word_id' })
  word: DictWordEntity;
}
```

---

## dict_import_batch — 导入批次

```ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany
} from 'typeorm';

@Entity({ name: 'dict_import_batch' })
export class DictImportBatchEntity {
  /** 主键 UUID */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 数据源名称 */
  @Column({ name: 'source_name', type: 'varchar', length: 255, nullable: true })
  source_name?: string | null;

  /** 总记录数 */
  @Column({ name: 'total_count', type: 'integer' })
  total_count: number;

  /** 成功条数 */
  @Column({ name: 'success_count', type: 'integer' })
  success_count: number;

  /** 跳过条数 */
  @Column({ name: 'skipped_count', type: 'integer' })
  skipped_count: number;

  /** 错误详情（JSON） */
  @Column({ name: 'error_details', type: 'json', nullable: true })
  error_details?: Record<string, any> | null;

  /** 创建时间 */
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 6 })
  created_at: Date;

  /** 包含的导入日志 */
  @OneToMany(() => DictImportLogEntity, (log) => log.batch)
  import_logs: DictImportLogEntity[];
}
```

---

## dict_import_log — 导入日志

```ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  Index,
  JoinColumn
} from 'typeorm';

@Index('dict_import_log_batch_id_idx', ['batch_id'])
@Index('dict_import_log_word_id_idx', ['word_id'])
@Entity({ name: 'dict_import_log' })
export class DictImportLogEntity {
  /** 主键 UUID */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 所属导入批次 ID */
  @Column({ name: 'batch_id', type: 'uuid' })
  batch_id: string;

  /** 可选关联词条 ID */
  @Column({ name: 'word_id', type: 'uuid', nullable: true })
  word_id?: string | null;

  /** 原始词头 */
  @Column({ name: 'raw_headword', type: 'varchar', length: 255 })
  raw_headword: string;

  /** 导入状态（success/skipped/failed 等） */
  @Column({ type: 'varchar', length: 32 })
  status: string;

  /** 异常或备注信息 */
  @Column({ type: 'text', nullable: true })
  message?: string | null;

  /** 创建时间 */
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 6 })
  created_at: Date;

  /** 所属导入批次 */
  @ManyToOne(() => DictImportBatchEntity, (batch) => batch.import_logs, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'batch_id' })
  batch: DictImportBatchEntity;

  /** 可选关联词条 */
  @ManyToOne(() => DictWordEntity, (word) => word.import_logs, {
    nullable: true
  })
  @JoinColumn({ name: 'word_id' })
  word?: DictWordEntity | null;
}
```

---

## 组合索引速查

Prisma 中的 `@@index`、`@@unique` 需要在 TypeORM 额外声明，可在实体顶部添加：

```ts
@Index('dict_word_headword_book_id_uk', ['headword', 'book_id'], { unique: true })
```

请对照 `schema.prisma` 查看是否遗漏。当前整理的实体已覆盖全部 10 张表：

1. `dict_book`
2. `dict_word`
3. `dict_definition`
4. `dict_example_sentence`
5. `dict_synonym_group`
6. `dict_synonym`
7. `dict_phrase`
8. `dict_related_word`
9. `dict_import_batch`
10. `dict_import_log`

> 在 NestJS 中建议将这些实体集中到 `libs/database` 或各领域模块下，并在 `TypeOrmModule.forFeature([...])` 注册。若未来表结构调整，只需同步更新本文件及 Prisma 定义。
