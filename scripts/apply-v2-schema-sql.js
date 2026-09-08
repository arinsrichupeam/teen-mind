/**
 * Apply CREATE-only v2 schema SQL without dropping legacy_* tables.
 * Usage: node scripts/apply-v2-schema-sql.js
 */
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const sqlPath = path.join(__dirname, "sql", "create-v2-schema.sql");

async function main() {
  let sql = fs.readFileSync(sqlPath, "utf8");
  // strip BOM / prisma warnings if any
  sql = sql.replace(/^\uFEFF/, "");
  if (sql.startsWith("Error:") || sql.includes("Environment variables")) {
    throw new Error("SQL file looks invalid — regenerate with prisma migrate diff");
  }

  // Strip full-line SQL comments, then split on semicolons
  const withoutLineComments = sql
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");

  const statements = withoutLineComments
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  console.log(`Executing ${statements.length} statements...`);
  let ok = 0;
  for (const statement of statements) {
    try {
      await prisma.$executeRawUnsafe(statement);
      ok += 1;
    } catch (e) {
      const msg = String(e.message || e);
      // idempotent-ish: table/constraint already exists
      if (
        msg.includes("already exists") ||
        msg.includes("Duplicate") ||
        e.code === "P2010"
      ) {
        console.warn(`skip: ${msg.split("\n")[0]}`);
        continue;
      }
      console.error("Failed statement:\n", statement.slice(0, 200));
      throw e;
    }
  }
  console.log(`Done. Applied ${ok}/${statements.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
