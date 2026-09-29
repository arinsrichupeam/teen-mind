import { prisma } from "@/utils/prisma";

export interface NhsoCheckResult {
  mainInsclCode?: string;
  mainInsclName?: string;
  subInsclCode?: string;
  subInsclName?: string;
  hmainCode?: string;
  hmainName?: string;
  hsubCode?: string;
  hsubName?: string;
  verifiedAt: Date;
  status: "SUCCESS" | "NOT_FOUND" | "ERROR";
  errorMessage?: string;
}

/** Response shape from GET /api/RealPerson (fields we persist + nested hospital objects). */
export type NhsoRealPersonResponse = {
  dataError?: string;
  message?: string;
  mainInscl?: string;
  mainInsclCode?: string;
  mainInsclName?: string;
  subInscl?: string;
  subInsclCode?: string;
  subInsclName?: string;
  hospMainNew?: NhsoHospitalRef | null;
  hospSubNew?: NhsoHospitalRef | null;
  hospMain?: NhsoHospitalRef | null;
  hospSub?: NhsoHospitalRef | null;
  hmain?: string;
  hmain_name?: string;
  hsub?: string;
  hsub_name?: string;
};

type NhsoHospitalRef = {
  hcode?: string;
  hname?: string;
  code?: string;
  name?: string;
};

function asTrimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

function hospitalCode(
  ref: NhsoHospitalRef | null | undefined
): string | undefined {
  return asTrimmedString(ref?.hcode) ?? asTrimmedString(ref?.code);
}

function hospitalName(
  ref: NhsoHospitalRef | null | undefined
): string | undefined {
  return asTrimmedString(ref?.hname) ?? asTrimmedString(ref?.name);
}

/**
 * Map NHSO RealPerson JSON into Profile insurance fields.
 * Pure — used by checkNhsoRights and unit tests.
 */
export function mapNhsoRealPersonToRights(
  data: NhsoRealPersonResponse
): Omit<NhsoCheckResult, "verifiedAt" | "status" | "errorMessage"> {
  const hospMain = data.hospMainNew ?? data.hospMain;
  const hospSub = data.hospSubNew ?? data.hospSub;

  return {
    mainInsclCode:
      asTrimmedString(data.mainInsclCode) ?? asTrimmedString(data.mainInscl),
    mainInsclName: asTrimmedString(data.mainInsclName),
    subInsclCode:
      asTrimmedString(data.subInsclCode) ?? asTrimmedString(data.subInscl),
    subInsclName: asTrimmedString(data.subInsclName),
    hmainCode: hospitalCode(hospMain) ?? asTrimmedString(data.hmain),
    hmainName: hospitalName(hospMain) ?? asTrimmedString(data.hmain_name),
    hsubCode: hospitalCode(hospSub) ?? asTrimmedString(data.hsub),
    hsubName: hospitalName(hospSub) ?? asTrimmedString(data.hsub_name),
  };
}

function buildRealPersonUrl(baseUrl: string, sourceId: string, pid: string) {
  const url = new URL(baseUrl.trim());

  url.searchParams.set("SOURCE_ID", sourceId);
  url.searchParams.set("PID", pid);

  return url.toString();
}

/**
 * Check health insurance rights with NHSO RealPerson API.
 * PID ใน API สปสช. = citizenId (เลขบัตรประชาชน 13 หลัก) ในระบบนี้
 * Auth: Bearer NHSO_TOKEN. Query: SOURCE_ID + PID.
 */
export async function checkNhsoRights(
  citizenId: string
): Promise<NhsoCheckResult> {
  // NHSO PID = citizenId
  const cleanPid = citizenId.replace(/\D/g, "");
  const verifiedAt = new Date();

  if (cleanPid.length !== 13) {
    return {
      verifiedAt,
      status: "ERROR",
      errorMessage: "Invalid Citizen ID length. Must be 13 digits.",
    };
  }

  const baseUrl = process.env.NHSO_BASE_URL?.trim();
  const token = process.env.NHSO_TOKEN?.trim();
  const sourceId = process.env.NHSO_SOURCE_ID?.trim();

  if (!baseUrl || !token || !sourceId) {
    return {
      verifiedAt,
      status: "ERROR",
      errorMessage: "NHSO environment variables are not configured",
    };
  }

  try {
    const response = await fetch(
      buildRealPersonUrl(baseUrl, sourceId, cleanPid),
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const data = (await response.json()) as NhsoRealPersonResponse;

    // NHSO returns 202 + dataError when PID is invalid / not found
    if (data.dataError) {
      return {
        verifiedAt,
        status: "NOT_FOUND",
        errorMessage: data.dataError,
      };
    }

    if (!response.ok) {
      return {
        verifiedAt,
        status: "ERROR",
        errorMessage:
          asTrimmedString(data.message) ??
          `NHSO API responded with status: ${response.status}`,
      };
    }

    const rights = mapNhsoRealPersonToRights(data);

    if (!rights.mainInsclCode && !rights.mainInsclName) {
      return {
        verifiedAt,
        status: "NOT_FOUND",
        errorMessage: "ไม่พบข้อมูลสิทธิจาก สปสช.",
      };
    }

    return {
      ...rights,
      verifiedAt,
      status: "SUCCESS",
    };
  } catch (err: unknown) {
    return {
      verifiedAt,
      status: "ERROR",
      errorMessage:
        err instanceof Error ? err.message : "Failed to connect to NHSO API",
    };
  }
}

/**
 * Check and update profile health rights from NHSO API
 * @param profileId Profile CUID
 */
export async function updateProfileNhsoRights(profileId: string) {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { id: true, citizenId: true },
  });

  if (!profile || !profile.citizenId) {
    throw new Error("Profile not found or citizenId missing");
  }

  const result = await checkNhsoRights(profile.citizenId);

  if (result.status === "SUCCESS") {
    const updatedProfile = await prisma.profile.update({
      where: { id: profileId },
      data: {
        mainInsclCode: result.mainInsclCode,
        mainInsclName: result.mainInsclName,
        subInsclCode: result.subInsclCode,
        subInsclName: result.subInsclName,
        hmainCode: result.hmainCode,
        hmainName: result.hmainName,
        hsubCode: result.hsubCode,
        hsubName: result.hsubName,
        nhsoVerifiedAt: result.verifiedAt,
      },
    });

    return { profile: updatedProfile, nhsoResult: result };
  }

  return { profile, nhsoResult: result };
}
