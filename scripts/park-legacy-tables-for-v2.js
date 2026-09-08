/**
 * Dev-only: park legacy tables under legacy_* then allow prisma db push
 * to create schema v2 beside them (teenmind-dev-v3).
 *
 * Usage: node scripts/park-legacy-tables-for-v2.js
 */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const TABLES = [
  "account",
  "address",
  "affiliation",
  "districts",
  "emergencycontact",
  "employee_type",
  "profile",
  "profile_admin",
  "provinces",
  "questions_2q",
  "questions_8q",
  "questions_9q",
  "questions_master",
  "questions_phqa",
  "questions_phqa_addon",
  "questions_problem",
  "referent",
  "roles",
  "school",
  "school_screening",
  "session",
  "subdistricts",
  "user",
  "verificationtoken",
  "volunteer_type",
];

async function tableExists(name) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) AS c
     FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = ?`,
    name
  );
  return Number(rows[0].c) > 0;
}

async function main() {
  const pairs = [];
  for (const table of TABLES) {
    const legacy = `legacy_${table}`;
    const has = await tableExists(table);
    const hasLegacy = await tableExists(legacy);
    if (!has) {
      console.log(`skip (missing): ${table}`);
      continue;
    }
    if (hasLegacy) {
      console.log(`skip (already parked): ${table} -> ${legacy}`);
      continue;
    }
    pairs.push([table, legacy]);
  }

  if (pairs.length === 0) {
    console.log("Nothing to rename.");
    return;
  }

  // Atomic multi-rename keeps FKs valid across the rename set
  const clause = pairs
    .map(([from, to]) => `\`${from}\` TO \`${to}\``)
    .join(", ");
  console.log(`Renaming ${pairs.length} tables...`);
  await prisma.$executeRawUnsafe(`RENAME TABLE ${clause}`);
  for (const [from, to] of pairs) {
    console.log(`renamed: ${from} -> ${to}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
