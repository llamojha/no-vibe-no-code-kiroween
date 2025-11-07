import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Get analysis by ID
 * GET /api/v2/analyze/[id]
 * TODO: Implement with complete hexagonal architecture
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    { error: 'V2 API not yet implemented.' },
    { status: 501 }
  );
}

/**
 * Update analysis
 * PUT /api/v2/analyze/[id]
 * TODO: Implement with complete hexagonal architecture
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    { error: 'V2 API not yet implemented.' },
    { status: 501 }
  );
}

/**
 * Delete analysis
 * DELETE /api/v2/analyze/[id]
 * TODO: Implement with complete hexagonal architecture
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    { error: 'V2 API not yet implemented.' },
    { status: 501 }
  );
}