import { NextResponse } from "next/server";

import { getSession } from "@/lib/get-session";
import { checkNhsoRights, updateProfileNhsoRights } from "@/lib/nhso-service";

/**
 * POST /api/profile/nhso
 * - { citizenId } → lookup rights only (register / edit form)
 * - { profileId } → lookup + persist onto Profile
 */
export async function POST(request: Request) {
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      profileId?: string;
      citizenId?: string;
    };
    const profileId =
      typeof body.profileId === "string" ? body.profileId.trim() : "";
    const citizenId =
      typeof body.citizenId === "string" ? body.citizenId.trim() : "";

    if (!profileId && !citizenId) {
      return NextResponse.json(
        { error: "Missing required field: profileId or citizenId" },
        { status: 400 }
      );
    }

    if (profileId) {
      const { profile, nhsoResult } = await updateProfileNhsoRights(profileId);

      if (nhsoResult.status === "NOT_FOUND") {
        return NextResponse.json(
          {
            error: nhsoResult.errorMessage || "ไม่พบข้อมูลสิทธิจาก สปสช.",
            nhsoResult,
          },
          { status: 404 }
        );
      }

      if (nhsoResult.status === "ERROR") {
        return NextResponse.json(
          {
            error: nhsoResult.errorMessage || "Failed to verify NHSO rights",
            nhsoResult,
          },
          { status: 422 }
        );
      }

      return NextResponse.json({
        message: "NHSO health rights updated successfully",
        profile,
        nhsoResult,
      });
    }

    const nhsoResult = await checkNhsoRights(citizenId);

    if (nhsoResult.status === "NOT_FOUND") {
      return NextResponse.json(
        {
          error: nhsoResult.errorMessage || "ไม่พบข้อมูลสิทธิจาก สปสช.",
          nhsoResult,
        },
        { status: 404 }
      );
    }

    if (nhsoResult.status === "ERROR") {
      return NextResponse.json(
        {
          error: nhsoResult.errorMessage || "Failed to verify NHSO rights",
          nhsoResult,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      message: "NHSO health rights verified successfully",
      nhsoResult,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
