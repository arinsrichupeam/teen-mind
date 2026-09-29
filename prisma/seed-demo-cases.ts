/**
 * Demo mock: HealthcareFacilities + Profiles + Cases across multiple orgs.
 *
 * Idempotent by stable demo keys (facility name `[DEMO] …`, citizenId series).
 * Does not modify foundational lookup seed (`prisma/seed.ts`).
 *
 * Prerequisites: geo (Province/District/Subdistrict) + Role/Prefix/Affiliation seeded.
 *
 * Usage:
 *   npx tsx prisma/seed-demo-cases.ts
 *   npm run db:seed:demo
 */
/* eslint-disable no-console -- CLI seed script reports progress to stdout */
import {
  AssessmentPackage,
  CaseStatus,
  CaseTransferStatus,
  FacilityStatus,
  PrismaClient,
  ScreeningResult,
  Sex,
} from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_FACILITY_PREFIX = "[DEMO]";

/** Valid Thai national-ID checksum (same algorithm as lib/profile-utils). */
function citizenIdFromSerial(serial: number): string {
  const body = `1909900${String(serial).padStart(5, "0")}`;

  if (body.length !== 12) {
    throw new Error(`demo citizen body must be 12 digits, got ${body}`);
  }
  let sum = 0;

  for (let i = 0; i < 12; i++) {
    sum += parseInt(body.charAt(i), 10) * (13 - i);
  }
  const check = (11 - (sum % 11)) % 10;

  return `${body}${check}`;
}

type DemoFacilityDef = {
  key: string;
  name: string;
  districtId: number;
  subdistrictId: number;
  affiliationId: number;
  lat: number;
  lng: number;
};

/** Bangkok districts 1–6,10 — ids match seeded geo. */
const DEMO_FACILITIES: DemoFacilityDef[] = [
  {
    key: "phranakhon",
    name: `${DEMO_FACILITY_PREFIX} ศบส. พระนคร`,
    districtId: 1,
    subdistrictId: 1,
    affiliationId: 1,
    lat: 13.751,
    lng: 100.492,
  },
  {
    key: "dusit",
    name: `${DEMO_FACILITY_PREFIX} ศบส. ดุสิต`,
    districtId: 2,
    subdistrictId: 13,
    affiliationId: 1,
    lat: 13.772,
    lng: 100.515,
  },
  {
    key: "nongchok",
    name: `${DEMO_FACILITY_PREFIX} ศบส. หนองจอก`,
    districtId: 3,
    subdistrictId: 18,
    affiliationId: 1,
    lat: 13.855,
    lng: 100.862,
  },
  {
    key: "bangrak",
    name: `${DEMO_FACILITY_PREFIX} ศบส. บางรัก`,
    districtId: 4,
    subdistrictId: 26,
    affiliationId: 2,
    lat: 13.726,
    lng: 100.523,
  },
  {
    key: "bangkhen",
    name: `${DEMO_FACILITY_PREFIX} ศบส. บางเขน`,
    districtId: 5,
    subdistrictId: 31,
    affiliationId: 1,
    lat: 13.873,
    lng: 100.596,
  },
  {
    key: "minburi",
    name: `${DEMO_FACILITY_PREFIX} ศบส. มีนบุรี`,
    districtId: 10,
    subdistrictId: 46,
    affiliationId: 1,
    lat: 13.804,
    lng: 100.748,
  },
];

type DemoCaseDef = {
  serial: number;
  facilityKey: string;
  firstName: string;
  lastName: string;
  sex: Sex;
  prefixId: number;
  birthDate: string; // ISO date
  hn?: string;
  status: CaseStatus;
  result: ScreeningResult;
  /** If set, case is TRANSFER_PENDING toward this facility key. */
  transferToKey?: string;
  package?: AssessmentPackage;
  /** Adult path uses 9Q; under-18 uses PHQ-A (+ addon). */
  scale: "9q" | "phqa" | "negative2q";
};

