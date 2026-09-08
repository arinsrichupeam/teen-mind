import type { QuestionsData } from "@/types";

import {
  isAllFollowUpRoundsComplete,
  isConsultTelemedRoundComplete,
} from "../../../../../lib/question-followup-rounds";

import { CaseStatus } from "@prisma/client";

import { flattenTreatmentNotes } from "@/lib/case-flat";
import { requireAdmin } from "@/lib/get-session";
import { prisma } from "@/utils/prisma";

interface QuestionForStatus {
  profile?: { hn?: string | null } | null;
  schedule_telemed?: unknown;
  schedule_telemed2?: unknown;
  schedule_telemed3?: unknown;
  consult?: string | null;
  consult2?: string | null;
  consult3?: string | null;
  subjective?: string | null;
  subjective2?: string | null;
  subjective3?: string | null;
  objective?: string | null;
  objective2?: string | null;
  objective3?: string | null;
  assessment?: string | null;
  assessment2?: string | null;
  assessment3?: string | null;
  plan?: string | null;
  plan2?: string | null;
  plan3?: string | null;
  unreachable?: boolean | null;
  unreachable2?: boolean | null;
  unreachable3?: boolean | null;
}

function calculateStatus(question: QuestionForStatus): 0 | 1 | 2 | 3 {
  if (!question.profile?.hn) {
    return 0;
  }
  const value = question as unknown as QuestionsData;

  // status ความหมาย:
  // 1 = ยังไม่เริ่มติดตาม
  // 2 = เริ่มติดตามแล้ว (แต่ยังไม่ครบทุกครั้ง)
  // 3 = ครบ “ครั้งติดตามที่ 1–3”
  if (isAllFollowUpRoundsComplete(value)) {
    return 3;
  }

  if (isConsultTelemedRoundComplete(value, 0)) {
    return 2;
  }

  return 1;
}

function mapFollowUpStatusToCaseStatus(status: 0 | 1 | 2 | 3): CaseStatus {
  if (status === 3) return CaseStatus.CLOSED;
  if (status === 2) return CaseStatus.IN_PROGRESS;

  return CaseStatus.PENDING;
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
        profile: true,
        treatmentNotes: true,
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
    const totalQuestions = allQuestions.length;

    for (let i = 0; i < allQuestions.length; i++) {
      const question = allQuestions[i];

      try {
        const flat = flattenTreatmentNotes(question.treatmentNotes);
        const newStatus = calculateStatus({
          profile: question.profile,
          ...flat,
        } as QuestionForStatus);

        await prisma.case.update({
          where: {
            id: question.id,
          },
          data: {
            status: mapFollowUpStatusToCaseStatus(newStatus),
          },
        });

        successCount++;
      } catch (error) {
        errorCount++;
        errors.push(
          `Error updating status for question ${question.id}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    return Response.json({
      success: true,
      message: `อัปเดตสถานะสำเร็จ: ${successCount} รายการ, ผิดพลาด: ${errorCount} รายการ`,
      summary: {
        total: totalQuestions,
        success: successCount,
        error: errorCount,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "เกิดข้อผิดพลาดในการอัปเดตสถานะ",
      },
      { status: 500 }
    );
  }
}
