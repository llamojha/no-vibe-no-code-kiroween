import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Search analyses
 * GET /api/v2/analyze/search
 * TODO: Implement with complete hexagonal architecture
 */
export async function GET(_request: NextRequest) {
  return NextResponse.json(
    { error: 'V2 API not yet implemented.' },
    { status: 501 }
  );
}