const DEMO_CASES: DemoCaseDef[] = [
  // พระนคร
  {
    serial: 1,
    facilityKey: "phranakhon",
    firstName: "สมชาย",
    lastName: "ใจดี",
    sex: Sex.MALE,
    prefixId: 3,
    birthDate: "1998-05-12",
    hn: "HN-DEMO-001",
    status: CaseStatus.PENDING,
    result: ScreeningResult.NEGATIVE,
    scale: "negative2q",
  },
  {
    serial: 2,
    facilityKey: "phranakhon",
    firstName: "สมหญิง",
    lastName: "สุขใจ",
    sex: Sex.FEMALE,
    prefixId: 4,
    birthDate: "2001-08-20",
    status: CaseStatus.PENDING,
    result: ScreeningResult.POSITIVE_HIGH,
    scale: "9q",
  },
  {
    serial: 3,
    facilityKey: "phranakhon",
    firstName: "วิชัย",
    lastName: "มั่นคง",
    sex: Sex.MALE,
    prefixId: 3,
    birthDate: "1995-01-03",
    hn: "HN-DEMO-003",
    status: CaseStatus.IN_PROGRESS,
    result: ScreeningResult.POSITIVE_MODERATE,
    scale: "9q",
  },
  // ดุสิต
  {
    serial: 4,
    facilityKey: "dusit",
    firstName: "นภา",
    lastName: "แสงทอง",
    sex: Sex.FEMALE,
    prefixId: 4,
    birthDate: "2010-11-15",
    status: CaseStatus.PENDING,
    result: ScreeningResult.POSITIVE_SEVERE,
    scale: "phqa",
  },
  {
    serial: 5,
    facilityKey: "dusit",
    firstName: "กิตติ",
    lastName: "พูนสุข",
    sex: Sex.MALE,
    prefixId: 3,
    birthDate: "1992-07-22",
    hn: "HN-DEMO-005",
    status: CaseStatus.CLOSED,
    result: ScreeningResult.POSITIVE_LOW,
    scale: "9q",
  },
  // หนองจอก
  {
    serial: 6,
    facilityKey: "nongchok",
    firstName: "ปิยะ",
    lastName: "รื่นรมย์",
    sex: Sex.MALE,
    prefixId: 3,
    birthDate: "2000-03-09",
    status: CaseStatus.PENDING,
    result: ScreeningResult.POSITIVE_MODERATE,
    scale: "9q",
  },
  {
    serial: 7,
    facilityKey: "nongchok",
    firstName: "มานี",
    lastName: "ใจเย็น",
    sex: Sex.FEMALE,
    prefixId: 4,
    birthDate: "2012-04-18",
    status: CaseStatus.TRANSFER_PENDING,
    result: ScreeningResult.POSITIVE_HIGH,
    transferToKey: "bangrak",
    scale: "phqa",
  },
  // บางรัก
  {
    serial: 8,
    facilityKey: "bangrak",
    firstName: "อรุณ",
    lastName: "วัฒนา",
    sex: Sex.MALE,
    prefixId: 3,
    birthDate: "1988-12-01",
    hn: "HN-DEMO-008",
    status: CaseStatus.IN_PROGRESS,
    result: ScreeningResult.POSITIVE_SEVERE,
    scale: "9q",
  },
  {
    serial: 9,
    facilityKey: "bangrak",
    firstName: "สุดา",
    lastName: "งามตา",
    sex: Sex.FEMALE,
    prefixId: 5,
    birthDate: "1990-06-30",
    status: CaseStatus.PENDING,
    result: ScreeningResult.NEGATIVE,
    scale: "negative2q",
  },
  // บางเขน
  {
    serial: 10,
    facilityKey: "bangkhen",
    firstName: "ธนา",
    lastName: "เก่งกาจ",
    sex: Sex.MALE,
    prefixId: 1,
    birthDate: "2011-09-05",
    status: CaseStatus.PENDING,
    result: ScreeningResult.POSITIVE_LOW,
    scale: "phqa",
  },
  {
    serial: 11,
    facilityKey: "bangkhen",
    firstName: "พิมพ์",
    lastName: "ใสใจ",
    sex: Sex.FEMALE,
    prefixId: 2,
    birthDate: "2009-02-14",
    hn: "HN-DEMO-011",
    status: CaseStatus.IN_PROGRESS,
    result: ScreeningResult.POSITIVE_MODERATE,
    scale: "phqa",
  },
  // มีนบุรี
  {
    serial: 12,
    facilityKey: "minburi",
    firstName: "ชัยวัฒน์",
    lastName: "บุญมี",
    sex: Sex.MALE,
    prefixId: 3,
    birthDate: "1997-10-28",
    status: CaseStatus.PENDING,
    result: ScreeningResult.INCOMPLETE,
    scale: "negative2q",
  },
  {
    serial: 13,
    facilityKey: "minburi",
    firstName: "วราภรณ์",
    lastName: "ดีพร้อม",
    sex: Sex.FEMALE,
    prefixId: 4,
    birthDate: "1994-04-07",
    hn: "HN-DEMO-013",
    status: CaseStatus.CLOSED,
    result: ScreeningResult.POSITIVE_HIGH,
    scale: "9q",
  },
  {
    serial: 14,
    facilityKey: "minburi",
    firstName: "ณัฐ",
    lastName: "ขยันเรียน",
    sex: Sex.MALE,
    prefixId: 3,
    birthDate: "2002-01-19",
    status: CaseStatus.TRANSFER_PENDING,
    result: ScreeningResult.POSITIVE_SEVERE,
    transferToKey: "phranakhon",
    scale: "9q",
  },
  {
    serial: 15,
    facilityKey: "dusit",
    firstName: "กานดา",
    lastName: "ยิ้มแย้ม",
    sex: Sex.FEMALE,
    prefixId: 4,
    birthDate: "1999-08-11",
    status: CaseStatus.PENDING,
    result: ScreeningResult.POSITIVE_LOW,
    scale: "9q",
  },
];

