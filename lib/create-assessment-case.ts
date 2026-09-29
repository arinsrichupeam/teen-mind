import type { Session } from "next-auth";

import {
  CaseStatus,
  Prisma,
  Question8Q,
  Question9Q,
  QuestionPhqa,
  QuestionPhqaAddon,
  ScreeningResult,
} from "@prisma/client";

import { requireAdmin, requireReferent } from "@/lib/get-session";
import { mapLegacyRiskColorToScreeningResult } from "@/lib/legacy-value-mapping";
import { profileHasLineLinked } from "@/lib/profile-utils";
import { prisma } from "@/utils/prisma";
import { LocationData } from "@/types";
import lineSdk from "@/utils/linesdk";
import {
  GreenFlex,
  RedFlex,
  YellowFlex,
  GreenLowFlex,
  OrangeFlex,
  getEmergencyAlertFlex,
} from "@/config/line-flex";
import {
  calculateMainAssessmentResult,
  getAgeAtAssessment,
  getMainAssessmentScaleFromAge,
} from "@/lib/assessment-scale";
import {
  assertCitizenCaseCreate,
  OPEN_CASE_STATUSES,
} from "@/lib/case-create-rules";
import {
  getNextAssessmentRound,
  openAssessmentRound,
} from "@/lib/case-assessment-rounds";
import { isAssessmentRoundComplete } from "@/lib/assessment-rounds";
import {
  isTwoQPositive,
  shouldEnter8Q,
  WAVE1_CITIZEN_PACKAGE,
} from "@/lib/depression-flow";
import { sum8Q, sum9Q, sumPhqa } from "@/lib/assessment-scoring";
import {
  sumProblem,
  validateAssessmentPayload,
} from "@/lib/assessment-payload";

export type CreateAssessmentResult =
  | {
      ok: true;
      data: {
        id: string;
        result: string;
        result_text: string;
      };
    }
  | { ok: false; status: number; error: string };

/**
 * Create a new Case or continue an open Case with the next assessment round.
 * Owns scoring, persistence, and LINE notify side-effects.
 */
