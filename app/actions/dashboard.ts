'use server';

import { redirect } from 'next/navigation';
import { ServiceFactory } from '@/src/infrastructure/factories/ServiceFactory';
import { serverSupabase } from '@/lib/supabase/server';
import { getCurrentUserId, isAuthenticated } from '@/src/infrastructure/web/helpers/serverAuth';
import { UserId } from '@/src/domain/value-objects/UserId';
import type { UnifiedAnalysisRecord, AnalysisCounts } from '@/lib/types';

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
      redirect('/login');
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      redirect('/login');
    }

    // Execute through controller and parse response
    const supabase = serverSupabase();
    const serviceFactory = ServiceFactory.getInstance(supabase);
    const dashboardController = serviceFactory.createDashboardController();
    
    // Create a mock request for the controller
    const mockRequest = {
      headers: new Headers({
        'authorization': `Bearer ${supabase.auth.getSession()}`
      })
    } as any;
    
    const response = await dashboardController.getDashboard(mockRequest);
    const responseData = await response.json();

    if (response.status === 200) {
      return {
        success: true,
        data: responseData,
      };
    } else {
      return {
        success: false,
        error: responseData.error || 'Failed to get dashboard data',
      };
    }
  } catch (error) {
    console.error('Error in getDashboardDataAction:', error);
    
    return {
      success: false,
      error: 'Failed to load dashboard data. Please try again.',
    };
  }
}

/**
 * Server action to get user analyses with pagination
 */
export async function getUserAnalysesAction(
  page: number = 1,
  limit: number = 20,
  category?: 'idea' | 'kiroween'
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
      redirect('/login');
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      redirect('/login');
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Execute through controller and parse response
    const supabase = serverSupabase();
    const serviceFactory = ServiceFactory.getInstance(supabase);
    const dashboardController = serviceFactory.createDashboardController();
    
    // Create a mock request for the controller
    const mockRequest = {
      url: `http://localhost:3000/api/v2/dashboard/analyses?page=${page}&limit=${limit}${category ? `&category=${category}` : ''}`,
      headers: new Headers({
        'authorization': `Bearer ${supabase.auth.getSession()}`
      })
    } as any;
    
    const response = await dashboardController.getUserAnalyses(mockRequest);
    const responseData = await response.json();

    if (response.status === 200) {
      return {
        success: true,
        data: responseData,
      };
    } else {
      return {
        success: false,
        error: responseData.error || 'Failed to get analyses',
      };
    }
  } catch (error) {
    console.error('Error in getUserAnalysesAction:', error);
    
    return {
      success: false,
      error: 'Failed to load analyses. Please try again.',
    };
  }
}