function q9Scores(sum: number): {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  q5: number;
  q6: number;
  q7: number;
  q8: number;
  q9: number;
  sum: number;
} {
  // Spread a target sum across 9 items (0–3 each).
  const vals = Array(9).fill(0) as number[];
  let remaining = Math.min(27, Math.max(0, sum));

  for (let i = 0; i < 9 && remaining > 0; i++) {
    const v = Math.min(3, remaining);

    vals[i] = v;
    remaining -= v;
  }

  return {
    q1: vals[0],
    q2: vals[1],
    q3: vals[2],
    q4: vals[3],
    q5: vals[4],
    q6: vals[5],
    q7: vals[6],
    q8: vals[7],
    q9: vals[8],
    sum: vals.reduce((a, b) => a + b, 0),
  };
}

function sumForResult(
  result: ScreeningResult,
  scale: DemoCaseDef["scale"]
): number {
  if (scale === "negative2q" || result === ScreeningResult.NEGATIVE) return 0;
  if (result === ScreeningResult.INCOMPLETE) return 0;
  if (scale === "phqa") {
    if (result === ScreeningResult.POSITIVE_LOW) return 7;
    if (result === ScreeningResult.POSITIVE_MODERATE) return 12;
    if (result === ScreeningResult.POSITIVE_HIGH) return 17;
    if (result === ScreeningResult.POSITIVE_SEVERE) return 22;

    return 3;
  }
  // 9Q bands
  if (result === ScreeningResult.POSITIVE_LOW) return 8;
  if (result === ScreeningResult.POSITIVE_MODERATE) return 14;
  if (result === ScreeningResult.POSITIVE_HIGH) return 20;
  if (result === ScreeningResult.POSITIVE_SEVERE) return 24;

  return 4;
}

async function ensureLookups() {
  const [prefixCount, roleCount, affiliationCount, province] =
    await Promise.all([
      prisma.prefix.count(),
      prisma.role.count(),
      prisma.affiliation.count(),
      prisma.province.findFirst({ where: { id: 1 } }),
    ]);

  if (!prefixCount || !roleCount || !affiliationCount) {
    throw new Error(
      "Missing Prefix/Role/Affiliation — run `npm run db:seed` first"
    );
  }
  if (!province) {
    throw new Error("Missing Bangkok province (id=1) — seed geo first");
  }
}

async function upsertFacilities(): Promise<Map<string, string>> {
  const map = new Map<string, string>();

  for (const f of DEMO_FACILITIES) {
    const existing = await prisma.healthcareFacility.findFirst({
      where: { name: f.name },
      select: { id: true },
    });

    if (existing) {
      map.set(f.key, existing.id);
      continue;
    }

    const created = await prisma.healthcareFacility.create({
      data: {
        name: f.name,
        provinceId: 1,
        districtId: f.districtId,
        subdistrictId: f.subdistrictId,
        affiliationId: f.affiliationId,
        latitude: f.lat,
        longitude: f.lng,
        status: FacilityStatus.ACTIVE,
        address: `หน่วยสาธิต Bangkok Mind — ${f.name}`,
      },
      select: { id: true },
    });

    map.set(f.key, created.id);
  }

  return map;
}

