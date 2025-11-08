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
import { Locale } from "@/src/domain/value-objects/Locale";
import type { AnalysisResponseDTO } from "@/src/infrastructure/web/dto/AnalysisDTO";
import { CreateAnalysisCommand } from "@/src/application/types/commands/AnalysisCommands";

// Type for mock request used in server actions
type MockRequest = {
  json?: () => Promise<Record<string, unknown>>;
  headers: Headers;
  url?: string;
};

// Input validation schemas
const CreateAnalysisSchema = z.object({
  idea: z
    .string()
    .min(10, "Idea must be at least 10 characters")
    .max(5000, "Idea must be less than 5000 characters"),
  locale: z.enum(["en", "es"]).default("en"),
});

const DeleteAnalysisSchema = z.object({
  analysisId: z.string().uuid("Invalid analysis ID format"),
});

/**
 * Server action to create a new analysis
 */
export async function createAnalysisAction(formData: FormData): Promise<{
  success: boolean;
  data?: AnalysisResponseDTO;
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
      idea: formData.get("idea") as string,
      locale: (formData.get("locale") as string) || "en",
    };

    const validatedData = CreateAnalysisSchema.parse(rawData);

    // Create command
    const command = new CreateAnalysisCommand(
      validatedData.idea,
      userId,
      Locale.create(validatedData.locale)
    );

    // Execute through controller and parse response
    const supabase = SupabaseAdapter.getServerClient();
    const serviceFactory = ServiceFactory.create(supabase);
    const analysisController = serviceFactory.createAnalysisController();

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
        idea: command.idea,
        locale: command.locale.value,
      }),
      headers: new Headers({
        authorization: `Bearer ${accessToken}`,
      }),
    };

    const response = await analysisController.createAnalysis(
      mockRequest as unknown as NextRequest
    );
    const responseData = await response.json();

    if (response.status === 200 || response.status === 201) {
      // Revalidate relevant pages
      revalidatePath("/dashboard");
      revalidatePath("/analyzer");

      return {
        success: true,
        data: responseData,
      };
    } else {
      return {
        success: false,
        error: responseData.error || "Analysis failed",
      };
    }
  } catch (error) {
    console.error("Error in createAnalysisAction:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues.map((e) => e.message).join(", "),
      };
    }

    return {
      success: false,
      error: "Failed to create analysis. Please try again.",
    };
  }
}

/**
 * Server action to delete an analysis
 */
export async function deleteAnalysisAction(formData: FormData): Promise<{
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

    const validatedData = DeleteAnalysisSchema.parse(rawData);

    // Execute through controller and parse response
    const supabase = SupabaseAdapter.getServerClient();
    const serviceFactory = ServiceFactory.create(supabase);
    const analysisController = serviceFactory.createAnalysisController();

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

    const response = await analysisController.deleteAnalysis(
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
        error: responseData.error || "Failed to delete analysis",
      };
    }
  } catch (error) {
    console.error("Error in deleteAnalysisAction:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues.map((e) => e.message).join(", "),
      };
    }

    return {
      success: false,
      error: "Failed to delete analysis. Please try again.",
    };
  }
}

/**
 * Server action to get analysis by ID
 */
export async function getAnalysisAction(analysisId: string): Promise<{
  success: boolean;
  data?: AnalysisResponseDTO;
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
    const analysisController = serviceFactory.createAnalysisController();

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

    const response = await analysisController.getAnalysis(
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
        error: responseData.error || "Analysis not found",
      };
    }
  } catch (error) {
    console.error("Error in getAnalysisAction:", error);

    return {
      success: false,
      error: "Failed to get analysis. Please try again.",
    };
  }
}
