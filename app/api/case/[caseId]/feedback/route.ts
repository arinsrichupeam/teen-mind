import { NextResponse } from "next/server";

import { prisma } from "@/utils/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await params;
    const body = await request.json();
    const { overallRating, serviceRating, systemRating, comment } = body;

    if (!caseId) {
      return NextResponse.json(
        { error: "Missing required parameter: caseId" },
        { status: 400 }
      );
    }

    if (!overallRating || overallRating < 1 || overallRating > 5) {
      return NextResponse.json(
        { error: "overallRating must be an integer between 1 and 5" },
        { status: 400 }
      );
    }

    if (
      serviceRating !== undefined &&
      (serviceRating < 1 || serviceRating > 5)
    ) {
      return NextResponse.json(
        { error: "serviceRating must be an integer between 1 and 5" },
        { status: 400 }
      );
    }

    if (
      systemRating !== undefined &&
      (systemRating < 1 || systemRating > 5)
    ) {
      return NextResponse.json(
        { error: "systemRating must be an integer between 1 and 5" },
        { status: 400 }
      );
    }

    const existingCase = await prisma.case.findUnique({
      where: { id: caseId },
      include: { feedback: true },
    });

    if (!existingCase) {
      return NextResponse.json(
        { error: `Case not found with ID: ${caseId}` },
        { status: 444 }
      );
    }

    if (existingCase.feedback) {
      return NextResponse.json(
        { error: "Feedback has already been submitted for this case." },
        { status: 409 }
      );
    }

    const feedback = await prisma.caseFeedback.create({
      data: {
        caseId,
        overallRating: Number(overallRating),
        serviceRating: serviceRating ? Number(serviceRating) : null,
        systemRating: systemRating ? Number(systemRating) : null,
        comment: comment ? String(comment).trim() : null,
        submittedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        message: "Feedback submitted successfully",
        feedback,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[API Case Feedback Error]:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await params;
    const feedback = await prisma.caseFeedback.findUnique({
      where: { caseId },
    });

    if (!feedback) {
      return NextResponse.json(
        { message: "No feedback found for this case" },
        { status: 404 }
      );
    }

    return NextResponse.json({ feedback });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
