import { NextRequest } from "next/server";
import { serverSupabase } from "@/lib/supabase/server";
import { ServiceFactory } from "@/src/infrastructure/factories/ServiceFactory";
import { handleApiError } from "@/src/infrastructure/web/middleware/ErrorMiddleware";
import { authenticateRequest } from "@/src/infrastructure/web/middleware/AuthMiddleware";
import { UserId } from "@/src/domain/value-objects/UserId";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Get credit balance for authenticated user
 * GET /api/v2/credits/balance
 *
 * Returns the current credit balance and tier for the authenticated user.
 * This endpoint is cached for 60 seconds to reduce database load.
 *
 * @returns CreditBalance with credits and tier information
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request, {
      allowFree: true,
      updateLastLogin: false,
    });

    if (!authResult.success) {
      return Response.json({ error: authResult.error }, { status: 401 });
    }

    const userId = authResult.userId!;

    // Create service factory and get use case
    const supabase = serverSupabase();
    const serviceFactory = ServiceFactory.getInstance(supabase);
    const useCaseFactory = serviceFactory.getUseCaseFactory();
    const getCreditBalanceUseCase =
      useCaseFactory.createGetCreditBalanceUseCase();

    // Execute use case
    const result = await getCreditBalanceUseCase.execute(
      UserId.fromString(userId)
    );

    if (!result.success) {
      return Response.json({ error: result.error.message }, { status: 404 });
    }

    // Return credit balance
    return Response.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    return handleApiError(error, "/api/v2/credits/balance");
  }
}
