import { prisma } from "@/utils/prisma";
import { prefix } from "@/utils/data";

export async function GET() {
  try {
    const referents = await prisma.referent.findMany({
      where: {
        status: true,
      },
      include: {
        affiliation: true,
        questions_master: {
          include: {
            profile: true,
          },
        },
      },
    });

    // แปลงข้อมูลให้มี prefix และจำนวนแบบสอบถาม
    const formattedReferents = referents.map((referent) => {
      // นับจำนวนแบบสอบถามโดยจัดกลุ่มตาม userid
      const questionCountByUser = referent.questions_master.reduce(
        (acc, question) => {
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
