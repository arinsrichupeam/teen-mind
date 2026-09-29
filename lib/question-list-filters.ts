import { CaseStatus } from "@prisma/client";

import { mapLegacyRiskColorToScreeningResult } from "@/lib/legacy-value-mapping";
import { buildLegacyFollowUpStatusWhere } from "@/lib/case-status-mapping";

export function buildCaseWhereFromSearchParams(url: URL) {
  const search = url.searchParams.get("search")?.trim() || "";
  const statusParam = url.searchParams.get("status");
  const school = url.searchParams.get("school")?.trim() || "";
  const schoolsParam = url.searchParams.get("schools")?.trim() || "";
  const schoolsArray = schoolsParam
    ? schoolsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const referentCitizenId =
    url.searchParams.get("referentCitizenId")?.trim() || "";
  const consultUserId = url.searchParams.get("consult")?.trim() || "";
  const resultParam = url.searchParams.get("result");
  const resultNineqParam = url.searchParams.get("resultNineq");
  const resultPhqaParam = url.searchParams.get("resultPhqa");
  const q2Risk = url.searchParams.get("q2Risk");
  const addonRisk = url.searchParams.get("addonRisk");
  const q8Risk = url.searchParams.get("q8Risk");
  const mainScale = url.searchParams.get("mainScale")?.trim() || "";
  const referentType = url.searchParams.get("referentType")?.trim() || "";
  const excludeSchoolsParam =
    url.searchParams.get("excludeSchools")?.trim() || "";
  const excludeSchoolsArray = excludeSchoolsParam
    ? excludeSchoolsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const statusParts =
    statusParam && statusParam !== "all"
      ? statusParam
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
  const caseStatusValues = new Set([
    CaseStatus.PENDING,
    CaseStatus.IN_PROGRESS,
    CaseStatus.TRANSFER_PENDING,
    CaseStatus.CLOSED,
  ]);
  const caseStatusArray = statusParts.filter((s) =>
    caseStatusValues.has(s as CaseStatus)
  ) as CaseStatus[];
  const statusArray = statusParts
    .map((s) => parseInt(s, 10))
    .filter((n) => !Number.isNaN(n));
  const resultArray = resultParam
    ? resultParam
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean)
        .map((r) => mapLegacyRiskColorToScreeningResult(r))
    : [];
  const resultNineqArray = resultNineqParam
    ? resultNineqParam
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean)
        .map((r) => mapLegacyRiskColorToScreeningResult(r))
    : [];
  const resultPhqaArray = resultPhqaParam
    ? resultPhqaParam
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean)
        .map((r) => mapLegacyRiskColorToScreeningResult(r))
    : [];

  const whereConditions: Record<string, unknown>[] = [];

  const profileConditions: Record<string, unknown>[] = [];

  if (search) {
    profileConditions.push({
      OR: [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
      ],
    });
  }
  if (school) {
    profileConditions.push({ school: { name: school } });
  }
  if (schoolsArray.length > 0) {
    profileConditions.push({ school: { name: { in: schoolsArray } } });
  }
  if (profileConditions.length === 1) {
    whereConditions.push({ profile: profileConditions[0] });
  } else if (profileConditions.length > 1) {
    whereConditions.push({ profile: { AND: profileConditions } });
  }

  if (caseStatusArray.length > 0) {
    whereConditions.push({
      status:
        caseStatusArray.length === 1
          ? caseStatusArray[0]
          : { in: caseStatusArray },
    });
  } else if (statusArray.length > 0) {
    const statusWhere = buildLegacyFollowUpStatusWhere(statusArray);

    if (statusWhere) {
      whereConditions.push(statusWhere);
    }
  }

  if (excludeSchoolsArray.length > 0) {
    whereConditions.push({
      NOT: { profile: { school: { name: { in: excludeSchoolsArray } } } },
    });
  }

  if (referentCitizenId) {
    whereConditions.push({
      volunteer: { citizenId: referentCitizenId },
    });
  }

  if (consultUserId) {
    // Preferred: Case.assigneeAdminId; fallback: legacy TreatmentNote.consult string
    whereConditions.push({
      OR: [
        {
          assigneeAdmin: {
            userId: consultUserId,
          },
        },
        {
          treatmentNotes: { some: { consult: consultUserId } },
        },
      ],
    });
  }

  if (referentType === "outreach") {
    whereConditions.push({ volunteerId: { not: null } });
  } else if (referentType === "self") {
    whereConditions.push({ volunteerId: null });
  }

  const hasSplitMainResult =
    resultNineqArray.length > 0 || resultPhqaArray.length > 0;

  if (hasSplitMainResult) {
    const mainResultOr: Record<string, unknown>[] = [];

    if (resultNineqArray.length > 0) {
      mainResultOr.push({
        AND: [
          { questions9Q: { some: {} } },
          { result: { in: resultNineqArray } },
        ],
      });
    }

    if (resultPhqaArray.length > 0) {
      mainResultOr.push({
        AND: [
          { NOT: { questions9Q: { some: {} } } },
          { result: { in: resultPhqaArray } },
        ],
      });
    }

    if (mainResultOr.length === 1) {
      whereConditions.push(mainResultOr[0]);
    } else {
      whereConditions.push({ OR: mainResultOr });
    }
  } else if (resultArray.length > 0) {
    whereConditions.push({ result: { in: resultArray } });
  }

  if (q2Risk === "risk") {
    whereConditions.push({
      questions2Q: { some: { OR: [{ q1: 1 }, { q2: 1 }] } },
    });
  } else if (q2Risk === "no-risk") {
    whereConditions.push({
      NOT: { questions2Q: { some: { OR: [{ q1: 1 }, { q2: 1 }] } } },
    });
  }

  if (addonRisk === "risk") {
    whereConditions.push({
      questionsPhqaAddon: { some: { OR: [{ q1: 1 }, { q2: 1 }] } },
    });
  } else if (addonRisk === "no-risk") {
    whereConditions.push({
      NOT: { questionsPhqaAddon: { some: { OR: [{ q1: 1 }, { q2: 1 }] } } },
    });
  }

  /** 8Q: พบความเสี่ยงเมื่อ sum > 0 (สอดคล้องหน้า admin คอลัมน์ 8Q) */
  if (q8Risk === "risk") {
    whereConditions.push({
      questions8Q: { some: { sum: { gt: 0 } } },
    });
  } else if (q8Risk === "no-risk") {
    whereConditions.push({
      NOT: { questions8Q: { some: { sum: { gt: 0 } } } },
    });
  }

  /** แยกชุดคำถามหลัก: 9Q (มีแถว q9) กับ PHQ-A เด็กเล็ก (ไม่มี q9) */
  if (mainScale === "nineq") {
    whereConditions.push({ questions9Q: { some: {} } });
  } else if (mainScale === "phqa") {
    whereConditions.push({ NOT: { questions9Q: { some: {} } } });
  }

  if (whereConditions.length === 0) return undefined;
  if (whereConditions.length === 1) return whereConditions[0];

  return { AND: whereConditions };
}