async function upsertCase(
  def: DemoCaseDef,
  facilityIds: Map<string, string>
): Promise<"created" | "skipped"> {
  const facilityId = facilityIds.get(def.facilityKey);

  if (!facilityId) {
    throw new Error(`Unknown facility key: ${def.facilityKey}`);
  }

  const transferToFacilityId = def.transferToKey
    ? facilityIds.get(def.transferToKey)
    : undefined;

  if (def.transferToKey && !transferToFacilityId) {
    throw new Error(`Unknown transferToKey: ${def.transferToKey}`);
  }

  const citizenId = citizenIdFromSerial(def.serial);
  const existingProfile = await prisma.profile.findUnique({
    where: { citizenId },
    select: { id: true, cases: { select: { id: true }, take: 1 } },
  });

  if (existingProfile?.cases.length) {
    return "skipped";
  }

  const facility = DEMO_FACILITIES.find((f) => f.key === def.facilityKey)!;
  const positive2q = def.scale !== "negative2q";
  const scores = q9Scores(sumForResult(def.result, def.scale));

  await prisma.$transaction(async (tx) => {
    const profile =
      existingProfile ??
      (await tx.profile.create({
        data: {
          citizenId,
          prefixId: def.prefixId,
          sex: def.sex,
          firstName: def.firstName,
          lastName: def.lastName,
          birthDate: new Date(`${def.birthDate}T00:00:00.000Z`),
          ethnicity: "ไทย",
          nationality: "ไทย",
          phone: `08${String(10000000 + def.serial).slice(-8)}`,
          hn: def.hn ?? null,
          isStudent: def.scale === "phqa",
          healthcareFacilityId: facilityId,
        },
      }));

    if (existingProfile && !existingProfile.cases.length) {
      await tx.profile.update({
        where: { id: profile.id },
        data: {
          healthcareFacilityId: facilityId,
          hn: def.hn ?? null,
        },
      });
    }

    const caseRow = await tx.case.create({
      data: {
        profileId: profile.id,
        healthcareFacilityId: facilityId,
        package: def.package ?? AssessmentPackage.DEPRESSION,
        result: def.result,
        status: def.status,
        latitude: facility.lat + def.serial * 0.0001,
        longitude: facility.lng + def.serial * 0.0001,
        closeCaseReason:
          def.status === CaseStatus.CLOSED ? "ปิดเคสตัวอย่าง (DEMO)" : null,
        transferToFacilityId:
          def.status === CaseStatus.TRANSFER_PENDING
            ? transferToFacilityId
            : null,
        transferNote:
          def.status === CaseStatus.TRANSFER_PENDING
            ? "ส่งต่อตัวอย่างเพื่อทดสอบ inbox ข้ามหน่วยงาน"
            : null,
        transferRequestedAt:
          def.status === CaseStatus.TRANSFER_PENDING ? new Date() : null,
      },
    });

    await tx.question2Q.create({
      data: {
        caseId: caseRow.id,
        round: 1,
        q1: positive2q ? 1 : 0,
        q2: positive2q ? 1 : 0,
      },
    });

    if (def.scale === "9q") {
      await tx.question9Q.create({
        data: { caseId: caseRow.id, round: 1, ...scores },
      });
      if (
        def.result === ScreeningResult.POSITIVE_HIGH ||
        def.result === ScreeningResult.POSITIVE_SEVERE ||
        def.result === ScreeningResult.POSITIVE_MODERATE
      ) {
        await tx.question8Q.create({
          data: {
            caseId: caseRow.id,
            round: 1,
            q1: 1,
            q2: 0,
            q3: 0,
            q4: 0,
            q5: 0,
            q6: 0,
            q7: 0,
            q8: def.result === ScreeningResult.POSITIVE_SEVERE ? 1 : 0,
            q8Addon: 0,
            sum: def.result === ScreeningResult.POSITIVE_SEVERE ? 2 : 1,
          },
        });
      }
    } else if (def.scale === "phqa") {
      await tx.questionPhqa.create({
        data: { caseId: caseRow.id, round: 1, ...scores },
      });
      await tx.questionPhqaAddon.create({
        data: {
          caseId: caseRow.id,
          round: 1,
          q1: def.result === ScreeningResult.POSITIVE_SEVERE ? 1 : 0,
          q2: 0,
        },
      });
    }

    if (def.status === CaseStatus.TRANSFER_PENDING && transferToFacilityId) {
      await tx.caseTransfer.create({
        data: {
          caseId: caseRow.id,
          fromFacilityId: facilityId,
          toFacilityId: transferToFacilityId,
          requestNote: "ส่งต่อตัวอย่าง (DEMO)",
          status: CaseTransferStatus.PENDING,
        },
      });
    }
  });

  return "created";
}

async function main() {
  console.log("Seeding DEMO cases across multiple HealthcareFacilities…");
  await ensureLookups();

  const facilityIds = await upsertFacilities();

  console.log(`  Facilities ready: ${facilityIds.size}`);

  let created = 0;
  let skipped = 0;

  for (const def of DEMO_CASES) {
    const outcome = await upsertCase(def, facilityIds);

    if (outcome === "created") created += 1;
    else skipped += 1;
  }

  const byFacility = await prisma.case.groupBy({
    by: ["healthcareFacilityId"],
    where: {
      healthcareFacility: { name: { startsWith: DEMO_FACILITY_PREFIX } },
    },
    _count: true,
  });

  console.log(
    `  Cases created: ${created}, skipped (already present): ${skipped}`
  );
  console.log(
    `  Demo case counts by facility: ${byFacility
      .map((r) => `${r.healthcareFacilityId?.slice(0, 8)}…=${r._count}`)
      .join(", ")}`
  );
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
