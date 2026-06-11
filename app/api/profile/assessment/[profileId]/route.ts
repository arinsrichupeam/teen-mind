import { getSession, requireReferent } from "@/lib/get-session";
import { profileHasLineLinked } from "@/lib/profile-utils";
import { prisma } from "@/utils/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const session = await getSession();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { profileId } = await params;

  if (!profileId?.trim()) {
    return Response.json({ error: "Missing profileId" }, { status: 400 });
  }

  try {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: {
        id: true,
        userId: true,
        birthday: true,
        firstname: true,
        lastname: true,
      },
    });

    if (!profile) {
      return Response.json({ error: "ไม่พบข้อมูลผู้ใช้" }, { status: 404 });
    }

    const referentAuth = await requireReferent();
    const hasLine = await profileHasLineLinked(profile.userId);
    const isReferentActor = referentAuth != null && !hasLine;

    if (
      profile.userId &&
      profile.userId !== session.user.id &&
      !isReferentActor
    ) {
      return Response.json(
        { error: "Forbidden: ไม่สามารถเข้าถึงข้อมูลผู้ใช้นี้ได้" },
        { status: 403 }
      );
    }

    return Response.json(profile);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
