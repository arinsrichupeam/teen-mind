import type {
  AfterCarePlan,
  PsychRisk,
  SessionOutcome,
  SessionSelfHarmRisk,
} from "@prisma/client";

import { Prisma } from "@prisma/client";

import {
  assertCanWriteTreatmentNote,
  assertCaseMutable,
} from "@/lib/case-workflow";
import { requireCaseOperator } from "@/lib/get-session";
import {
  assertSessionReportForSoapSave,
  clearedSessionReportFields,
  isSoapFieldsComplete,
} from "@/lib/session-report";
import { prisma } from "@/utils/prisma";

type NoteBody = {
  kind?: "consult" | "soap";
  round?: number;
  consult?: string | null;
  scheduleTelemed?: string | null;
  serviceEndedAt?: string | null;
  unreachable?: boolean;
  subjective?: string | null;
  objective?: string | null;
  assessment?: string | null;
  plan?: string | null;
  note?: string | null;
  sessionSelfHarmRisk?: SessionSelfHarmRisk | null;
  psychRisk?: PsychRisk | null;
  presentingTopics?: string[] | null;
  presentingTopicsOther?: string | null;
  interventions?: string[] | null;
  interventionsOther?: string | null;
  sessionOutcome?: SessionOutcome | null;
  afterCarePlan?: AfterCarePlan | null;
  afterCarePlanOther?: string | null;
  followUp?: string | null;
};

async function nextTreatmentNoteRound(caseId: string): Promise<number> {
  const latest = await prisma.treatmentNote.findFirst({
    where: { caseId },
    orderBy: { round: "desc" },
    select: { round: true },
  });

  return (latest?.round ?? 0) + 1;
}

function toJsonStringArray(
  value: string[] | null | undefined
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (!value || value.length === 0) return Prisma.JsonNull;

  return value;
}

/** POST /api/case/[caseId]/notes — create or upsert TreatmentNote by round. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const auth = await requireCaseOperator();

  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { caseId } = await params;
  const body = (await req.json()) as NoteBody;
  const unreachable = Boolean(body.unreachable);

  const caseRow = await prisma.case.findUnique({
    where: { id: caseId },
    select: {
      id: true,
      status: true,
      healthcareFacilityId: true,
      profile: { select: { hn: true } },
    },
  });

  if (!caseRow) {
    return Response.json({ error: "ไม่พบเคส" }, { status: 404 });
  }

  if (
    !auth.capabilities.canViewCrossFacilityCases &&
    caseRow.healthcareFacilityId !== auth.adminProfile.healthcareFacilityId
  ) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    assertCaseMutable(caseRow.status);
    assertCanWriteTreatmentNote({
      hn: caseRow.profile.hn,
      unreachable,
    });

    const round =
      body.round != null && body.round > 0
        ? body.round
        : await nextTreatmentNoteRound(caseId);

    const kind = body.kind === "soap" ? "soap" : "consult";

    // ขั้น consult: บันทึกเวลาเริ่ม–สิ้นสุด + ผู้ให้คำปรึกษาเท่านั้น (ไม่บังคับ session report)
    if (kind === "consult") {
      const consultData = {
        consult: body.consult ?? null,
        scheduleTelemed: body.scheduleTelemed
          ? new Date(body.scheduleTelemed)
          : null,
        serviceEndedAt: unreachable
          ? null
          : body.serviceEndedAt
            ? new Date(body.serviceEndedAt)
            : null,
        unreachable,
        followUp: body.followUp ? new Date(body.followUp) : null,
        authorAdminId: auth.adminProfile.id,
        ...(unreachable ? clearedSessionReportFields() : {}),
      };

      const note = await prisma.treatmentNote.upsert({
        where: { caseId_round: { caseId, round } },
        create: { caseId, round, ...consultData },
        update: consultData,
      });

      return Response.json({ success: true, data: note });
    }

    const sessionFields = unreachable
      ? clearedSessionReportFields()
      : {
          serviceEndedAt: body.serviceEndedAt
            ? new Date(body.serviceEndedAt)
            : null,
          sessionSelfHarmRisk: body.sessionSelfHarmRisk ?? null,
          psychRisk: body.psychRisk ?? null,
          presentingTopics: toJsonStringArray(body.presentingTopics),
          presentingTopicsOther: body.presentingTopicsOther ?? null,
          interventions: toJsonStringArray(body.interventions),
          interventionsOther: body.interventionsOther ?? null,
          sessionOutcome: body.sessionOutcome ?? null,
          afterCarePlan: body.afterCarePlan ?? null,
          afterCarePlanOther: body.afterCarePlanOther ?? null,
        };

    const data = {
      consult: body.consult ?? null,
      scheduleTelemed: body.scheduleTelemed
        ? new Date(body.scheduleTelemed)
        : null,
      unreachable,
      subjective: body.subjective ?? null,
      objective: body.objective ?? null,
      assessment: body.assessment ?? null,
      plan: body.plan ?? null,
      note: body.note ?? null,
      followUp: body.followUp ? new Date(body.followUp) : null,
      authorAdminId: auth.adminProfile.id,
      ...sessionFields,
    };

    if (!unreachable) {
      if (
        !isSoapFieldsComplete({
          subjective: data.subjective,
          objective: data.objective,
          assessment: data.assessment,
          plan: data.plan,
        })
      ) {
        throw new Error(
          "กรุณากรอก Subjective / Objective / Assessment / Plan ให้ครบ"
        );
      }
      assertSessionReportForSoapSave({
        unreachable,
        serviceEndedAt: body.serviceEndedAt
          ? new Date(body.serviceEndedAt)
          : null,
        sessionSelfHarmRisk: body.sessionSelfHarmRisk ?? null,
        psychRisk: body.psychRisk ?? null,
        presentingTopics: body.presentingTopics ?? null,
        presentingTopicsOther: body.presentingTopicsOther ?? null,
        interventions: body.interventions ?? null,
        interventionsOther: body.interventionsOther ?? null,
        sessionOutcome: body.sessionOutcome ?? null,
        afterCarePlan: body.afterCarePlan ?? null,
        afterCarePlanOther: body.afterCarePlanOther ?? null,
        followUp: data.followUp,
        subjective: data.subjective,
        objective: data.objective,
        assessment: data.assessment,
        plan: data.plan,
      });
    }

    const note = await prisma.treatmentNote.upsert({
      where: { caseId_round: { caseId, round } },
      create: { caseId, round, ...data },
      update: data,
    });

    return Response.json({ success: true, data: note });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "บันทึก TreatmentNote ไม่สำเร็จ",
      },
      { status: 400 }
    );
  }
}
