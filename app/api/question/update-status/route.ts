import { prisma } from "@/utils/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Received request body:", body);
    
    const { selectedIds, newStatus } = body;

    if (!selectedIds || !Array.isArray(selectedIds) || selectedIds.length === 0) {
      console.log("No selectedIds or invalid format:", selectedIds);
      return Response.json(
        {
          success: false,
          error: "ไม่พบรายการที่เลือก",
        },
        { status: 400 }
      );
    }

    if (newStatus === undefined || newStatus === null) {
      console.log("No newStatus provided:", newStatus);
      return Response.json(
        {
          success: false,
          error: "ไม่พบสถานะใหม่",
        },
        { status: 400 }
      );
    }

    console.log("Processing update for:", { selectedIds, newStatus });

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // อัปเดตสถานะสำหรับแต่ละรายการที่เลือก
    for (const id of selectedIds) {
      try {
        console.log(`Updating question ${id} to status ${newStatus}`);
        
        await prisma.questions_Master.update({
          where: {
            id: id,
          },
          data: {
            status: parseInt(newStatus),
          },
        });

        successCount++;
        console.log(`Successfully updated question ${id}`);
      } catch (error) {
        errorCount++;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`Error updating question ${id}:`, errorMessage);
        errors.push(
          `Error updating status for question ${id}: ${errorMessage}`
        );
      }
    }

    const response = {
      success: true,
      message: `อัปเดตสถานะสำเร็จ: ${successCount} รายการ, ผิดพลาด: ${errorCount} รายการ`,
      summary: {
        total: selectedIds.length,
        success: successCount,
        error: errorCount,
      },
      errors: errors.length > 0 ? errors : undefined,
    };
    
    console.log("Final response:", response);
    return Response.json(response);
  } catch (error) {
    console.error("API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการอัปเดตสถานะ";
    
    return Response.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
} 