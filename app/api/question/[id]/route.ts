import { toLegacyQuestionRow } from "@/lib/case-to-legacy-question";
import { prisma } from "@/utils/prisma";
import { getSession, requireAdmin } from "@/lib/get-session";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const questionId = (await params).id;

  const question = await prisma.case.findUnique({
    where: { id: questionId },
    select: {
      treatmentNotes: true,
      id: true,
      result: true,
      latitude: true,
      longitude: true,
      createdAt: true,
      closeCaseReason: true,
      status: true,
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
      transfers: {
        orderBy: { requestedAt: "desc" },
        take: 10,
        select: {
          id: true,
          status: true,
          requestNote: true,
          responseNote: true,
          requestedAt: true,
          respondedAt: true,
          fromFacility: { select: { id: true, name: true } },
          toFacility: { select: { id: true, name: true } },
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
          firstName: true,
          lastName: true,
          prefixId: true,
          sex: true,
          birthDate: true,
          ethnicity: true,
          nationality: true,
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
          schoolId: true,
          gradeYear: true,
          school: {
            select: {
              id: true,
              name: true,
            },
          },
          healthcareFacilityId: true,
          addresses: {
            select: {
              houseNo: true,
              villageNo: true,
              soi: true,
              road: true,
              subdistrictId: true,
              districtId: true,
              provinceId: true,
            },
          },
          emergencyContacts: {
            select: {
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
      questionsPhqa: true,
      questions2Q: true,
      questionsPhqaAddon: true,
      questions8Q: true,
      questions9Q: true,
      questionsProblem: true,
    },
  });

  if (!question) {
    return Response.json(null, { status: 404 });
  }

  const profileUserId = question.profile?.userId ?? null;
  const isOwner = profileUserId === session.user.id;
  const isAdmin = (await requireAdmin()) !== null;

  if (!isOwner && !isAdmin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json(toLegacyQuestionRow(question));
}
