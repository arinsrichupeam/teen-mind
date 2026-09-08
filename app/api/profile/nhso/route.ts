import { NextResponse } from 'next/server';
import { updateProfileNhsoRights } from '@/lib/nhso-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { profileId } = body;

    if (!profileId) {
      return NextResponse.json(
        { error: 'Missing required field: profileId' },
        { status: 400 }
      );
    }

    const { profile, nhsoResult } = await updateProfileNhsoRights(profileId);

    if (nhsoResult.status === 'ERROR') {
      return NextResponse.json(
        {
          error: nhsoResult.errorMessage || 'Failed to verify NHSO rights',
          nhsoResult,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      message: 'NHSO health rights updated successfully',
      profile,
      nhsoResult,
    });
  } catch (error: any) {
    console.error('[API /api/profile/nhso Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
