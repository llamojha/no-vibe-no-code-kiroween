import { NextResponse } from "next/server";
import { analyzeHackathonProject } from "@/lib/server/ai/analyzeHackathonProject";
import type { SupportedLocale } from "@/features/locale/translations";
import type { ProjectSubmission } from "@/lib/types";
import { serverSupabase } from "@/lib/supabase/server";
import { requirePaidOrAdmin } from "@/lib/auth/access";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = serverSupabase();
    const access = await requirePaidOrAdmin(supabase);
    if (!access.allowed) return access.response;

    const body = await request.json();
    const { submission, locale } = body as {
      submission?: ProjectSubmission;
      locale?: SupportedLocale;
    };

    if (!submission || !locale) {
      return NextResponse.json(
        { error: "Project submission and locale are required." },
        { status: 400 }
      );
    }

    // Validate required submission fields (only description is required now)
    const validationErrors: string[] = [];

    if (
      typeof submission.description !== "string" ||
      submission.description.trim().length === 0
    ) {
      validationErrors.push("Project description is required.");
    }

    // selectedCategory and kiroUsage are optional for analysis

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: validationErrors.join(" "),
        },
        { status: 400 }
      );
    }

    const analysis = await analyzeHackathonProject(submission, locale);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Hackathon Analyze API error", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to analyze hackathon project.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
