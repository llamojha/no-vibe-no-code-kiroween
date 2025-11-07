'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { UseCaseFactory } from '@/src/infrastructure/factories/UseCaseFactory';
import { getCurrentUserId, isAuthenticated } from '@/src/infrastructure/web/helpers/serverAuth';
import { CreateAnalysisCommand } from '@/src/application/types/commands';
import { AnalysisId } from '@/src/domain/entities/analysis/AnalysisId';
import { UserId } from '@/src/domain/entities/user/UserId';
import { Locale } from '@/src/domain/value-objects/Locale';
import type { AnalysisResponseDTO } from '@/src/infrastructure/web/dto/AnalysisDTO';

// Input validation schemas
const CreateAnalysisSchema = z.object({
  idea: z.string().min(10, 'Idea must be at least 10 characters').max(5000, 'Idea must be less than 5000 characters'),
  locale: z.enum(['en', 'es']).default('en'),
});

const DeleteAnalysisSchema = z.object({
  analysisId: z.string().uuid('Invalid analysis ID format'),
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
      redirect('/login');
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      redirect('/login');
    }

    // Parse and validate input
    const rawData = {
      idea: formData.get('idea') as string,
      locale: formData.get('locale') as string || 'en',
    };

    const validatedData = CreateAnalysisSchema.parse(rawData);

    // Create command
    const command = new CreateAnalysisCommand(
      validatedData.idea,
      userId,
      Locale.fromString(validatedData.locale)
    );

    // Execute use case
    const useCaseFactory = UseCaseFactory.getInstance();
    const createAnalysisHandler = useCaseFactory.createCreateAnalysisHandler();
    
    const result = await createAnalysisHandler.handle(command);

    if (result.isSuccess) {
      // Revalidate relevant pages
      revalidatePath('/dashboard');
      revalidatePath('/analyzer');

      return {
        success: true,
        data: result.data,
      };
    } else {
      return {
        success: false,
        error: result.error.message,
      };
    }
  } catch (error) {
    console.error('Error in createAnalysisAction:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map(e => e.message).join(', '),
      };
    }

    return {
      success: false,
      error: 'Failed to create analysis. Please try again.',
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
      redirect('/login');
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      redirect('/login');
    }

    // Parse and validate input
    const rawData = {
      analysisId: formData.get('analysisId') as string,
    };

    const validatedData = DeleteAnalysisSchema.parse(rawData);

    // Execute use case
    const useCaseFactory = UseCaseFactory.getInstance();
    const deleteAnalysisHandler = useCaseFactory.createDeleteAnalysisHandler();
    
    const result = await deleteAnalysisHandler.handle({
      analysisId: AnalysisId.fromString(validatedData.analysisId),
      userId: userId,
    });

    if (result.isSuccess) {
      // Revalidate relevant pages
      revalidatePath('/dashboard');

      return {
        success: true,
      };
    } else {
      return {
        success: false,
        error: result.error.message,
      };
    }
  } catch (error) {
    console.error('Error in deleteAnalysisAction:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map(e => e.message).join(', '),
      };
    }

    return {
      success: false,
      error: 'Failed to delete analysis. Please try again.',
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
      redirect('/login');
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      redirect('/login');
    }

    // Validate input
    if (!analysisId || typeof analysisId !== 'string') {
      return {
        success: false,
        error: 'Invalid analysis ID',
      };
    }

    // Execute use case
    const useCaseFactory = UseCaseFactory.getInstance();
    const getAnalysisHandler = useCaseFactory.createGetAnalysisHandler();
    
    const result = await getAnalysisHandler.handle({
      analysisId: AnalysisId.fromString(analysisId),
      userId: userId,
    });

    if (result.isSuccess) {
      return {
        success: true,
        data: result.data,
      };
    } else {
      return {
        success: false,
        error: result.error.message,
      };
    }
  } catch (error) {
    console.error('Error in getAnalysisAction:', error);
    
    return {
      success: false,
      error: 'Failed to get analysis. Please try again.',
    };
  }
}