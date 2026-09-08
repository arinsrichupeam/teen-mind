import { prisma } from "@/utils/prisma";
import { prefix } from "@/utils/data";

export async function GET() {
  try {
    const referents = await prisma.volunteer.findMany({
      where: {
        status: true,
      },
      include: {
        affiliation: true,
        cases: {
          include: {
            profile: true,
          },
        },
      },
    });

    // แปลงข้อมูลให้มี prefix และจำนวนแบบประเมิน
    const formattedReferents = referents.map((referent) => {
      // นับจำนวนแบบประเมินโดยจัดกลุ่มตาม userid
      const questionCountByUser = referent.cases.reduce(
        (acc: Record<string, number>, question) => {
          const profileId = question.profile?.id || "unknown";

          acc[profileId] = (acc[profileId] || 0) + 1;

          return acc;
        },
        {} as Record<string, number>
      );

      return {
        ...referent,
        prefix:
          prefix.find((p) => p.key === referent.prefixId?.toString())?.label ||
          "",
        question_count: Object.keys(questionCountByUser).length,
      };
    });

    return Response.json(formattedReferents);
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch referents : " + error },
      { status: 500 }
    );
  }
}
