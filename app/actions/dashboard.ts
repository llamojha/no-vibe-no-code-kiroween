'use server';

import { redirect } from 'next/navigation';
import { UseCaseFactory } from '@/src/infrastructure/factories/UseCaseFactory';
import { getCurrentUserId, isAuthenticated } from '@/src/infrastructure/web/helpers/serverAuth';
import { UserId } from '@/src/domain/entities/user/UserId';
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

    // Execute use cases
    const useCaseFactory = UseCaseFactory.getInstance();
    
    // Get user analyses
    const getUserAnalysesHandler = useCaseFactory.createGetUserAnalysesHandler();
    const analysesResult = await getUserAnalysesHandler.handle({
      userId: userId,
      limit: 1000, // Get all analyses for dashboard
      offset: 0,
    });

    if (!analysesResult.isSuccess) {
      return {
        success: false,
        error: analysesResult.error.message,
      };
    }

    // Get dashboard stats
    const getDashboardStatsHandler = useCaseFactory.createGetDashboardStatsHandler();
    const statsResult = await getDashboardStatsHandler.handle({
      userId: userId,
    });

    // Transform analyses to unified format
    const analyses: UnifiedAnalysisRecord[] = analysesResult.data.analyses.map(analysis => ({
      id: analysis.id.value,
      userId: analysis.userId.value,
      category: 'idea' as const, // TODO: Determine category based on analysis type
      title: analysis.idea.split('\n')[0].trim() || analysis.idea.trim(),
      createdAt: analysis.createdAt.toISOString(),
      finalScore: analysis.score.value,
      summary: analysis.detailedSummary || 'No summary available',
      audioBase64: undefined, // Not included in domain entity
      originalData: {
        id: analysis.id.value,
        idea: analysis.idea,
        score: analysis.score.value,
        detailedSummary: analysis.detailedSummary,
        createdAt: analysis.createdAt.toISOString(),
        userId: analysis.userId.value,
      },
    }));

    // Calculate counts
    const counts: AnalysisCounts = {
      total: analyses.length,
      idea: analyses.filter(a => a.category === 'idea').length,
      kiroween: analyses.filter(a => a.category === 'kiroween').length,
    };

    // Prepare stats if available
    let stats;
    if (statsResult.isSuccess) {
      stats = {
        totalAnalyses: statsResult.data.totalAnalyses,
        averageScore: statsResult.data.averageScore,
        recentActivity: statsResult.data.recentActivity,
      };
    }

    return {
      success: true,
      data: {
        analyses,
        counts,
        stats,
      },
    };
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

    // Execute use case
    const useCaseFactory = UseCaseFactory.getInstance();
    const getUserAnalysesHandler = useCaseFactory.createGetUserAnalysesHandler();
    
    const result = await getUserAnalysesHandler.handle({
      userId: userId,
      limit: limit,
      offset: offset,
      category: category, // TODO: Map to domain category type
    });

    if (!result.isSuccess) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    // Transform analyses to unified format
    const analyses: UnifiedAnalysisRecord[] = result.data.analyses.map(analysis => ({
      id: analysis.id.value,
      userId: analysis.userId.value,
      category: 'idea' as const, // TODO: Determine category based on analysis type
      title: analysis.idea.split('\n')[0].trim() || analysis.idea.trim(),
      createdAt: analysis.createdAt.toISOString(),
      finalScore: analysis.score.value,
      summary: analysis.detailedSummary || 'No summary available',
      audioBase64: undefined,
      originalData: {
        id: analysis.id.value,
        idea: analysis.idea,
        score: analysis.score.value,
        detailedSummary: analysis.detailedSummary,
        createdAt: analysis.createdAt.toISOString(),
        userId: analysis.userId.value,
      },
    }));

    return {
      success: true,
      data: {
        analyses,
        total: result.data.total,
        hasMore: result.data.total > offset + analyses.length,
      },
    };
  } catch (error) {
    console.error('Error in getUserAnalysesAction:', error);
    
    return {
      success: false,
      error: 'Failed to load analyses. Please try again.',
    };
  }
}