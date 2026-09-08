# Dev DB: park legacy + create schema v2

For `teenmind-dev-v3` (and similar), keep clinical data while introducing Prisma schema v2 tables.

## One-time order

```bash
# 1) Rename all live legacy tables → legacy_*
node scripts/park-legacy-tables-for-v2.js

# 2) CREATE v2 tables/FKs only (does not drop legacy_*)
node scripts/apply-v2-schema-sql.js
```

Do **not** use `prisma db push` while `legacy_*` tables exist — Prisma will try to drop them.

## Afterward

- V2 tables are empty; `legacy_*` hold source rows for ETL (`scripts/migrate-legacy-data.js`, ticket #53).
- Migration marked applied: `20260907120000_parallel_v2_beside_legacy`
