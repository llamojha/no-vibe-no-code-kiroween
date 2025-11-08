import { NextRequest, NextResponse } from "next/server";
import { generateFrankensteinIdea, type FrankensteinElement } from "@/features/doctor-frankenstein/api/generateFrankensteinIdea";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { elements, mode, language } = body;

    if (!elements || !Array.isArray(elements) || elements.length === 0) {
      return NextResponse.json(
        { error: "Elements array is required" },
        { status: 400 }
      );
    }

    if (!mode || !['companies', 'aws'].includes(mode)) {
      return NextResponse.json(
        { error: "Mode must be 'companies' or 'aws'" },
        { status: 400 }
      );
    }

    const lang = language === 'es' ? 'es' : 'en';

    const result = await generateFrankensteinIdea(
      elements as FrankensteinElement[],
      mode as 'companies' | 'aws',
      lang
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating Frankenstein idea:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate idea" },
      { status: 500 }
    );
  }
}
