import { CaseStatus, Question8Q, ScreeningResult } from "@prisma/client";

import { buildCaseVisibilityWhere } from "@/lib/admin-data-scope";
import { getSession, requireAdmin } from "@/lib/get-session";
import { mapLegacyRiskColorToScreeningResult } from "@/lib/legacy-value-mapping";
import { mapLegacyFollowUpStatusToCaseStatus } from "@/lib/case-status-mapping";
import { prisma } from "@/utils/prisma";
import { QuestionsData } from "@/types";
import {
  calculateMainAssessmentResult,
  getAgeAtAssessment,
  getMainAssessmentScaleFromAge,
  getMainSumFromQuestion,
  type MainAssessmentScale,
} from "@/lib/assessment-scale";
import { getLatestInstrumentRound } from "@/lib/case-assessment-rounds";
import { toLegacyQuestionList } from "@/lib/case-to-legacy-question";
import { extractTreatmentNotesFromLegacyFlat } from "@/lib/case-flat-write";
import { sum8Q } from "@/lib/assessment-scoring";
import { buildCaseWhereFromSearchParams } from "@/lib/question-list-filters";
import { createOrContinueAssessment } from "@/lib/create-assessment-case";
import { buildTransferPendingQueueWhere } from "@/lib/case-workflow";

