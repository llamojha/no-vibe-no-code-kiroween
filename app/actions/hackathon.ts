"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ServiceFactory } from "@/src/infrastructure/factories/ServiceFactory";
import type { NextRequest } from "next/server";
import { SupabaseAdapter } from "@/src/infrastructure/integration/SupabaseAdapter";
import {
  getCurrentUserId,
  isAuthenticated,
} from "@/src/infrastructure/web/helpers/serverAuth";
import type { HackathonAnalysisResponseDTO } from "@/src/infrastructure/web/dto/HackathonDTO";

// Type for mock request used in server actions
type MockRequest = {
  json?: () => Promise<Record<string, unknown>>;
  headers: Headers;
  url?: string;
};

// Input validation schemas
const CreateHackathonAnalysisSchema = z.object({
  projectDescription: z
    .string()
    .min(10, "Project description must be at least 10 characters")
    .max(5000, "Project description must be less than 5000 characters"),
  teamSize: z
    .number()
    .int()
    .min(1, "Team size must be at least 1")
    .max(20, "Team size must be less than 20"),
  timeframe: z.string().min(1, "Timeframe is required"),
  techStack: z.string().min(1, "Tech stack is required"),
  locale: z.enum(["en", "es"]).default("en"),
});

const DeleteHackathonAnalysisSchema = z.object({
  analysisId: z.string().uuid("Invalid analysis ID format"),
});

/**
 * Server action to create a new hackathon analysis
 */
export async function createHackathonAnalysisAction(
  formData: FormData
): Promise<{
  success: boolean;
  data?: HackathonAnalysisResponseDTO;
  error?: string;
}> {
  try {
    // Check authentication (hackathon analyzer might not require authentication)
    const authenticated = await isAuthenticated();

    // Parse and validate input
    const rawData = {
      projectDescription: formData.get("projectDescription") as string,
      teamSize: parseInt(formData.get("teamSize") as string, 10),
      timeframe: formData.get("timeframe") as string,
      techStack: formData.get("techStack") as string,
      locale: (formData.get("locale") as string) || "en",
    };

    const validatedData = CreateHackathonAnalysisSchema.parse(rawData);

    // Execute through controller and parse response
    const supabase = SupabaseAdapter.getServerClient();
    const serviceFactory = ServiceFactory.create(supabase);
    const hackathonController = serviceFactory.createHackathonController();

    // Get session token for authorization header if authenticated
    let accessToken = "";
    if (authenticated) {
      // Validate user authenticity with getUser() before getting session token
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        return {
          success: false,
          error: "Unauthorized: User authentication failed",
        };
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      accessToken = session?.access_token || "";
    }

    // Create a mock request for the controller
    const mockRequest: MockRequest = {
      json: async () => ({
        projectDescription: validatedData.projectDescription,
        teamSize: validatedData.teamSize,
        timeframe: validatedData.timeframe,
        techStack: validatedData.techStack,
        locale: validatedData.locale,
      }),
      headers: new Headers({
        authorization: authenticated ? `Bearer ${accessToken}` : "",
      }),
    };

    const response = await hackathonController.analyzeHackathonProject(
      mockRequest as unknown as NextRequest
    );
    const responseData = await response.json();

    if (response.status === 200 || response.status === 201) {
      // Revalidate relevant pages
      if (authenticated) {
        revalidatePath("/dashboard");
      }
      revalidatePath("/kiroween-analyzer");

      return {
        success: true,
        data: responseData,
      };
    } else {
      return {
        success: false,
        error: responseData.error || "Hackathon analysis failed",
      };
    }
  } catch (error) {
    console.error("Error in createHackathonAnalysisAction:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues.map((e) => e.message).join(", "),
      };
    }

    return {
      success: false,
      error: "Failed to create hackathon analysis. Please try again.",
    };
  }
}

/**
 * Server action to delete a hackathon analysis
 */
export async function deleteHackathonAnalysisAction(
  formData: FormData
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Check authentication
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      redirect("/login");
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      redirect("/login");
    }

    // Parse and validate input
    const rawData = {
      analysisId: formData.get("analysisId") as string,
    };

    const validatedData = DeleteHackathonAnalysisSchema.parse(rawData);

    // Execute through controller and parse response
    const supabase = SupabaseAdapter.getServerClient();
    const serviceFactory = ServiceFactory.create(supabase);
    const dashboardController = serviceFactory.createDashboardController();

    // Validate user authenticity with getUser() before getting session token
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return {
        success: false,
        error: "Unauthorized: User authentication failed",
      };
    }

    // Get session token for authorization header
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const accessToken = session?.access_token || "";

    // Create a mock request for the controller
    const mockRequest: MockRequest = {
      json: async () => ({
        analysisId: validatedData.analysisId,
      }),
      headers: new Headers({
        authorization: `Bearer ${accessToken}`,
      }),
    };

    const response = await dashboardController.deleteUserAnalysis(
      mockRequest as unknown as NextRequest,
      {
        params: { id: validatedData.analysisId },
      }
    );
    const responseData = await response.json();

    if (response.status === 200 || response.status === 204) {
      // Revalidate relevant pages
      revalidatePath("/dashboard");

      return {
        success: true,
      };
    } else {
      return {
        success: false,
        error: responseData.error || "Failed to delete hackathon analysis",
      };
    }
  } catch (error) {
    console.error("Error in deleteHackathonAnalysisAction:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues.map((e) => e.message).join(", "),
      };
    }

    return {
      success: false,
      error: "Failed to delete hackathon analysis. Please try again.",
    };
  }
}

/**
 * Server action to get hackathon analysis by ID
 */
export async function getHackathonAnalysisAction(analysisId: string): Promise<{
  success: boolean;
  data?: HackathonAnalysisResponseDTO;
  error?: string;
}> {
  try {
    // Validate input
    if (!analysisId || typeof analysisId !== "string") {
      return {
        success: false,
        error: "Invalid analysis ID",
      };
    }

    // Execute through controller and parse response
    const supabase = SupabaseAdapter.getServerClient();
    const serviceFactory = ServiceFactory.create(supabase);
    const dashboardController = serviceFactory.createDashboardController();

    // Validate user authenticity with getUser() before getting session token
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return {
        success: false,
        error: "Unauthorized: User authentication failed",
      };
    }

    // Get session token for authorization header
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const accessToken = session?.access_token || "";

    // Create a mock request for the controller
    const mockRequest: MockRequest = {
      headers: new Headers({
        authorization: `Bearer ${accessToken}`,
      }),
    };

    const response = await dashboardController.getUserAnalysis(
      mockRequest as unknown as NextRequest,
      {
        params: { id: analysisId },
      }
    );
    const responseData = await response.json();

    if (response.status === 200) {
      return {
        success: true,
        data: responseData,
      };
    } else {
      return {
        success: false,
        error: responseData.error || "Hackathon analysis not found",
      };
    }
  } catch (error) {
    console.error("Error in getHackathonAnalysisAction:", error);

    return {
      success: false,
      error: "Failed to get hackathon analysis. Please try again.",
    };
  }
}
