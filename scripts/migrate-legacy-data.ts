/**
 * Legacy → v2 ETL for teenmind-dev-v3 (and similar).
 *
 * Sources: legacy_* tables (after park-legacy-tables-for-v2.js)
 * Targets: Prisma schema v2 models
 *
 * Usage:
 *   npx tsx scripts/migrate-legacy-data.ts --dry-run
 *   npx tsx scripts/migrate-legacy-data.ts --apply
 */
import { PrismaClient, Prisma } from "@prisma/client";
import {
  mapLegacyRiskColorToScreeningResult,
  mapLegacySexToSex,
} from "../lib/legacy-value-mapping";

const prisma = new PrismaClient();

const BATCH = 400;
const dryRun = process.argv.includes("--dry-run");
const apply = process.argv.includes("--apply");

type Counts = Record<string, number>;

const report: {
  mode: string;
  source: Counts;
  written: Counts;
  skipped: Counts;
  screeningResult: Counts;
  caseStatus: Counts;
  spotChecks: string[];
  errors: string[];
} = {
  mode: dryRun ? "dry-run" : apply ? "apply" : "none",
  source: {},
  written: {},
  skipped: {},
  screeningResult: {},
  caseStatus: {},
  spotChecks: [],
  errors: [],
};

function bump(map: Counts, key: string, n = 1) {
  map[key] = (map[key] ?? 0) + n;
}

function nonEmpty(v: unknown): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

function text(v: unknown, fallback = ""): string {
  if (v == null) return fallback;
  return String(v);
}

function truncate(v: string, max: number): string {
  return v.length <= max ? v : v.slice(0, max);
}

async function count(table: string): Promise<number> {
  const rows = await prisma.$queryRawUnsafe<Array<{ c: bigint }>>(
    `SELECT COUNT(*) AS c FROM \`${table}\``
  );
  return Number(rows[0].c);
}

async function fetchAll<T = Record<string, unknown>>(
  table: string
): Promise<T[]> {
  return prisma.$queryRawUnsafe<T[]>(`SELECT * FROM \`${table}\``);
}

