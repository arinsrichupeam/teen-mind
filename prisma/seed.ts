/**
 * Foundational seed for Bangkok Mind (v2 schema).
 *
 * Idempotent: safe to re-run (`skipDuplicates`).
 *
 * Usage:
 *   npx prisma db seed
 *   npx tsx prisma/seed.ts
 *
 * Seeds: Prefix, Role, Affiliation, EmployeeType, VolunteerType
 *
 * Does NOT seed geo, facilities, users, or cases.
 * For multi-facility mock cases see `prisma/seed-demo-cases.ts` (`npm run db:seed:demo`).
 */
/* eslint-disable no-console -- CLI seed script reports progress to stdout */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Align with `utils/data.ts` prefix keys used by LIFF / admin forms. */
const PREFIXES = [
  { id: 1, name: "ด.ช." },
  { id: 2, name: "ด.ญ." },
  { id: 3, name: "นาย" },
  { id: 4, name: "น.ส." },
  { id: 5, name: "นาง" },
  { id: 9, name: "อื่นๆ" },
] as const;

/** Align with `app/admin/(app)/data/optionData.ts` + `lib/admin-roles.ts` stable ids. */
const ROLES = [
  { id: 1, code: "USER", name: "User" },
  { id: 2, code: "VOLUNTEER", name: "Volunteer" },
  { id: 3, code: "STAFF", name: "Consult" },
  { id: 4, code: "ADMIN", name: "Admin" },
] as const;

const AFFILIATIONS = [
  { id: 1, name: "สำนักอนามัย กรุงเทพมหานคร" },
  { id: 2, name: "โรงพยาบาลในสังกัดกรุงเทพมหานคร" },
  { id: 3, name: "สำนักการศึกษา กรุงเทพมหานคร" },
  { id: 4, name: "สังกัดอื่น" },
] as const;

const EMPLOYEE_TYPES = [
  { id: 1, name: "ข้าราชการ" },
  { id: 2, name: "พนักงานราชการ" },
  { id: 3, name: "พนักงานกระทรวงสาธารณสุข" },
  { id: 4, name: "พนักงานจ้างเหมาบริการ" },
  { id: 5, name: "อื่นๆ" },
] as const;

const VOLUNTEER_TYPES = [
  { id: 1, name: "ครูแนะแนว" },
  { id: 2, name: "อาสาสมัครสาธารณสุข (อสม.)" },
  { id: 3, name: "เจ้าหน้าที่สาธารณสุข" },
  { id: 4, name: "จิตอาสา / อื่นๆ" },
] as const;

async function seedLookups() {
  console.log("== Lookups ==");

  await prisma.prefix.createMany({ data: [...PREFIXES], skipDuplicates: true });
  await prisma.role.createMany({ data: [...ROLES], skipDuplicates: true });
  await prisma.affiliation.createMany({
    data: AFFILIATIONS.map((a) => ({ ...a, status: true })),
    skipDuplicates: true,
  });
  await prisma.employeeType.createMany({
    data: EMPLOYEE_TYPES.map((e) => ({ ...e, status: true })),
    skipDuplicates: true,
  });
  await prisma.volunteerType.createMany({
    data: VOLUNTEER_TYPES.map((v) => ({ ...v, status: true })),
    skipDuplicates: true,
  });

  console.log(
    `  Prefix ${PREFIXES.length}, Role ${ROLES.length}, Affiliation ${AFFILIATIONS.length}, EmployeeType ${EMPLOYEE_TYPES.length}, VolunteerType ${VOLUNTEER_TYPES.length}`
  );
}

async function main() {
  console.log("Seeding Bangkok Mind foundational data…");
  await seedLookups();
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
