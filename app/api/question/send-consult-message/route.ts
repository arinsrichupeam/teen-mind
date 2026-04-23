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
    const messageType =
      body?.messageType === "hn-register" ? "hn-register" : "consult";

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

    const hnRegisterUrl = "https://register-hn.rpphosp.go.th/";
    const message =
      messageType === "hn-register"
        ? {
            type: "flex" as const,
            altText: "ลงทะเบียน HN โรงพยาบาล",
            contents: {
              type: "bubble" as const,
              body: {
                type: "box" as const,
                layout: "vertical" as const,
                spacing: "md" as const,
                contents: [
                  {
                    type: "text" as const,
                    text: "กรุณาลงทะเบียน HN โรงพยาบาลราชพิพัฒน์",
                    weight: "bold" as const,
                    size: "lg" as const,
                    wrap: true,
                  },
                  {
                    type: "text" as const,
                    text:
                      fullName.length > 0
                        ? `สวัสดีคุณ ${fullName} ยังไม่พบข้อมูล HN กรุณากดปุ่มด้านล่างเพื่อลงทะเบียน`
                        : "ยังไม่พบข้อมูล HN กรุณากดปุ่มด้านล่างเพื่อลงทะเบียน",
                    size: "sm" as const,
                    color: "#666666",
                    wrap: true,
                  },
                ],
              },
              footer: {
                type: "box" as const,
                layout: "vertical" as const,
                spacing: "sm" as const,
                contents: [
                  {
                    type: "button" as const,
                    style: "primary" as const,
                    color: "#06C755",
                    action: {
                      type: "uri" as const,
                      label: "ลงทะเบียน HN",
                      uri: hnRegisterUrl,
                    },
                  },
                ],
              },
            },
          }
        : {
            type: "flex" as const,
            altText: "ข้อความรับคำปรึกษา",
            contents: {
              type: "bubble" as const,
              body: {
                type: "box" as const,
                layout: "vertical" as const,
                spacing: "md" as const,
                contents: [
                  {
                    type: "text" as const,
                    text: "ขอรับคำปรึกษา",
                    weight: "bold" as const,
                    size: "xl" as const,
                    wrap: true,
                  },
                  {
                    type: "text" as const,
                    text:
                      fullName.length > 0
                        ? `สวัสดีคุณ ${fullName} หากต้องการรับคำปรึกษากดปุ่มด้านล่าง`
                        : "ติดต่อจากนักจิตวิทยา หากต้องการรับคำปรึกษากดปุ่มด้านล่าง",
                    size: "sm" as const,
                    color: "#666666",
                    wrap: true,
                  },
                ],
              },
              footer: {
                type: "box" as const,
                layout: "vertical" as const,
                spacing: "sm" as const,
                contents: [
                  {
                    type: "button" as const,
                    style: "primary" as const,
                    color: "#06C755",
                    action: {
                      type: "message" as const,
                      label: "รับคำปรึกษา",
                      text: "ขอรับคำปรึกษากับนักจิตวิทยา",
                    },
                  },
                ],
              },
            },
          };

    await lineSdk.pushMessage(lineAccount.providerAccountId, message);

    return Response.json({
      success: true,
      message:
        messageType === "hn-register"
          ? "ส่งข้อความลงทะเบียน HN ไปยังผู้ใช้แล้ว"
          : "ส่งข้อความรับคำปรึกษาไปยังผู้ใช้แล้ว",
    });
  } catch (error) {
    const extractErrorMessage = (err: unknown): string => {
      if (err instanceof Error) {
        const lineError = err as Error & {
          statusCode?: number;
          originalError?: {
            response?: {
              data?: unknown;
            };
          };
        };
        const responseData = lineError.originalError?.response?.data;

        if (
          typeof responseData === "string" &&
          responseData.trim().length > 0
        ) {
          return responseData;
        }

        if (
          responseData &&
          typeof responseData === "object" &&
          "message" in responseData &&
          typeof (responseData as { message?: unknown }).message === "string"
        ) {
          const lineResponse = responseData as {
            message: string;
            details?: Array<{ message?: string }>;
          };
          const detailMessages = Array.isArray(lineResponse.details)
            ? lineResponse.details
                .map((x) => (typeof x?.message === "string" ? x.message : ""))
                .filter((x) => x.length > 0)
            : [];

          if (detailMessages.length > 0) {
            return `${lineResponse.message}: ${detailMessages.join(", ")}`;
          }

          if (
            lineError.statusCode === 400 &&
            lineResponse.message
              .toLowerCase()
              .includes("failed to send message")
          ) {
            return "ไม่สามารถส่งข้อความ LINE ได้ (ผู้ใช้อาจบล็อก OA, ยังไม่เพิ่มเพื่อน หรือ LINE ID ไม่ถูกต้อง)";
          }

          return lineResponse.message;
        }

        return err.message;
      }

      return "เกิดข้อผิดพลาดในการส่งข้อความ";
    };

    const errorMessage = extractErrorMessage(error);

    return Response.json(
      {
        error: errorMessage,
      },
      { status: 400 }
    );
  }
}
