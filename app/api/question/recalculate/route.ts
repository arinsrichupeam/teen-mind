import { QuestionPhqa } from "@prisma/client";

import {
  type AssessmentMismatchIssue,
  calculateMainAssessmentResult,
  detectAssessmentMismatch,
  getAgeAtAssessment,
  getMainAssessmentScaleFromAge,
  type MainAssessmentScale,
} from "@/lib/assessment-scale";
import { buildRecalculatePreview } from "@/lib/assessment-recalculate-preview";
import { requireAdmin } from "@/lib/get-session";
import { mapLegacyRiskColorToScreeningResult } from "@/lib/legacy-value-mapping";
import { prisma } from "@/utils/prisma";

export type RecalculateMismatch = {
  questionId: string;
  profileId: string;
  age: number | null;
  issue: AssessmentMismatchIssue;
  previousResult: string;
  newResult: string;
};

function calculateSum(phqa_data: QuestionPhqa) {
  return (
    phqa_data.q1 +
    phqa_data.q2 +
    phqa_data.q3 +
    phqa_data.q4 +
    phqa_data.q5 +
    phqa_data.q6 +
    phqa_data.q7 +
    phqa_data.q8 +
    phqa_data.q9
  );
}

function resolveScale(
  age: number | null,
  hasQ9Row: boolean
): MainAssessmentScale {
  if (age !== null) {
    return getMainAssessmentScaleFromAge(age);
  }

  return hasQ9Row ? "9Q" : "PHQA";
}

export async function POST() {
  const auth = await requireAdmin();

  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const allQuestions = await prisma.case.findMany({
      include: {
        questionsPhqa: true,
        questions9Q: true,
        questionsPhqaAddon: true,
        profile: {
          include: {
            school: { select: { screeningDate: true } },
          },
        },
      },
      where: {
        questionsPhqa: {
          some: {},
        },
      },
    });

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    const mismatches: RecalculateMismatch[] = [];
    const mismatchSummary = {
      wrongScale: 0,
      missingAddon: 0,
      missingAge: 0,
    };
    const totalQuestions = allQuestions.length;

    for (const question of allQuestions) {
      try {
        if (!question.questionsPhqa || question.questionsPhqa.length === 0) continue;

        const hasQ9Row = Array.isArray(question.questions9Q) && question.questions9Q.length > 0;
        const hasPhqaAddon =
          Array.isArray(question.questionsPhqaAddon) && question.questionsPhqaAddon.length > 0;
        const sourceData = hasQ9Row ? question.questions9Q[0] : question.questionsPhqa[0];
        const previousResult = question.result ?? "";

        const age = getAgeAtAssessment(
          question.profile?.birthDate,
          question.createdAt
        );

        const issue = detectAssessmentMismatch(age, hasQ9Row, hasPhqaAddon);

        if (issue === "wrong_scale_for_age") mismatchSummary.wrongScale += 1;
        if (issue === "missing_addon") mismatchSummary.missingAddon += 1;
        if (issue === "missing_age") mismatchSummary.missingAge += 1;

        const newSum = calculateSum(sourceData as QuestionPhqa);
        const scale = resolveScale(age, hasQ9Row);
        const { result: riskColor } = calculateMainAssessmentResult(
          newSum,
          scale
        );
        const result = mapLegacyRiskColorToScreeningResult(riskColor);

        if (issue !== "ok") {
          mismatches.push({
            questionId: question.id,
            profileId: question.profileId,
            age,
            issue,
            previousResult,
            newResult: riskColor,
          });
        }

        await prisma.$transaction([
          prisma.questionPhqa.updateMany({
            where: {
              caseId: question.id,
            },
            data: {
              sum: newSum,
            },
          }),
          ...(hasQ9Row
            ? [
                prisma.question9Q.updateMany({
                  where: {
                    caseId: question.id,
                  },
                  data: {
                    sum: newSum,
                  },
                }),
              ]
            : []),
          prisma.case.update({
            where: {
              id: question.id,
            },
            data: {
              result,
            },
          }),
        ]);

        successCount++;
      } catch (error) {
        errorCount++;
        errors.push(
          `Error processing question ${question.id}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    return Response.json({
      success: true,
      message: `คำนวณคะแนน PHQ-A / 9Q ตามอายุเสร็จสิ้น สำเร็จ: ${successCount}, ผิดพลาด: ${errorCount}`,
      summary: {
        total: totalQuestions,
        success: successCount,
        error: errorCount,
      },
      mismatches,
      mismatchSummary,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "เกิดข้อผิดพลาดในการคำนวณคะแนนใหม่",
      },
      { status: 500 }
    );
  }
}

// GET endpoint สำหรับดูสถิติก่อนตัดสินใจ recalculate (dry-run)
export async function GET() {
  const auth = await requireAdmin();

  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const allQuestions = await prisma.case.findMany({
      select: {
        id: true,
        profileId: true,
        result: true,
        status: true,
        createdAt: true,
        questionsPhqa: true,
        questions9Q: true,
        questionsPhqaAddon: { select: { id: true } },
        profile: {
          select: {
            birthDate: true,
            school: { select: { screeningDate: true } },
          },
        },
      },
      where: {
        questionsPhqa: {
          some: {},
        },
      },
    });

    const preview = buildRecalculatePreview(allQuestions);

    return Response.json({
      success: true,
      data: {
        ...preview,
        ageCutoff: 18,
      },
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "เกิดข้อผิดพลาดในการดึงข้อมูลสถิติ",
      },
      { status: 500 }
    );
  }
}
