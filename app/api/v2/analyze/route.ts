import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Create a new analysis
 * POST /api/v2/analyze
 * TODO: Implement with complete hexagonal architecture
 */
export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { error: 'V2 API not yet implemented. Use /api/analyze instead.' },
    { status: 501 }
  );
}

/**
 * List user's analyses
 * GET /api/v2/analyze
 * TODO: Implement with complete hexagonal architecture
 */
export async function GET(_request: NextRequest) {
  return NextResponse.json(
    { error: 'V2 API not yet implemented. Use /api/analyze instead.' },
    { status: 501 }
  );
}