export async function GET(req: Request) {
  const auth = await requireAdmin();

  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const pageParam = url.searchParams.get("page");
  const limitParam = url.searchParams.get("limit");
  const transferInbox = url.searchParams.get("transferInbox") === "1";

  const page =
    Number.isNaN(Number(pageParam)) || !pageParam ? 1 : Number(pageParam);
  const limit =
    Number.isNaN(Number(limitParam)) || !limitParam
      ? 200
      : Math.min(Math.max(Number(limitParam), 10), 2000);

  const skip = (page - 1) * limit;
  let where = buildCaseWhereFromSearchParams(url);

  // Visibility by AdminDataScope (ADR 0007); SYSTEM/SUPERADMIN unrestricted
  const scopeWhere = buildCaseVisibilityWhere(auth.dataScope);

  if (transferInbox) {
    const homeFacilityId = auth.adminProfile.healthcareFacilityId;
    const requestedFacilityId =
      url.searchParams.get("healthcareFacilityId")?.trim() || "";
    const transferFacilityId = requestedFacilityId || homeFacilityId || null;
    const inboxWhere = buildTransferPendingQueueWhere(transferFacilityId);

    where = where ? { AND: [where, inboxWhere] } : inboxWhere;
  } else {
    // TRANSFER_PENDING lives under คำขอรับส่งต่อ tab only
    const excludeTransfer = {
      status: { not: CaseStatus.TRANSFER_PENDING },
    };

    where = where ? { AND: [where, excludeTransfer] } : excludeTransfer;
  }

  if (scopeWhere) {
    where = where ? { AND: [where, scopeWhere] } : scopeWhere;
  }

  const [questionsList, total] = await Promise.all([
    prisma.case.findMany({
      skip,
      take: limit,
      ...(where && { where }),
      select: {
        treatmentNotes: true,
        id: true,
        createdAt: true,
        result: true,
        status: true,
        volunteerId: true,
        closeCaseReason: true,
        assigneeAdminId: true,
        healthcareFacilityId: true,
        healthcareFacility: {
          select: {
            id: true,
            name: true,
          },
        },
        transferToFacilityId: true,
        transferNote: true,
        transferRequestedAt: true,
        transferToFacility: {
          select: {
            id: true,
            name: true,
          },
        },
        assigneeAdmin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userId: true,
          },
        },
        profile: {
          select: {
            id: true,
            userId: true,
            prefixId: true,
            firstName: true,
            lastName: true,
            birthDate: true,
            citizenId: true,
            phone: true,
            hn: true,
            mainInsclCode: true,
            mainInsclName: true,
            subInsclCode: true,
            subInsclName: true,
            hmainCode: true,
            hmainName: true,
            hsubCode: true,
            hsubName: true,
            nhsoVerifiedAt: true,
            gradeYear: true,
            sex: true,
            school: {
              select: {
                id: true,
                name: true,
                districtId: true,
                screeningDate: true,
                screenings: {
                  select: {
                    round: true,
                    startDate: true,
                    endDate: true,
                  },
                  orderBy: { round: "asc" },
                },
              },
            },
            addresses: {
              select: {
                houseNo: true,
                villageNo: true,
                soi: true,
                road: true,
                provinceId: true,
                districtId: true,
                subdistrictId: true,
              },
            },
            emergencyContacts: {
              select: {
                id: true,
                name: true,
                phone: true,
                relation: true,
              },
            },
            user: {
              select: {
                image: true,
                name: true,
              },
            },
          },
        },
        volunteer: {
          select: {
            id: true,
            citizenId: true,
            firstName: true,
            lastName: true,
          },
        },
        questionsPhqa: {
          select: {
            round: true,
            q1: true,
            q2: true,
            q3: true,
            q4: true,
            q5: true,
            q6: true,
            q7: true,
            q8: true,
            q9: true,
            sum: true,
          },
        },
        questions2Q: {
          select: {
            round: true,
            q1: true,
            q2: true,
          },
        },
        questionsPhqaAddon: {
          select: {
            round: true,
            q1: true,
            q2: true,
          },
        },
        questions8Q: {
          select: {
            round: true,
            q1: true,
            q2: true,
            q3: true,
            q4: true,
            q5: true,
            q6: true,
            q7: true,
            q8: true,
            q8Addon: true,
            sum: true,
          },
        },
        questions9Q: {
          select: {
            round: true,
            q1: true,
            q2: true,
            q3: true,
            q4: true,
            q5: true,
            q6: true,
            q7: true,
            q8: true,
            q9: true,
            sum: true,
          },
        },
        questionsProblem: {
          select: {
            round: true,
            familyRelation: true,
            familyStudyPressure: true,
            familyConflict: true,
            familyAbuse: true,
            familyLoss: true,
            socialFriendIssue: true,
            socialBullying: true,
            socialBreakup: true,
            socialTeacher: true,
            socialAssault: true,
            studyStress: true,
            studyNoMotivation: true,
            studyBurnout: true,
            studyTimeManage: true,
            studyHomeworkLoad: true,
            studyExamAnxiety: true,
            financeFamilyIssue: true,
            lifestyleSocialMediaOveruse: true,
            lifestyleGamingAddiction: true,
            lifestyleSubstanceUse: true,
            lifestyleEatingIssue: true,
            lifestyleBodyImageConcern: true,
            lifestyleInsomnia: true,
            sum: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.case.count(where ? { where } : undefined),
  ]);

  return Response.json({
    questionsList: toLegacyQuestionList(questionsList),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(req: Request) {
  const session = await getSession();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = await createOrContinueAssessment({ session, body });

  if (!result.ok) {
    return Response.json(
      { success: false, error: result.error },
      { status: result.status }
    );
  }

  return Response.json({
    success: true,
    data: result.data,
  });
}

export async function PUT(req: Request) {
  const auth = await requireAdmin();

  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const question: QuestionsData = data;

    const { sum: mainScreeningSum, scale } = getMainScreeningData(question);
    const hasMainScores =
      (Array.isArray(question.q9) && question.q9.length > 0) ||
      (Array.isArray(question.phqa) && question.phqa.length > 0);

    const caseUpdateData: {
      closeCaseReason?: string | null;
      result?: ScreeningResult;
      status?: CaseStatus;
    } = {
      closeCaseReason: question.close_case_reason,
    };

    if (hasMainScores) {
      const { result: riskColor } = calculateMainAssessmentResult(
        mainScreeningSum,
        scale
      );

      caseUpdateData.result = mapLegacyRiskColorToScreeningResult(riskColor);
    }

    if (question.status !== undefined && question.status !== null) {
      caseUpdateData.status = mapLegacyFollowUpStatusToCaseStatus(
        Number(question.status)
      );
    }

    // อัปเดต Case + upsert TreatmentNote จากฟิลด์ flat ของ UI
    const updatedQuestion = await prisma.case.update({
      where: {
        id: question.id,
      },
      data: caseUpdateData,
    });

    const treatmentNotes = extractTreatmentNotesFromLegacyFlat(
      question as unknown as Record<string, unknown>
    );

    if (treatmentNotes.length > 0) {
      await Promise.all(
        treatmentNotes.map((note) =>
          prisma.treatmentNote.upsert({
            where: {
              caseId_round: {
                caseId: question.id,
                round: note.round,
              },
            },
            create: {
              caseId: question.id,
              round: note.round,
              authorAdminId: auth.adminProfile.id,
              consult: note.consult,
              scheduleTelemed: note.scheduleTelemed,
              unreachable: Boolean(note.unreachable),
              subjective: note.subjective,
              objective: note.objective,
              assessment: note.assessment,
              plan: note.plan,
              note: note.note,
              followUp: note.followUp,
            },
            update: {
              consult: note.consult,
              scheduleTelemed: note.scheduleTelemed,
              unreachable: Boolean(note.unreachable),
              subjective: note.subjective,
              objective: note.objective,
              assessment: note.assessment,
              plan: note.plan,
              note: note.note,
              followUp: note.followUp,
              authorAdminId: auth.adminProfile.id,
            },
          })
        )
      );
    }

    // Admin edit targets the latest AssessmentRound only — never updateMany by caseId alone
    const tipRound = (await getLatestInstrumentRound(question.id)) ?? 1;
    const caseRound = { caseId: question.id, round: tipRound };

    const q2Promise =
      question.q2 && question.q2.length > 0
        ? prisma.question2Q.upsert({
            where: { caseId_round: caseRound },
            update: {
              q1: question.q2[0].q1,
              q2: question.q2[0].q2,
            },
            create: {
              ...caseRound,
              q1: question.q2[0].q1,
              q2: question.q2[0].q2,
            },
          })
        : Promise.resolve();

    const phqaPromise =
      question.phqa && question.phqa.length > 0
        ? prisma.questionPhqa.upsert({
            where: { caseId_round: caseRound },
            update: {
              q1: question.phqa[0].q1,
              q2: question.phqa[0].q2,
              q3: question.phqa[0].q3,
              q4: question.phqa[0].q4,
              q5: question.phqa[0].q5,
              q6: question.phqa[0].q6,
              q7: question.phqa[0].q7,
              q8: question.phqa[0].q8,
              q9: question.phqa[0].q9,
              sum: question.phqa[0].sum,
            },
            create: {
              ...caseRound,
              q1: question.phqa[0].q1,
              q2: question.phqa[0].q2,
              q3: question.phqa[0].q3,
              q4: question.phqa[0].q4,
              q5: question.phqa[0].q5,
              q6: question.phqa[0].q6,
              q7: question.phqa[0].q7,
              q8: question.phqa[0].q8,
              q9: question.phqa[0].q9,
              sum: question.phqa[0].sum,
            },
          })
        : Promise.resolve();

    const addonPromise =
      question.addon && question.addon.length > 0
        ? prisma.questionPhqaAddon.upsert({
            where: { caseId_round: caseRound },
            update: {
              q1: question.addon[0].q1,
              q2: question.addon[0].q2,
            },
            create: {
              ...caseRound,
              q1: question.addon[0].q1,
              q2: question.addon[0].q2,
            },
          })
        : Promise.resolve();

    const q8Promise =
      question.q8 && question.q8.length > 0
        ? (async () => {
            const row = question.q8[0];
            const q8AddonStored = row.q3 === 6 ? row.q8Addon : 0;
            const q8_sum = sum8Q({
              ...row,
              q8Addon: q8AddonStored,
            } as Question8Q);

            await prisma.question8Q.upsert({
              where: { caseId_round: caseRound },
              update: {
                q1: row.q1,
                q2: row.q2,
                q3: row.q3,
                q4: row.q4,
                q5: row.q5,
                q6: row.q6,
                q7: row.q7,
                q8: row.q8,
                q8Addon: q8AddonStored,
                sum: q8_sum,
              },
              create: {
                ...caseRound,
                q1: row.q1,
                q2: row.q2,
                q3: row.q3,
                q4: row.q4,
                q5: row.q5,
                q6: row.q6,
                q7: row.q7,
                q8: row.q8,
                q8Addon: q8AddonStored,
                sum: q8_sum,
              },
            });
          })()
        : Promise.resolve();

    const q9Promise =
      question.q9 && question.q9.length > 0
        ? prisma.question9Q.upsert({
            where: { caseId_round: caseRound },
            update: {
              q1: question.q9[0].q1,
              q2: question.q9[0].q2,
              q3: question.q9[0].q3,
              q4: question.q9[0].q4,
              q5: question.q9[0].q5,
              q6: question.q9[0].q6,
              q7: question.q9[0].q7,
              q8: question.q9[0].q8,
              q9: question.q9[0].q9,
              sum: question.q9[0].sum,
            },
            create: {
              ...caseRound,
              q1: question.q9[0].q1,
              q2: question.q9[0].q2,
              q3: question.q9[0].q3,
              q4: question.q9[0].q4,
              q5: question.q9[0].q5,
              q6: question.q9[0].q6,
              q7: question.q9[0].q7,
              q8: question.q9[0].q8,
              q9: question.q9[0].q9,
              sum: question.q9[0].sum,
            },
          })
        : Promise.resolve();

    await Promise.all([
      q2Promise,
      phqaPromise,
      addonPromise,
      q8Promise,
      q9Promise,
    ]);

    return Response.json({
      success: true,
      message: "อัปเดตข้อมูลสำเร็จ",
      updatedQuestion,
    });
  } catch (err) {
    return Response.json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "เกิดข้อผิดพลาดในการอัปเดตข้อมูล",
      },
      { status: 400 }
    );
  }
}

/** คะแนนชุดหลัก PHQ-A / 9Q — เลือกสเกลจากอายุ ณ วันทำแบบประเมิน */
function getMainScreeningData(question: QuestionsData): {
  sum: number;
  scale: MainAssessmentScale;
} {
  const q9Row = question.q9?.[0];
  const phqaRow = question.phqa?.[0];
  const sum = getMainSumFromQuestion(q9Row?.sum, phqaRow?.sum) ?? 0;

  const age = getAgeAtAssessment(
    (
      question.profile as unknown as {
        birthDate?: Date;
        birthday?: Date;
      } | null
    )?.birthDate ??
      (
        question.profile as unknown as {
          birthday?: Date;
        } | null
      )?.birthday,
    question.createdAt
  );

  const scale =
    age !== null
      ? getMainAssessmentScaleFromAge(age)
      : q9Row != null
        ? "9Q"
        : "PHQA";

  return { sum, scale };
}