async function chunkedCreateMany<T extends object>(
  label: string,
  rows: T[],
  write: (chunk: T[]) => Promise<unknown>
) {
  if (rows.length === 0) return;
  bump(report.written, label, 0);
  if (dryRun) {
    bump(report.written, label, rows.length);
    return;
  }
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    await write(chunk);
    bump(report.written, label, chunk.length);
    process.stdout.write(`\r  ${label}: ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
  }
  process.stdout.write("\n");
}

const PREFIX_NAMES: Record<number, string> = {
  1: "นาย",
  2: "นาง",
  3: "นางสาว",
  4: "เด็กชาย",
  5: "เด็กหญิง",
  9: "อื่นๆ",
};

function mapAdminStatus(status: number | null | undefined) {
  if (status === 1) return "APPROVED" as const;
  if (status === 3) return "DISABLED" as const;
  if (status === 0) return "PENDING" as const;
  return "PENDING" as const;
}

function roundHasData(
  row: Record<string, unknown>,
  round: 1 | 2 | 3
): boolean {
  const suffix = round === 1 ? "" : String(round);
  const keys = [
    `consult${suffix}`,
    `schedule_telemed${suffix}`,
    `subjective${suffix}`,
    `objective${suffix}`,
    `assessment${suffix}`,
    `plan${suffix}`,
    `note${suffix}`,
    `follow_up${suffix}`,
    `unreachable${suffix}`,
  ];
  return keys.some((k) => {
    const v = row[k];
    if (v == null) return false;
    if (typeof v === "boolean" || typeof v === "number") return Boolean(v);
    if (v instanceof Date) return true;
    return nonEmpty(v);
  });
}

function roundConsultTelemedComplete(
  row: Record<string, unknown>,
  round: 1 | 2 | 3
): boolean {
  const suffix = round === 1 ? "" : String(round);
  const consult = row[`consult${suffix}`];
  const schedule = row[`schedule_telemed${suffix}`];
  return nonEmpty(consult) && schedule != null;
}

function mapCaseStatus(row: Record<string, unknown>) {
  // Legacy status 3 = follow-up finished (any round count) → CLOSED
  if (Number(row.status) === 3) return "CLOSED" as const;
  if (roundConsultTelemedComplete(row, 1)) return "IN_PROGRESS" as const;
  return "PENDING" as const;
}

function treatmentNotePayload(
  caseId: string,
  round: 1 | 2 | 3,
  row: Record<string, unknown>
) {
  const suffix = round === 1 ? "" : String(round);
  return {
    caseId,
    round,
    consult: row[`consult${suffix}`]
      ? truncate(text(row[`consult${suffix}`]), 100)
      : null,
    scheduleTelemed: (row[`schedule_telemed${suffix}`] as Date | null) ?? null,
    unreachable: Boolean(row[`unreachable${suffix}`]),
    subjective: row[`subjective${suffix}`]
      ? text(row[`subjective${suffix}`])
      : null,
    objective: row[`objective${suffix}`]
      ? text(row[`objective${suffix}`])
      : null,
    assessment: row[`assessment${suffix}`]
      ? text(row[`assessment${suffix}`])
      : null,
    plan: row[`plan${suffix}`] ? text(row[`plan${suffix}`]) : null,
    note: row[`note${suffix}`] ? text(row[`note${suffix}`]) : null,
    followUp: (row[`follow_up${suffix}`] as Date | null) ?? null,
  };
}

async function ensureLookups() {
  console.log("\n== Lookups ==");

  const provinces = await fetchAll<{
    id: number;
    code: number;
    nameInThai: string;
  }>("legacy_provinces");
  const districts = await fetchAll<{
    id: number;
    code: number;
    nameInThai: string;
    provinceId: number | null;
    provincesId: number | null;
    zoneId: number | null;
  }>("legacy_districts");
  const subdistricts = await fetchAll<{
    id: number;
    code: number;
    nameInThai: string;
    districtId: number;
  }>("legacy_subdistricts");

  bump(report.source, "provinces", provinces.length);
  bump(report.source, "districts", districts.length);
  bump(report.source, "subdistricts", subdistricts.length);

  await chunkedCreateMany("Province", provinces, (chunk) =>
    prisma.province.createMany({
      data: chunk.map((p) => ({
        id: p.id,
        code: p.code,
        nameInThai: p.nameInThai,
      })),
      skipDuplicates: true,
    })
  );

  await chunkedCreateMany(
    "District",
    districts.filter((d) => d.provinceId != null || d.provincesId != null),
    (chunk) =>
      prisma.district.createMany({
        data: chunk.map((d) => ({
          id: d.id,
          code: d.code,
          nameInThai: d.nameInThai,
          provinceId: (d.provinceId ?? d.provincesId) as number,
          zoneId: null, // legacy zone rows not migrated as Zone entities
        })),
        skipDuplicates: true,
      })
  );

  await chunkedCreateMany("Subdistrict", subdistricts, (chunk) =>
    prisma.subdistrict.createMany({
      data: chunk.map((s) => ({
        id: s.id,
        code: s.code,
        nameInThai: s.nameInThai,
        districtId: s.districtId,
      })),
      skipDuplicates: true,
    })
  );

  const affiliations = await fetchAll<{
    id: number;
    name: string;
    status: number | boolean;
    createdAt: Date;
    updatedAt: Date;
  }>("legacy_affiliation");
  await chunkedCreateMany("Affiliation", affiliations, (chunk) =>
    prisma.affiliation.createMany({
      data: chunk.map((a) => ({
        id: a.id,
        name: a.name,
        status: Boolean(a.status),
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      })),
      skipDuplicates: true,
    })
  );

  const employeeTypes = await fetchAll<{
    id: number;
    name: string;
    status: number | boolean;
    createdAt: Date;
    updatedAt: Date;
  }>("legacy_employee_type");
  await chunkedCreateMany("EmployeeType", employeeTypes, (chunk) =>
    prisma.employeeType.createMany({
      data: chunk.map((e) => ({
        id: e.id,
        name: e.name,
        status: Boolean(e.status),
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      })),
      skipDuplicates: true,
    })
  );

  const volunteerTypes = await fetchAll<{
    id: number;
    name: string;
    status: number | boolean;
    createdAt: Date;
    updatedAt: Date;
  }>("legacy_volunteer_type");
  await chunkedCreateMany("VolunteerType", volunteerTypes, (chunk) =>
    prisma.volunteerType.createMany({
      data: chunk.map((v) => ({
        id: v.id,
        name: v.name,
        status: Boolean(v.status),
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      })),
      skipDuplicates: true,
    })
  );

  const roles = await fetchAll<{ id: number; name: string }>("legacy_roles");
  await chunkedCreateMany("Role", roles, (chunk) =>
    prisma.role.createMany({
      data: chunk.map((r) => ({
        id: r.id,
        code: r.name.toUpperCase().replace(/\s+/g, "_"),
        name: r.name,
      })),
      skipDuplicates: true,
    })
  );

  const prefixIds = Array.from(
    new Set(
      (
        await prisma.$queryRawUnsafe<Array<{ prefixId: number }>>(
          `SELECT DISTINCT prefixId FROM legacy_profile
           UNION SELECT DISTINCT prefixId FROM legacy_profile_admin
           UNION SELECT DISTINCT prefixId FROM legacy_referent`
        )
      ).map((r) => r.prefixId)
    )
  );
  const prefixes = prefixIds.map((id) => ({
    id,
    name: PREFIX_NAMES[id] ?? `คำนำหน้า ${id}`,
  }));
  await chunkedCreateMany("Prefix", prefixes, (chunk) =>
    prisma.prefix.createMany({ data: chunk, skipDuplicates: true })
  );

  const schools = await fetchAll<{
    id: number;
    name: string;
    districtId: number;
    status: number | boolean;
    screeningDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }>("legacy_school");
  await chunkedCreateMany("School", schools, (chunk) =>
    prisma.school.createMany({
      data: chunk.map((s) => ({
        id: s.id,
        name: truncate(s.name, 200),
        districtId: s.districtId,
        status: Boolean(s.status),
        screeningDate: s.screeningDate,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
      skipDuplicates: true,
    })
  );

  // Placeholder geo for facilities created from free-text agency
  const fallbackSub = subdistricts[0];
  const fallbackDistrict = districts.find((d) => d.id === fallbackSub?.districtId);
  const fallbackProvinceId =
    fallbackDistrict?.provinceId ?? fallbackDistrict?.provincesId ?? provinces[0]?.id;
  const fallbackAffiliationId = affiliations[0]?.id ?? 1;

  if (!fallbackSub || !fallbackProvinceId) {
    throw new Error("Cannot seed HealthcareFacility: missing geo seed data");
  }

  const agencyRows = await prisma.$queryRawUnsafe<Array<{ agency: string }>>(
    `SELECT DISTINCT agency FROM (
       SELECT agency FROM legacy_profile_admin WHERE agency IS NOT NULL AND TRIM(agency) != ''
       UNION
       SELECT agency FROM legacy_referent WHERE agency IS NOT NULL AND TRIM(agency) != ''
     ) x`
  );

  const facilityByAgency = new Map<string, string>();
  const facilityRows: Array<{
    id: string;
    name: string;
    provinceId: number;
    districtId: number;
    subdistrictId: number;
    affiliationId: number;
  }> = [];

  // Always create a fallback facility for empty agency
  const fallbackFacilityId = "legacy-facility-unknown";
  facilityRows.push({
    id: fallbackFacilityId,
    name: "LEGACY_UNKNOWN_AGENCY",
    provinceId: fallbackProvinceId,
    districtId: fallbackSub.districtId,
    subdistrictId: fallbackSub.id,
    affiliationId: fallbackAffiliationId,
  });
  facilityByAgency.set("", fallbackFacilityId);

  for (const { agency } of agencyRows) {
    const name = truncate(agency.trim() || "LEGACY_UNKNOWN_AGENCY", 200);
    const id = `legacy-facility-${Buffer.from(name).toString("hex").slice(0, 24)}`;
    facilityByAgency.set(agency.trim(), id);
    facilityRows.push({
      id,
      name,
      provinceId: fallbackProvinceId,
      districtId: fallbackSub.districtId,
      subdistrictId: fallbackSub.id,
      affiliationId: fallbackAffiliationId,
    });
  }

  await chunkedCreateMany("HealthcareFacility", facilityRows, (chunk) =>
    prisma.healthcareFacility.createMany({
      data: chunk,
      skipDuplicates: true,
    })
  );

  return { facilityByAgency, fallbackFacilityId, subdistricts };
}

async function migrateUsersAndAccounts() {
  console.log("\n== User / Account ==");
  const users = await fetchAll<{
    id: string;
    name: string | null;
    username: string | null;
    email: string | null;
    emailVerified: Date | null;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>("legacy_user");
  bump(report.source, "user", users.length);

  await chunkedCreateMany("User", users, (chunk) =>
    prisma.user.createMany({
      data: chunk.map((u) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        emailVerified: u.emailVerified,
        image: u.image,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
      skipDuplicates: true,
    })
  );

  const accounts = await fetchAll<{
    id: string;
    userId: string;
    type: string;
    provider: string;
    providerAccountId: string;
    refresh_token: string | null;
    access_token: string | null;
    expires_at: number | null;
    token_type: string | null;
    scope: string | null;
    id_token: string | null;
    session_state: string | null;
    refresh_token_expires_in: number | null;
    createdAt: Date;
    updatedAt: Date;
  }>("legacy_account");
  bump(report.source, "account", accounts.length);

  await chunkedCreateMany("Account", accounts, (chunk) =>
    prisma.account.createMany({
      data: chunk.map((a) => ({
        id: a.id,
        userId: a.userId,
        type: a.type,
        provider: a.provider,
        providerAccountId: a.providerAccountId,
        refresh_token: a.refresh_token,
        access_token: a.access_token,
        expires_at: a.expires_at,
        token_type: a.token_type,
        scope: a.scope,
        id_token: a.id_token,
        session_state: a.session_state,
        refresh_token_expires_in: a.refresh_token_expires_in,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      })),
      skipDuplicates: true,
    })
  );
}

async function migrateProfiles(validSubdistrictIds: Set<number>) {
  console.log("\n== Profile / Address / EmergencyContact ==");
  const profiles = await fetchAll<{
    id: string;
    userId: string | null;
    citizenId: string;
    gradeYear: number | null;
    sex: number;
    firstname: string;
    lastname: string;
    birthday: Date;
    ethnicity: string;
    nationality: string;
    tel: string;
    hn: string | null;
    createdAt: Date;
    updatedAt: Date;
    schoolId: number | null;
    prefixId: number;
  }>("legacy_profile");
  bump(report.source, "profile", profiles.length);

  await chunkedCreateMany(
    "Profile",
    profiles.map((p) => ({
      id: p.id,
      userId: p.userId || null,
      citizenId: truncate(p.citizenId, 13),
      prefixId: p.prefixId,
      sex: mapLegacySexToSex(p.sex),
      firstName: truncate(p.firstname || "UNKNOWN", 100),
      lastName: truncate(p.lastname || "UNKNOWN", 100),
      birthDate: p.birthday,
      ethnicity: truncate(p.ethnicity || "ไม่ระบุ", 50),
      nationality: truncate(p.nationality || "ไม่ระบุ", 50),
      phone: truncate(p.tel || "0000000000", 20),
      hn: p.hn ? truncate(p.hn, 50) : null,
      schoolId: p.schoolId,
      gradeYear: p.gradeYear,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })),
    (chunk) => prisma.profile.createMany({ data: chunk, skipDuplicates: true })
  );

  const addresses = await fetchAll<{
    id: string;
    profileId: string;
    houseNo: string;
    villageNo: string | null;
    soi: string | null;
    road: string | null;
    province: number;
    district: number;
    subdistrict: number;
  }>("legacy_address");
  bump(report.source, "address", addresses.length);

  const goodAddresses = addresses.filter((a) =>
    validSubdistrictIds.has(a.subdistrict)
  );
  const badAddresses = addresses.length - goodAddresses.length;
  bump(report.skipped, "address_bad_geo", badAddresses);

  await chunkedCreateMany(
    "Address",
    goodAddresses.map((a) => ({
      id: a.id,
      profileId: a.profileId,
      houseNo: truncate(a.houseNo || "-", 50),
      villageNo: a.villageNo ? truncate(a.villageNo, 50) : null,
      soi: a.soi ? truncate(a.soi, 100) : null,
      road: a.road ? truncate(a.road, 100) : null,
      provinceId: a.province,
      districtId: a.district,
      subdistrictId: a.subdistrict,
    })),
    (chunk) => prisma.address.createMany({ data: chunk, skipDuplicates: true })
  );

  const contacts = await fetchAll<{
    id: string;
    profileId: string;
    name: string;
    tel: string;
    relation: string;
  }>("legacy_emergencycontact");
  bump(report.source, "emergencycontact", contacts.length);

  await chunkedCreateMany(
    "EmergencyContact",
    contacts.map((c) => ({
      id: c.id,
      profileId: c.profileId,
      name: truncate(c.name || "-", 100),
      phone: truncate(c.tel || "0000000000", 20),
      relation: truncate(c.relation || "-", 50),
    })),
    (chunk) =>
      prisma.emergencyContact.createMany({ data: chunk, skipDuplicates: true })
  );
}

async function migrateStaff(facilityByAgency: Map<string, string>, fallbackFacilityId: string) {
  console.log("\n== ProfileAdmin / Volunteer ==");
  const admins = await fetchAll<{
    id: string;
    userId: string;
    citizenId: string;
    firstname: string;
    lastname: string;
    tel: string | null;
    affiliationId: number;
    agency: string | null;
    employeeTypeId: number;
    professional: string | null;
    license: string | null;
    status: number;
    createdAt: Date;
    updatedAt: Date;
    prefixId: number;
    roleId: number;
    alert: number | boolean;
  }>("legacy_profile_admin");
  bump(report.source, "profile_admin", admins.length);

  await chunkedCreateMany(
    "ProfileAdmin",
    admins.map((a) => {
      const agency = (a.agency ?? "").trim();
      return {
        id: a.id,
        userId: a.userId,
        citizenId: truncate(a.citizenId, 13),
        prefixId: a.prefixId,
        firstName: truncate(a.firstname || "UNKNOWN", 100),
        lastName: truncate(a.lastname || "UNKNOWN", 100),
        phone: a.tel ? truncate(a.tel, 20) : null,
        affiliationId: a.affiliationId,
        employeeTypeId: a.employeeTypeId,
        profession: a.professional ? truncate(a.professional, 100) : null,
        license: a.license ? truncate(a.license, 50) : null,
        status: mapAdminStatus(a.status),
        receiveAlert: Boolean(a.alert),
        roleId: a.roleId,
        healthcareFacilityId:
          facilityByAgency.get(agency) ?? fallbackFacilityId,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      };
    }),
    (chunk) =>
      prisma.profileAdmin.createMany({ data: chunk, skipDuplicates: true })
  );

  const referents = await fetchAll<{
    id: number;
    citizenId: string;
    firstname: string;
    lastname: string;
    email: string;
    tel: string;
    volunteer_type_id: number;
    employee_type_id: number;
    affiliation_id: number;
    agency: string | null;
    status: number | boolean;
    createdAt: Date;
    updatedAt: Date;
    prefixId: number;
  }>("legacy_referent");
  bump(report.source, "referent", referents.length);

  await chunkedCreateMany(
    "Volunteer",
    referents.map((r) => {
      const agency = (r.agency ?? "").trim();
      return {
        id: r.id,
        citizenId: truncate(r.citizenId, 13),
        prefixId: r.prefixId,
        firstName: truncate(r.firstname || "UNKNOWN", 100),
        lastName: truncate(r.lastname || "UNKNOWN", 100),
        email: truncate(r.email || `volunteer-${r.id}@legacy.local`, 255),
        phone: truncate(r.tel || "0000000000", 20),
        volunteerTypeId: r.volunteer_type_id,
        employeeTypeId: r.employee_type_id,
        affiliationId: r.affiliation_id,
        healthcareFacilityId:
          facilityByAgency.get(agency) ?? fallbackFacilityId,
        status: Boolean(r.status),
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    }),
    (chunk) => prisma.volunteer.createMany({ data: chunk, skipDuplicates: true })
  );
}

async function migrateCases() {
  console.log("\n== Case / TreatmentNote / Questionnaires ==");
  const masters = await fetchAll<Record<string, unknown>>(
    "legacy_questions_master"
  );
  bump(report.source, "questions_master", masters.length);

  const volunteerIds = new Set(
    (
      await prisma.$queryRawUnsafe<Array<{ id: number }>>(
        "SELECT id FROM legacy_referent"
      )
    ).map((r) => r.id)
  );

  const cases = [];
  const notes = [];

  for (const row of masters) {
    const id = String(row.id);
    const result = mapLegacyRiskColorToScreeningResult(
      row.result as string | null
    );
    const status = mapCaseStatus(row);
    bump(report.screeningResult, result);
    bump(report.caseStatus, status);

    const rawVolunteerId =
      row.referentId != null ? Number(row.referentId) : null;
    const volunteerId =
      rawVolunteerId != null && volunteerIds.has(rawVolunteerId)
        ? rawVolunteerId
        : null;
    if (rawVolunteerId != null && volunteerId == null) {
      bump(report.skipped, "case_orphan_referent");
    }

    cases.push({
      id,
      profileId: String(row.profileId),
      volunteerId,
      latitude: row.latitude as Prisma.Decimal | null,
      longitude: row.longitude as Prisma.Decimal | null,
      package: "FULL" as const,
      result,
      closeCaseReason: row.close_case_reason
        ? text(row.close_case_reason)
        : null,
      status,
      createdAt: row.createdAt as Date,
      updatedAt: row.updatedAt as Date,
    });

    for (const round of [1, 2, 3] as const) {
      if (!roundHasData(row, round)) continue;
      notes.push(treatmentNotePayload(id, round, row));
    }
  }

  await chunkedCreateMany("Case", cases, (chunk) =>
    prisma.case.createMany({ data: chunk, skipDuplicates: true })
  );
  await chunkedCreateMany("TreatmentNote", notes, (chunk) =>
    prisma.treatmentNote.createMany({ data: chunk, skipDuplicates: true })
  );

  // Questionnaires round=1
  const q2 = await fetchAll<Record<string, unknown>>("legacy_questions_2q");
  bump(report.source, "questions_2q", q2.length);
  await chunkedCreateMany(
    "Question2Q",
    q2.map((q) => ({
      id: String(q.id),
      caseId: String(q.questions_MasterId),
      round: 1,
      q1: Number(q.q1) || 0,
      q2: Number(q.q2) || 0,
    })),
    (chunk) => prisma.question2Q.createMany({ data: chunk, skipDuplicates: true })
  );

  const q9 = await fetchAll<Record<string, unknown>>("legacy_questions_9q");
  bump(report.source, "questions_9q", q9.length);
  await chunkedCreateMany(
    "Question9Q",
    q9.map((q) => ({
      id: String(q.id),
      caseId: String(q.questions_MasterId),
      round: 1,
      q1: Number(q.q1) || 0,
      q2: Number(q.q2) || 0,
      q3: Number(q.q3) || 0,
      q4: Number(q.q4) || 0,
      q5: Number(q.q5) || 0,
      q6: Number(q.q6) || 0,
      q7: Number(q.q7) || 0,
      q8: Number(q.q8) || 0,
      q9: Number(q.q9) || 0,
      sum: Number(q.sum) || 0,
    })),
    (chunk) => prisma.question9Q.createMany({ data: chunk, skipDuplicates: true })
  );

  const phqa = await fetchAll<Record<string, unknown>>("legacy_questions_phqa");
  bump(report.source, "questions_phqa", phqa.length);
  await chunkedCreateMany(
    "QuestionPhqa",
    phqa.map((q) => ({
      id: String(q.id),
      caseId: String(q.questions_MasterId),
      round: 1,
      q1: Number(q.q1) || 0,
      q2: Number(q.q2) || 0,
      q3: Number(q.q3) || 0,
      q4: Number(q.q4) || 0,
      q5: Number(q.q5) || 0,
      q6: Number(q.q6) || 0,
      q7: Number(q.q7) || 0,
      q8: Number(q.q8) || 0,
      q9: Number(q.q9) || 0,
      sum: Number(q.sum) || 0,
    })),
    (chunk) =>
      prisma.questionPhqa.createMany({ data: chunk, skipDuplicates: true })
  );

  const addon = await fetchAll<Record<string, unknown>>(
    "legacy_questions_phqa_addon"
  );
  bump(report.source, "questions_phqa_addon", addon.length);
  await chunkedCreateMany(
    "QuestionPhqaAddon",
    addon.map((q) => ({
      id: String(q.id),
      caseId: String(q.questions_MasterId),
      round: 1,
      q1: Number(q.q1) || 0,
      q2: Number(q.q2) || 0,
    })),
    (chunk) =>
      prisma.questionPhqaAddon.createMany({ data: chunk, skipDuplicates: true })
  );

  const q8 = await fetchAll<Record<string, unknown>>("legacy_questions_8q");
  bump(report.source, "questions_8q", q8.length);
  await chunkedCreateMany(
    "Question8Q",
    q8.map((q) => ({
      id: String(q.id),
      caseId: String(q.questions_MasterId),
      round: 1,
      q1: Number(q.q1) || 0,
      q2: Number(q.q2) || 0,
      q3: Number(q.q3) || 0,
      q4: Number(q.q4) || 0,
      q5: Number(q.q5) || 0,
      q6: Number(q.q6) || 0,
      q7: Number(q.q7) || 0,
      q8: Number(q.q8) || 0,
      q8Addon: Number(q.q8Addon) || 0,
      sum: Number(q.sum) || 0,
    })),
    (chunk) => prisma.question8Q.createMany({ data: chunk, skipDuplicates: true })
  );

  const problems = await fetchAll<Record<string, unknown>>(
    "legacy_questions_problem"
  );
  bump(report.source, "questions_problem", problems.length);
  await chunkedCreateMany(
    "QuestionProblem",
    problems.map((q) => ({
      id: String(q.id),
      caseId: String(q.questions_MasterId),
      round: 1,
      familyRelation: Number(q.familyRelation) || 0,
      familyStudyPressure: Number(q.familyStudyPressure) || 0,
      familyConflict: Number(q.familyConflict) || 0,
      familyAbuse: Number(q.familyAbuse) || 0,
      familyLoss: Number(q.familyLoss) || 0,
      socialFriendIssue: Number(q.socialFriendIssue) || 0,
      socialBullying: Number(q.socialBullying) || 0,
      socialBreakup: Number(q.socialBreakup) || 0,
      socialTeacher: Number(q.socialTeacher) || 0,
      socialAssault: Number(q.socialAssault) || 0,
      studyStress: Number(q.studyStress) || 0,
      studyNoMotivation: Number(q.studyNoMotivation) || 0,
      studyBurnout: Number(q.studyBurnout) || 0,
      studyTimeManage: Number(q.studyTimeManage) || 0,
      studyHomeworkLoad: Number(q.studyHomeworkLoad) || 0,
      studyExamAnxiety: Number(q.studyExamAnxiety) || 0,
      financeFamilyIssue: Number(q.financeFamilyIssue) || 0,
      lifestyleSocialMediaOveruse: Number(q.lifestyleSocialMediaOveruse) || 0,
      lifestyleGamingAddiction: Number(q.lifestyleGamingAddiction) || 0,
      lifestyleSubstanceUse: Number(q.lifestyleSubstanceUse) || 0,
      lifestyleEatingIssue: Number(q.lifestyleEatingIssue) || 0,
      lifestyleBodyImageConcern: Number(q.lifestyleBodyImageConcern) || 0,
      lifestyleInsomnia: Number(q.lifestyleInsomnia) || 0,
      sum: Number(q.sum) || 0,
    })),
    (chunk) =>
      prisma.questionProblem.createMany({ data: chunk, skipDuplicates: true })
  );
}

async function verifySpotChecks() {
  console.log("\n== Spot checks ==");
  if (dryRun) {
    report.spotChecks.push("skipped in dry-run (no writes)");
    return;
  }

  const sample = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `SELECT id, result, status, profileId FROM legacy_questions_master LIMIT 5`
  );

  for (const row of sample) {
    const c = await prisma.case.findUnique({
      where: { id: String(row.id) },
      include: { treatmentNotes: true, profile: true },
    });
    if (!c) {
      report.errors.push(`missing Case ${row.id}`);
      continue;
    }
    const expected = mapLegacyRiskColorToScreeningResult(row.result as string);
    if (c.result !== expected) {
      report.errors.push(
        `Case ${c.id} result ${c.result} != expected ${expected}`
      );
    }
    if (c.profileId !== String(row.profileId)) {
      report.errors.push(`Case ${c.id} profile mismatch`);
    }
    report.spotChecks.push(
      `Case ${c.id}: result=${c.result} status=${c.status} notes=${c.treatmentNotes.length}`
    );
  }

  // Screening distribution compare
  const v2dist = await prisma.case.groupBy({
    by: ["result"],
    _count: { _all: true },
  });
  for (const row of v2dist) {
    const key = row.result;
    const got = row._count._all;
    const expected = report.screeningResult[key] ?? 0;
    if (got !== expected) {
      report.errors.push(
        `ScreeningResult ${key}: v2=${got} planned=${expected}`
      );
    }
  }
}

async function main() {
  if (!dryRun && !apply) {
    console.error("Pass --dry-run or --apply");
    process.exit(1);
  }

  console.log(`Mode: ${report.mode}`);

  // Pre-count sources
  for (const t of [
    "legacy_user",
    "legacy_profile",
    "legacy_questions_master",
    "legacy_profile_admin",
    "legacy_referent",
  ]) {
    bump(report.source, `${t}_count`, await count(t));
  }

  if (!dryRun) {
    const existingCases = await prisma.case.count();
    if (existingCases > 0) {
      console.error(
        `Abort: Case already has ${existingCases} rows. Truncate v2 clinical tables before --apply, or use a fresh DB.`
      );
      process.exit(1);
    }
  }

  const { facilityByAgency, fallbackFacilityId, subdistricts } =
    await ensureLookups();
  const validSubdistrictIds = new Set(subdistricts.map((s) => s.id));

  await migrateUsersAndAccounts();
  await migrateProfiles(validSubdistrictIds);
  await migrateStaff(facilityByAgency, fallbackFacilityId);
  await migrateCases();
  await verifySpotChecks();

  console.log("\n========== ETL REPORT ==========");
  console.log(JSON.stringify(report, null, 2));

  if (report.errors.length) {
    console.error(`\nCompleted with ${report.errors.length} error(s).`);
    process.exit(1);
  }

  console.log(
    dryRun
      ? "\nDry-run OK — no data written. Re-run with --apply to write."
      : "\nApply OK."
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
