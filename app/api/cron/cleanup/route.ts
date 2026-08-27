import { NextRequest, NextResponse } from 'next/server';
import { executeStoragePurge } from '@/lib/maintenance/purge-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60s max execution

export async function GET(req: NextRequest) {
  try {
    // Verify Cron Secret if configured in environment
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret) {
      const token = authHeader?.replace('Bearer ', '');
      const customSecretHeader = req.headers.get('x-cron-secret');

      if (token !== cronSecret && customSecretHeader !== cronSecret) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Invalid Cron Secret' },
          { status: 401 }
        );
      }
    }

    const result = await executeStoragePurge('cron');

    return NextResponse.json({
      success: true,
      message: 'Storage maintenance and purge completed successfully.',
      data: result,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Storage purge failed.';
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
