"use server";

import { redirect } from "next/navigation";
import { ServiceFactory } from "@/src/infrastructure/factories/ServiceFactory";
import { SupabaseAdapter } from "@/src/infrastructure/integration/SupabaseAdapter";
import {
  getCurrentUserId,
  isAuthenticated,
} from "@/src/infrastructure/web/helpers/serverAuth";
import type { UnifiedAnalysisRecord, AnalysisCounts } from "@/lib/types";

// Type for mock request used in server actions
type MockRequest = {
  json?: () => Promise<Record<string, unknown>>;
  headers: Headers;
  url?: string;
};

/**
 * Server action to get dashboard data (analyses and stats)
 */
export async function getDashboardDataAction(): Promise<{
  success: boolean;
  data?: {
    analyses: UnifiedAnalysisRecord[];
    counts: AnalysisCounts;
    stats?: {
      totalAnalyses: number;
      averageScore: number;
      recentActivity: number;
    };
  };
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

    const response = await dashboardController.getDashboard(mockRequest as any);
    const responseData = await response.json();

    if (response.status === 200) {
      return {
        success: true,
        data: responseData,
      };
    } else {
      return {
        success: false,
        error: responseData.error || "Failed to get dashboard data",
      };
    }
  } catch (error) {
    console.error("Error in getDashboardDataAction:", error);

    return {
      success: false,
      error: "Failed to load dashboard data. Please try again.",
    };
  }
}

/**
 * Server action to get user analyses with pagination
 */
export async function getUserAnalysesAction(
  page: number = 1,
  limit: number = 20,
  category?: "idea" | "kiroween"
): Promise<{
  success: boolean;
  data?: {
    analyses: UnifiedAnalysisRecord[];
    total: number;
    hasMore: boolean;
  };
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
      url: `http://localhost:3000/api/v2/dashboard/analyses?page=${page}&limit=${limit}${
        category ? `&category=${category}` : ""
      }`,
      headers: new Headers({
        authorization: `Bearer ${accessToken}`,
      }),
    };

    const response = await dashboardController.getUserAnalyses(
      mockRequest as any
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
        error: responseData.error || "Failed to get analyses",
      };
    }
  } catch (error) {
    console.error("Error in getUserAnalysesAction:", error);

    return {
      success: false,
      error: "Failed to load analyses. Please try again.",
    };
  }
}