export async function createOrContinueAssessment(args: {
  session: Session;
  body: Record<string, unknown>;
}): Promise<CreateAssessmentResult> {
  const { session, body: data } = args;
  const profileId = data.profileId as string | undefined;

  if (!profileId) {
    return { ok: false, status: 400, error: "ข้อมูลไม่ครบถ้วน: profileId" };
  }

  try {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: {
        userId: true,
        hn: true,
        firstName: true,
        lastName: true,
        phone: true,
        birthDate: true,
        healthcareFacilityId: true,
        school: { select: { screeningDate: true } },
      },
    });

    if (!profile) {
      throw new Error("ไม่พบข้อมูลผู้ใช้");
    }

    const openCase = await prisma.case.findFirst({
      where: {
        profileId,
        status: { in: [...OPEN_CASE_STATUSES] },
      },
      select: { id: true, result: true, status: true },
    });

    let targetCaseId: string | null = null;
    let instrumentRound = 1;
    let continueOnExistingCase = false;

    if (openCase) {
      if (isAssessmentRoundComplete(openCase.result)) {
        const opened = await openAssessmentRound(openCase.id);

        targetCaseId = opened.caseId;
        instrumentRound = opened.round;
        continueOnExistingCase = true;
      } else {
        targetCaseId = openCase.id;
        instrumentRound = await getNextAssessmentRound(openCase.id);
        continueOnExistingCase = true;
      }
    } else {
      assertCitizenCaseCreate({
        healthcareFacilityId: profile.healthcareFacilityId,
        packageName: WAVE1_CITIZEN_PACKAGE,
        hasOpenCase: false,
      });
    }

    const age = getAgeAtAssessment(profile.birthDate, new Date());

    if (age === null) {
      throw new Error("ไม่พบวันเกิดสำหรับกำหนดชุดแบบประเมิน");
    }

    const expectedScale = getMainAssessmentScaleFromAge(age);
    const q2 = data.Q2 as { q1: number; q2: number } | undefined;
    const twoQPositive = isTwoQPositive(q2?.q1 ?? 0, q2?.q2 ?? 0);

    validateAssessmentPayload(
      data as Parameters<typeof validateAssessmentPayload>[0],
      expectedScale,
      twoQPositive
    );

    let referenceId: number | null =
      data.reference != null ? Number(data.reference) : null;

    if (referenceId != null && !Number.isNaN(referenceId)) {
      const activeVolunteer = await prisma.volunteer.findFirst({
        where: { id: referenceId, status: true },
        select: { id: true },
      });

      referenceId = activeVolunteer?.id ?? null;
    } else {
      referenceId = null;
    }

    const Q2_data = data.Q2 as QuestionPhqaAddon;
    const location_data = (data.location as LocationData | null) ?? null;
    const phqa_data = data.phqa as QuestionPhqa | undefined;
    const phqaAddon_data = data.phqaAddon as QuestionPhqaAddon | undefined;
    const q9_data = data.q9 as Question9Q | undefined;
    const q8_data = data.q8 as Question8Q | undefined;
    const problem_data = data.problem as
      | (Record<string, number> & { sum?: number })
      | undefined;

    let scoreSum = 0;
    let riskColor = "Green";
    let result_text = "";
    let needs8Q = false;

    if (twoQPositive) {
      scoreSum =
        expectedScale === "9Q"
          ? sum9Q(q9_data as Question9Q)
          : sumPhqa(phqa_data as QuestionPhqa);
      needs8Q = shouldEnter8Q(expectedScale, scoreSum);
      ({ result: riskColor, result_text } = calculateMainAssessmentResult(
        scoreSum,
        expectedScale
      ));
    }

    const result = mapLegacyRiskColorToScreeningResult(riskColor);
    const q8_sum = needs8Q && q8_data ? sum8Q(q8_data) : 0;

    const referentAuth = await requireReferent();
    const hasLine = await profileHasLineLinked(profile.userId);
    const isReferentActor = referentAuth != null && !hasLine;
    const isOwner = !profile.userId || profile.userId === session.user?.id;
    let isAdminActor = false;

    if (!isOwner && !isReferentActor) {
      const auth = await requireAdmin();

      if (!auth) {
        return {
          ok: false,
          status: 403,
          error: "Forbidden: ไม่สามารถสร้างแบบประเมินแทนผู้ใช้อื่นได้",
        };
      }

      isAdminActor = true;
    }

    let lineUserId: string | undefined;

    if (profile.userId) {
      const UUID = await prisma.user.findUnique({
        where: { id: profile.userId as string },
        select: {
          accounts: {
            select: {
              provider: true,
              providerAccountId: true,
            },
            where: {
              provider: "line",
            },
          },
        },
      });

      lineUserId = UUID?.accounts?.[0]?.providerAccountId;
    }

    const round = instrumentRound;

    const q2Create = {
      round,
      q1: Q2_data.q1,
      q2: Q2_data.q2,
    };

    const q8Create =
      needs8Q && q8_data
        ? {
            round,
            q1: q8_data.q1,
            q2: q8_data.q2,
            q3: q8_data.q3,
            q4: q8_data.q4,
            q5: q8_data.q5,
            q6: q8_data.q6,
            q7: q8_data.q7,
            q8: q8_data.q8,
            q8Addon: q8_data.q8Addon,
            sum: q8_sum,
          }
        : null;

    const problemCreate = problem_data
      ? {
          round,
          familyRelation: Number(problem_data.familyRelation ?? 0),
          familyStudyPressure: Number(problem_data.familyStudyPressure ?? 0),
          familyConflict: Number(problem_data.familyConflict ?? 0),
          familyAbuse: Number(problem_data.familyAbuse ?? 0),
          familyLoss: Number(problem_data.familyLoss ?? 0),
          socialFriendIssue: Number(problem_data.socialFriendIssue ?? 0),
          socialBullying: Number(problem_data.socialBullying ?? 0),
          socialBreakup: Number(problem_data.socialBreakup ?? 0),
          socialTeacher: Number(problem_data.socialTeacher ?? 0),
          socialAssault: Number(problem_data.socialAssault ?? 0),
          studyStress: Number(problem_data.studyStress ?? 0),
          studyNoMotivation: Number(problem_data.studyNoMotivation ?? 0),
          studyBurnout: Number(problem_data.studyBurnout ?? 0),
          studyTimeManage: Number(problem_data.studyTimeManage ?? 0),
          studyHomeworkLoad: Number(problem_data.studyHomeworkLoad ?? 0),
          studyExamAnxiety: Number(problem_data.studyExamAnxiety ?? 0),
          financeFamilyIssue: Number(problem_data.financeFamilyIssue ?? 0),
          lifestyleSocialMediaOveruse: Number(
            problem_data.lifestyleSocialMediaOveruse ?? 0
          ),
          lifestyleGamingAddiction: Number(
            problem_data.lifestyleGamingAddiction ?? 0
          ),
          lifestyleSubstanceUse: Number(
            problem_data.lifestyleSubstanceUse ?? 0
          ),
          lifestyleEatingIssue: Number(problem_data.lifestyleEatingIssue ?? 0),
          lifestyleBodyImageConcern: Number(
            problem_data.lifestyleBodyImageConcern ?? 0
          ),
          lifestyleInsomnia: Number(problem_data.lifestyleInsomnia ?? 0),
          sum: sumProblem(problem_data),
        }
      : null;

    let nineqCreates: {
      q9: {
        round: number;
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
      };
      phqa: {
        round: number;
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
      };
      addon: { round: number; q1: number; q2: number };
    } | null = null;
    let phqaCreates: {
      phqa: {
        round: number;
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
      };
      addon: { round: number; q1: number; q2: number };
    } | null = null;

    if (twoQPositive && expectedScale === "9Q") {
      if (!q9_data) {
        throw new Error("ข้อมูลไม่ครบถ้วนสำหรับ 9Q");
      }

      nineqCreates = {
        q9: {
          round,
          q1: q9_data.q1,
          q2: q9_data.q2,
          q3: q9_data.q3,
          q4: q9_data.q4,
          q5: q9_data.q5,
          q6: q9_data.q6,
          q7: q9_data.q7,
          q8: q9_data.q8,
          q9: q9_data.q9,
          sum: scoreSum,
        },
        phqa: {
          round,
          q1: q9_data.q1,
          q2: q9_data.q2,
          q3: q9_data.q3,
          q4: q9_data.q4,
          q5: q9_data.q5,
          q6: q9_data.q6,
          q7: q9_data.q7,
          q8: q9_data.q8,
          q9: q9_data.q9,
          sum: scoreSum,
        },
        addon: { round, q1: 0, q2: 0 },
      };
    } else if (twoQPositive) {
      phqaCreates = {
        phqa: {
          round,
          q1: (phqa_data as QuestionPhqa).q1,
          q2: (phqa_data as QuestionPhqa).q2,
          q3: (phqa_data as QuestionPhqa).q3,
          q4: (phqa_data as QuestionPhqa).q4,
          q5: (phqa_data as QuestionPhqa).q5,
          q6: (phqa_data as QuestionPhqa).q6,
          q7: (phqa_data as QuestionPhqa).q7,
          q8: (phqa_data as QuestionPhqa).q8,
          q9: (phqa_data as QuestionPhqa).q9,
          sum: scoreSum,
        },
        addon: {
          round,
          q1: (phqaAddon_data as QuestionPhqaAddon).q1,
          q2: (phqaAddon_data as QuestionPhqaAddon).q2,
        },
      };
    }

    let savedQuestion: { id: string };

    if (continueOnExistingCase && targetCaseId) {
      await prisma.$transaction(async (tx) => {
        await tx.case.update({
          where: { id: targetCaseId! },
          data: {
            result,
            latitude: location_data?.latitude,
            longitude: location_data?.longitude,
            ...(referenceId != null ? { volunteerId: referenceId } : {}),
          },
        });

        await tx.question2Q.create({
          data: { caseId: targetCaseId!, ...q2Create },
        });

        if (q8Create) {
          await tx.question8Q.create({
            data: { caseId: targetCaseId!, ...q8Create },
          });
        }

        if (problemCreate) {
          await tx.questionProblem.create({
            data: { caseId: targetCaseId!, ...problemCreate },
          });
        }

        if (nineqCreates) {
          await tx.question9Q.create({
            data: { caseId: targetCaseId!, ...nineqCreates.q9 },
          });
          await tx.questionPhqa.create({
            data: { caseId: targetCaseId!, ...nineqCreates.phqa },
          });
          await tx.questionPhqaAddon.create({
            data: { caseId: targetCaseId!, ...nineqCreates.addon },
          });
        } else if (phqaCreates) {
          await tx.questionPhqa.create({
            data: { caseId: targetCaseId!, ...phqaCreates.phqa },
          });
          await tx.questionPhqaAddon.create({
            data: { caseId: targetCaseId!, ...phqaCreates.addon },
          });
        }
      });

      savedQuestion = { id: targetCaseId };
    } else {
      const createPayload: Prisma.CaseUncheckedCreateInput = {
        latitude: location_data?.latitude,
        longitude: location_data?.longitude,
        volunteerId: referenceId ?? undefined,
        package: WAVE1_CITIZEN_PACKAGE,
        healthcareFacilityId: profile.healthcareFacilityId!,
        result,
        status: CaseStatus.PENDING,
        profileId: profileId,
        questions2Q: { create: q2Create },
      };

      if (q8Create) {
        createPayload.questions8Q = { create: q8Create };
      }

      if (problemCreate) {
        createPayload.questionsProblem = { create: problemCreate };
      }

      if (nineqCreates) {
        createPayload.questions9Q = { create: nineqCreates.q9 };
        createPayload.questionsPhqa = { create: nineqCreates.phqa };
        createPayload.questionsPhqaAddon = { create: nineqCreates.addon };
      } else if (phqaCreates) {
        createPayload.questionsPhqa = { create: phqaCreates.phqa };
        createPayload.questionsPhqaAddon = { create: phqaCreates.addon };
      }

      savedQuestion = await prisma.case.create({
        data: createPayload,
      });
    }

    if (lineUserId && !isAdminActor) {
      const resultFlex =
        riskColor === "Green"
          ? GreenFlex
          : riskColor === "Green-Low"
            ? GreenLowFlex
            : riskColor === "Yellow"
              ? YellowFlex
              : riskColor === "Orange"
                ? OrangeFlex
                : riskColor === "Red"
                  ? RedFlex
                  : null;

      if (resultFlex) {
        await Promise.allSettled([lineSdk.pushMessage(lineUserId, resultFlex)]);
      }
    }

    if (result === ScreeningResult.POSITIVE_SEVERE) {
      const adminsWithAlert = await prisma.profileAdmin.findMany({
        where: { receiveAlert: true },
        select: {
          userId: true,
        },
      });

      if (adminsWithAlert.length > 0) {
        const adminUserIds = adminsWithAlert.map((a) => a.userId);
        const adminLineAccounts = await prisma.account.findMany({
          where: {
            userId: { in: adminUserIds },
            provider: "line",
          },
          select: { providerAccountId: true },
        });

        const profileDisplayName =
          `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim() ||
          "ไม่ระบุชื่อ";
        const profileTel = profile.phone ?? "ไม่ระบุเบอร์";
        const baseUrl = (process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "");
        const alertCaseUrl = baseUrl
          ? `${baseUrl}/admin/alert/${savedQuestion.id}`
          : undefined;
        const adminAlertMessage = getEmergencyAlertFlex(
          profileDisplayName,
          profileTel,
          alertCaseUrl
        );

        await Promise.allSettled(
          adminLineAccounts.map((account) =>
            lineSdk.pushMessage(account.providerAccountId, adminAlertMessage)
          )
        );
      }
    }

    return {
      ok: true,
      data: {
        id: savedQuestion.id,
        result: riskColor,
        result_text,
      },
    };
  } catch (error) {
    return {
      ok: false,
      status: 400,
      error:
        error instanceof Error
          ? error.message
          : "เกิดข้อผิดพลาดในการบันทึกข้อมูล" + error,
    };
  }
}
