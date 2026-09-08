/**
 * Agent-runnable DB smoke for schema v2 (#61).
 * Does not hit LINE UI — checks table presence, case+questionnaire integrity,
 * and toLegacyQuestionRow mapping on a sample row.
 *
 * Usage: node --import tsx scripts/smoke-v2-db.ts
 */
import { PrismaClient, CaseStatus } from "@prisma/client";

import { toLegacyQuestionRow } from "../lib/case-to-legacy-question";
import { buildLegacyFollowUpStatusWhere } from "../lib/case-status-mapping";

const prisma = new PrismaClient();

type Check = { name: string; ok: boolean; detail?: string };

async function tableExists(name: string): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<Array<{ c: bigint | number }>>(
    `SELECT COUNT(*) AS c
     FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = ?`,
    name
  );

  return Number(rows[0]?.c ?? 0) > 0;
}

async function main() {
  const checks: Check[] = [];
  const dbRows = await prisma.$queryRawUnsafe<Array<{ db: string }>>(
    `SELECT DATABASE() AS db`
  );
  const dbName = dbRows[0]?.db ?? "(unknown)";

  console.log(`DATABASE: ${dbName}`);

  for (const t of ["Case", "TreatmentNote", "Profile", "Questions_2Q", "Questions_9Q"]) {
    // Prisma @@map may differ — check common names
  }

  const required = [
    "Case",
    "TreatmentNote",
    "Profile",
    "Question2Q",
    "Question8Q",
    "Question9Q",
    "QuestionPhqa",
    "QuestionPhqaAddon",
    "QuestionProblem",
  ];

  // Resolve actual table names from information_schema (case-insensitive)
  const allTables = await prisma.$queryRawUnsafe<
    Array<{ table_name?: string; TABLE_NAME?: string }>
  >(
    `SELECT table_name AS table_name FROM information_schema.tables WHERE table_schema = DATABASE()`
  );
  const lower = new Set(
    allTables
      .map((t) => (t.table_name ?? t.TABLE_NAME ?? "").toLowerCase())
      .filter(Boolean)
  );

  for (const want of required) {
    const ok = lower.has(want.toLowerCase());
    checks.push({
      name: `table:${want}`,
      ok,
      detail: ok ? "present" : "MISSING",
    });
  }

  const legacyCount = Array.from(lower).filter((t) =>
    t.startsWith("legacy_")
  ).length;
  checks.push({
    name: "legacy_tables_present",
    ok: true,
    detail: `${legacyCount} legacy_* tables (drop only after human approval)`,
  });

  const caseCount = await prisma.case.count();
  checks.push({
    name: "case_count",
    ok: caseCount > 0,
    detail: String(caseCount),
  });

  const withQ = await prisma.case.findFirst({
    orderBy: { createdAt: "desc" },
    include: {
      questions2Q: true,
      questionsPhqa: true,
      questions9Q: true,
      questions8Q: true,
      questionsPhqaAddon: true,
      treatmentNotes: true,
      profile: { include: { addresses: true, emergencyContacts: true } },
    },
  });

  if (!withQ) {
    checks.push({ name: "sample_case", ok: false, detail: "no cases" });
  } else {
    const mapped = toLegacyQuestionRow(withQ);
    checks.push({
      name: "legacy_map_q2",
      ok: Array.isArray(mapped.q2) && mapped.q2.length > 0,
      detail: `q2.len=${mapped.q2?.length ?? 0}`,
    });
    checks.push({
      name: "legacy_map_result_color",
      ok: ["Green", "Green-Low", "Yellow", "Orange", "Red"].includes(
        mapped.result
      ),
      detail: `${mapped.result} / ${mapped.result_text?.slice(0, 40) ?? ""}`,
    });
    checks.push({
      name: "legacy_map_status_0_3",
      ok: [0, 1, 2, 3].includes(mapped.status as number),
      detail: String(mapped.status),
    });
    checks.push({
      name: "scores_present",
      ok:
        (mapped.q9?.[0]?.sum != null || mapped.phqa?.[0]?.sum != null) &&
        mapped.q8?.[0] != null,
      detail: `q9=${mapped.q9?.[0]?.sum ?? "-"} phqa=${mapped.phqa?.[0]?.sum ?? "-"} q8=${mapped.q8?.[0]?.sum ?? "-"}`,
    });
  }

  // Status filter where must not throw against Prisma
  try {
    const where = buildLegacyFollowUpStatusWhere([1]);
    const n = await prisma.case.count({
      where: where as never,
    });
    checks.push({
      name: "status_filter_pending_hn",
      ok: true,
      detail: `count=${n}`,
    });
  } catch (e) {
    checks.push({
      name: "status_filter_pending_hn",
      ok: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }

  try {
    const n = await prisma.case.count({
      where: { status: { in: [CaseStatus.PENDING, CaseStatus.IN_PROGRESS] } },
    });
    checks.push({
      name: "case_status_enum_query",
      ok: true,
      detail: `openish=${n}`,
    });
  } catch (e) {
    checks.push({
      name: "case_status_enum_query",
      ok: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }

  let failed = 0;
  for (const c of checks) {
    const mark = c.ok ? "PASS" : "FAIL";
    if (!c.ok) failed += 1;
    console.log(`${mark}  ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
  }

  console.log(
    failed === 0
      ? `\nDB smoke OK on ${dbName} (${checks.length} checks)`
      : `\nDB smoke FAILED on ${dbName}: ${failed}/${checks.length}`
  );

  process.exitCode = failed === 0 ? 0 : 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
