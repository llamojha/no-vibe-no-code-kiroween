'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { UseCaseFactory } from '@/src/infrastructure/factories/UseCaseFactory';
import { getCurrentUserId, isAuthenticated } from '@/src/infrastructure/web/helpers/serverAuth';
import { CreateHackathonAnalysisCommand } from '@/src/application/types/commands';
import { HackathonAnalysisId } from '@/src/domain/entities/hackathon/HackathonAnalysisId';
import { UserId } from '@/src/domain/entities/user/UserId';
import { Locale } from '@/src/domain/value-objects/Locale';
import type { HackathonAnalysisResponseDTO } from '@/src/infrastructure/web/dto/HackathonDTO';

// Input validation schemas
const CreateHackathonAnalysisSchema = z.object({
  projectDescription: z.string().min(10, 'Project description must be at least 10 characters').max(5000, 'Project description must be less than 5000 characters'),
  teamSize: z.number().int().min(1, 'Team size must be at least 1').max(20, 'Team size must be less than 20'),
  timeframe: z.string().min(1, 'Timeframe is required'),
  techStack: z.string().min(1, 'Tech stack is required'),
  locale: z.enum(['en', 'es']).default('en'),
});

const DeleteHackathonAnalysisSchema = z.object({
  analysisId: z.string().uuid('Invalid analysis ID format'),
});

/**
 * Server action to create a new hackathon analysis
 */
export async function createHackathonAnalysisAction(formData: FormData): Promise<{
  success: boolean;
  data?: HackathonAnalysisResponseDTO;
  error?: string;
}> {
  try {
    // Check authentication (hackathon analyzer might not require authentication)
    const authenticated = await isAuthenticated();
    let userId: UserId | null = null;
    
    if (authenticated) {
      userId = await getCurrentUserId();
    }

    // Parse and validate input
    const rawData = {
      projectDescription: formData.get('projectDescription') as string,
      teamSize: parseInt(formData.get('teamSize') as string, 10),
      timeframe: formData.get('timeframe') as string,
      techStack: formData.get('techStack') as string,
      locale: formData.get('locale') as string || 'en',
    };

    const validatedData = CreateHackathonAnalysisSchema.parse(rawData);

    // Create command
    const command = new CreateHackathonAnalysisCommand(
      validatedData.projectDescription,
      validatedData.teamSize,
      validatedData.timeframe,
      validatedData.techStack,
      userId, // Can be null for anonymous users
      Locale.fromString(validatedData.locale)
    );

    // Execute use case
    const useCaseFactory = UseCaseFactory.getInstance();
    const createHackathonAnalysisHandler = useCaseFactory.createCreateHackathonAnalysisHandler();
    
    const result = await createHackathonAnalysisHandler.handle(command);

    if (result.isSuccess) {
      // Revalidate relevant pages
      if (authenticated) {
        revalidatePath('/dashboard');
      }
      revalidatePath('/kiroween-analyzer');

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
    console.error('Error in createHackathonAnalysisAction:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map(e => e.message).join(', '),
      };
    }

    return {
      success: false,
      error: 'Failed to create hackathon analysis. Please try again.',
    };
  }
}

/**
 * Server action to delete a hackathon analysis
 */
export async function deleteHackathonAnalysisAction(formData: FormData): Promise<{
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

    const validatedData = DeleteHackathonAnalysisSchema.parse(rawData);

    // Execute use case
    const useCaseFactory = UseCaseFactory.getInstance();
    const deleteHackathonAnalysisHandler = useCaseFactory.createDeleteHackathonAnalysisHandler();
    
    const result = await deleteHackathonAnalysisHandler.handle({
      analysisId: HackathonAnalysisId.fromString(validatedData.analysisId),
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
    console.error('Error in deleteHackathonAnalysisAction:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map(e => e.message).join(', '),
      };
    }

    return {
      success: false,
      error: 'Failed to delete hackathon analysis. Please try again.',
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
    if (!analysisId || typeof analysisId !== 'string') {
      return {
        success: false,
        error: 'Invalid analysis ID',
      };
    }

    // Execute use case
    const useCaseFactory = UseCaseFactory.getInstance();
    const getHackathonAnalysisHandler = useCaseFactory.createGetHackathonAnalysisHandler();
    
    const result = await getHackathonAnalysisHandler.handle({
      analysisId: HackathonAnalysisId.fromString(analysisId),
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
    console.error('Error in getHackathonAnalysisAction:', error);
    
    return {
      success: false,
      error: 'Failed to get hackathon analysis. Please try again.',
    };
  }
}