import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
  status: 'SUCCESS' | 'NOT_FOUND' | 'ERROR';
  errorMessage?: string;
}

/**
 * Check health insurance rights with NHSO API using Citizen ID (PID)
 * @param citizenId 13-digit Thai national ID
 */
export async function checkNhsoRights(citizenId: string): Promise<NhsoCheckResult> {
  const cleanPid = citizenId.replace(/\D/g, '');

  if (cleanPid.length !== 13) {
    return {
      verifiedAt: new Date(),
      status: 'ERROR',
      errorMessage: 'Invalid Citizen ID length. Must be 13 digits.',
    };
  }

  const nhsoApiEndpoint = process.env.NHSO_API_ENDPOINT || 'https://ucw.nhso.go.th/ucws/service';
  const nhsoUser = process.env.NHSO_API_USER;
  const nhsoPassword = process.env.NHSO_API_PASSWORD;

  try {
    // Note: Mock/Fallback handling when NHSO API is not configured or in dev mode
    if (!nhsoUser || !process.env.NHSO_API_ENDPOINT) {
      console.log(`[NHSO Service] Simulating NHSO API check for PID: ${cleanPid}`);
      return {
        mainInsclCode: 'UCS',
        mainInsclName: 'สิทธิหลักประกันสุขภาพแห่งชาติ (บัตรทอง)',
        subInsclCode: 'WEL',
        subInsclName: 'สิทธิผู้มีรายได้น้อย / นักเรียน',
        hmainCode: '10660',
        hmainName: 'โรงพยาบาลศิริราช',
        hsubCode: '10660',
        hsubName: 'โรงพยาบาลศิริราช',
        verifiedAt: new Date(),
        status: 'SUCCESS',
      };
    }

    // Call actual NHSO endpoint
    const response = await fetch(nhsoApiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userToken: nhsoUser,
        passwordToken: nhsoPassword,
        pid: cleanPid,
      }),
    });

    if (!response.ok) {
      throw new Error(`NHSO API responded with status: ${response.status}`);
    }

    const data = await response.json();

    return {
      mainInsclCode: data.maininscl || data.mainInsclCode,
      mainInsclName: data.maininscl_name || data.mainInsclName,
      subInsclCode: data.subinscl || data.subInsclCode,
      subInsclName: data.subinscl_name || data.subInsclName,
      hmainCode: data.hmain || data.hmainCode,
      hmainName: data.hmain_name || data.hmainName,
      hsubCode: data.hsub || data.hsubCode,
      hsubName: data.hsub_name || data.hsubName,
      verifiedAt: new Date(),
      status: 'SUCCESS',
    };
  } catch (err: any) {
    console.error('[NHSO Service Error]:', err);
    return {
      verifiedAt: new Date(),
      status: 'ERROR',
      errorMessage: err.message || 'Failed to connect to NHSO API',
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
    throw new Error('Profile not found or citizenId missing');
  }

  const result = await checkNhsoRights(profile.citizenId);

  if (result.status === 'SUCCESS') {
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
