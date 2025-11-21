import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Get list of user's ideas
 * GET /api/v2/ideas
 */
export async function GET(_request: NextRequest) {
  try {
    // Not implemented yet
    return NextResponse.json(
      { error: "List ideas endpoint not yet implemented" },
      { status: 501 }
    );
  } catch (error) {
    console.error("Error in GET /api/v2/ideas:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Create a new idea
 * POST /api/v2/ideas
 */
export async function POST(_request: NextRequest) {
  // This will be implemented when we add idea creation functionality
  return NextResponse.json(
    { error: "Create idea endpoint not yet implemented" },
    { status: 501 }
  );
}
