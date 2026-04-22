import { requireAdmin } from "@/lib/get-session";
import lineSdk from "@/utils/linesdk";
import { prisma } from "@/utils/prisma";

export async function POST(req: Request) {
  const auth = await requireAdmin();

  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const questionId =
      typeof body?.questionId === "string" ? body.questionId.trim() : "";

    if (!questionId) {
      return Response.json({ error: "ไม่พบ questionId" }, { status: 400 });
    }

    const question = await prisma.questions_Master.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        profile: {
          select: {
            userId: true,
            firstname: true,
            lastname: true,
          },
        },
      },
    });

    if (!question) {
      return Response.json({ error: "ไม่พบข้อมูลเคส" }, { status: 404 });
    }

    if (!question.profile?.userId) {
      return Response.json(
        { error: "ผู้ใช้ยังไม่ได้ผูกบัญชีสำหรับรับข้อความ LINE" },
        { status: 400 }
      );
    }

    const lineAccount = await prisma.account.findFirst({
      where: {
        userId: question.profile.userId,
        provider: "line",
      },
      select: {
        providerAccountId: true,
      },
    });

    if (!lineAccount?.providerAccountId) {
      return Response.json(
        { error: "ไม่พบบัญชี LINE ของผู้ใช้" },
        { status: 404 }
      );
    }

    const fullName =
      `${question.profile.firstname ?? ""} ${question.profile.lastname ?? ""}`.trim();

    await lineSdk.pushMessage(lineAccount.providerAccountId, {
      type: "flex",
      altText: "ข้อความรับคำปรึกษา",
      contents: {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          spacing: "md",
          contents: [
            {
              type: "text",
              text: "ขอรับคำปรึกษา",
              weight: "bold",
              size: "xl",
              wrap: true,
            },
            {
              type: "text",
              text:
                fullName.length > 0
                  ? `สวัสดีคุณ ${fullName} หากต้องการรับคำปรึกษากดปุ่มด้านล่าง`
                  : "ติดต่อจากนักจิตวิทยา หากต้องการรับคำปรึกษากดปุ่มด้านล่าง",
              size: "sm",
              color: "#666666",
              wrap: true,
            },
          ],
        },
        footer: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "button",
              style: "primary",
              color: "#06C755",
              action: {
                type: "message",
                label: "รับคำปรึกษา",
                text: "ขอรับคำปรึกษากับนักจิตวิทยา",
              },
            },
          ],
        },
      },
    });

    return Response.json({
      success: true,
      message: "ส่งข้อความรับคำปรึกษาไปยังผู้ใช้แล้ว",
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "เกิดข้อผิดพลาดในการส่งข้อความ",
      },
      { status: 500 }
    );
  }
}
