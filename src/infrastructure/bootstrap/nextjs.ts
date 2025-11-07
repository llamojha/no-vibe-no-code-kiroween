/**
 * Next.js specific bootstrap and initialization
 * Integrates the hexagonal architecture with Next.js runtime
 */

import { NextRequest, NextResponse } from 'next/server';
import { initializeApplication, getServiceFactory, healthCheck } from '../../main';
import { ServiceFactory } from '../factories/ServiceFactory';

/**
 * Next.js application bootstrap
 * Handles initialization in Next.js server context
 */
export class NextJSBootstrap {
  private static initialized = false;
  private static initializationPromise: Promise<void> | null = null;

  /**
   * Initialize the application for Next.js
   * Ensures single initialization across all API routes and server actions
   */
  static async initialize(): Promise<void> {
    if (NextJSBootstrap.initialized) {
      return;
    }

    if (NextJSBootstrap.initializationPromise) {
      return NextJSBootstrap.initializationPromise;
    }

    NextJSBootstrap.initializationPromise = (async () => {
      try {
        await initializeApplication();
        NextJSBootstrap.initialized = true;
        console.log('✅ Next.js application bootstrap complete');
      } catch (error) {
        console.error('❌ Next.js application bootstrap failed:', error);
        NextJSBootstrap.initializationPromise = null;
        throw error;
      }
    })();

    return NextJSBootstrap.initializationPromise;
  }

  /**
   * Get service factory with automatic initialization
   */
  static async getServiceFactory(): Promise<ServiceFactory> {
    await NextJSBootstrap.initialize();
    return getServiceFactory();
  }

  /**
   * Check if the application is initialized
   */
  static isInitialized(): boolean {
    return NextJSBootstrap.initialized;
  }
}

/**
 * Middleware for API routes to ensure application is initialized
 */
export function withApplicationBootstrap<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      await NextJSBootstrap.initialize();
      return await handler(...args);
    } catch (error) {
      console.error('Application bootstrap failed in API route:', error);
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      );
    }
  };
}

/**
 * Server action wrapper to ensure application is initialized
 */
export function withServerActionBootstrap<T extends any[], R>(
  action: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    await NextJSBootstrap.initialize();
    return await action(...args);
  };
}

/**
 * Health check API route handler
 */
export async function handleHealthCheck(): Promise<NextResponse> {
  try {
    const health = await healthCheck();
    
    return NextResponse.json(health, {
      status: health.status === 'healthy' ? 200 : 503,
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Health check failed',
      },
      { status: 503 }
    );
  }
}

/**
 * Create API route handler with automatic bootstrap
 */
export function createAPIRouteHandler(handlers: {
  GET?: (request: NextRequest) => Promise<NextResponse>;
  POST?: (request: NextRequest) => Promise<NextResponse>;
  PUT?: (request: NextRequest) => Promise<NextResponse>;
  DELETE?: (request: NextRequest) => Promise<NextResponse>;
  PATCH?: (request: NextRequest) => Promise<NextResponse>;
}) {
  const wrappedHandlers: any = {};

  for (const [method, handler] of Object.entries(handlers)) {
    if (handler) {
      wrappedHandlers[method] = withApplicationBootstrap(handler);
    }
  }

  return wrappedHandlers;
}

/**
 * Utility to get controllers with automatic bootstrap
 */
export async function getControllers() {
  const serviceFactory = await NextJSBootstrap.getServiceFactory();
  
  return {
    analysisController: serviceFactory.createAnalysisController(),
    hackathonController: serviceFactory.createHackathonController(),
    dashboardController: serviceFactory.createDashboardController(),
  };
}

/**
 * Development mode utilities
 */
export const devUtils = {
  /**
   * Reset application state (useful for development)
   */
  async resetApplication(): Promise<void> {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('resetApplication can only be used in development');
    }

    NextJSBootstrap.initialized = false;
    NextJSBootstrap.initializationPromise = null;
    
    console.log('🔄 Application state reset for development');
  },

  /**
   * Get application status for debugging
   */
  getStatus() {
    return {
      initialized: NextJSBootstrap.initialized,
      hasInitializationPromise: !!NextJSBootstrap.initializationPromise,
    };
  },
};