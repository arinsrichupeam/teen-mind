import { getSession, requireAdmin } from "@/lib/get-session";
import {
  listAssessmentRoundHistory,
  openAssessmentRound,
} from "@/lib/case-assessment-rounds";
import {
  getAgeAtAssessment,
  getMainAssessmentScaleFromAge,
} from "@/lib/assessment-scale";
import { prisma } from "@/utils/prisma";

async function authorizeCaseAccess(caseId: string, userId: string) {
  const caseRow = await prisma.case.findUnique({
    where: { id: caseId },
    select: {
      id: true,
      result: true,
      status: true,
      profile: {
        select: {
          userId: true,
          birthDate: true,
        },
      },
    },
  });

  if (!caseRow) {
    return { error: Response.json({ error: "ไม่พบเคส" }, { status: 404 }) };
  }

  const isOwner = caseRow.profile.userId === userId;

  if (!isOwner) {
    const admin = await requireAdmin();

    if (!admin) {
      return {
        error: Response.json({ error: "Forbidden" }, { status: 403 }),
      };
    }
  }

  return { caseRow };
}

/** List AssessmentRound history for a Case (derived + Case.result tip). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const session = await getSession();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { caseId } = await params;
  const auth = await authorizeCaseAccess(caseId, session.user.id);

  if ("error" in auth && auth.error) return auth.error;

  const { caseRow } = auth;
  const age = getAgeAtAssessment(caseRow!.profile.birthDate, new Date());
  const scale = age == null ? "9Q" : getMainAssessmentScaleFromAge(age);

  const rounds = await listAssessmentRoundHistory(
    caseId,
    caseRow!.result,
    scale
  );

  return Response.json({
    data: {
      caseId,
      result: caseRow!.result,
      status: caseRow!.status,
      rounds,
    },
  });
}

/** Open AssessmentRound N+1 (citizen owner or staff). */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const session = await getSession();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { caseId } = await params;
  const auth = await authorizeCaseAccess(caseId, session.user.id);

  if ("error" in auth && auth.error) return auth.error;

  try {
    const opened = await openAssessmentRound(caseId);

    return Response.json({ success: true, data: opened });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "เปิดรอบประเมินไม่สำเร็จ",
      },
      { status: 400 }
    );
  }
}
