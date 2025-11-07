/**
 * Example usage of the service composition and dependency management system
 * This file demonstrates how to use the factories and bootstrap system
 */

import { initializeApplication, getServiceFactory } from '../../main';
import { NextJSBootstrap, getControllers } from '../bootstrap';

/**
 * Example: Initialize application and get services
 */
export async function exampleApplicationInitialization() {
  try {
    // Method 1: Direct application initialization
    const app = await initializeApplication();
    const serviceFactory = app.getServiceFactory();
    
    // Get controllers
    const analysisController = serviceFactory.createAnalysisController();
    const hackathonController = serviceFactory.createHackathonController();
    const dashboardController = serviceFactory.createDashboardController();
    
    console.log('✅ Application initialized successfully');
    console.log('Controllers created:', {
      analysis: !!analysisController,
      hackathon: !!hackathonController,
      dashboard: !!dashboardController
    });
    
    return { analysisController, hackathonController, dashboardController };
    
  } catch (error) {
    console.error('❌ Application initialization failed:', error);
    throw error;
  }
}

/**
 * Example: Next.js specific initialization
 */
export async function exampleNextJSInitialization() {
  try {
    // Method 2: Next.js specific bootstrap
    const controllers = await getControllers();
    
    console.log('✅ Next.js bootstrap completed');
    console.log('Controllers available:', Object.keys(controllers));
    
    return controllers;
    
  } catch (error) {
    console.error('❌ Next.js bootstrap failed:', error);
    throw error;
  }
}

/**
 * Example: Using factories directly
 */
export async function exampleFactoryUsage() {
  try {
    // Initialize application first
    await initializeApplication();
    
    // Get service factory
    const serviceFactory = getServiceFactory();
    
    // Get repository factory
    const repositoryFactory = serviceFactory.getRepositoryFactory();
    
    // Create repositories
    const analysisRepository = repositoryFactory.createAnalysisRepository();
    const userRepository = repositoryFactory.createUserRepository();
    
    // Get use case factory
    const useCaseFactory = serviceFactory.getUseCaseFactory();
    
    // Create use cases
    const analyzeIdeaUseCase = useCaseFactory.createAnalyzeIdeaUseCase();
    const getAnalysisUseCase = useCaseFactory.createGetAnalysisUseCase();
    
    console.log('✅ Factories and services created successfully');
    console.log('Services available:', {
      repositories: { analysis: !!analysisRepository, user: !!userRepository },
      useCases: { analyzeIdea: !!analyzeIdeaUseCase, getAnalysis: !!getAnalysisUseCase }
    });
    
    return {
      repositories: { analysisRepository, userRepository },
      useCases: { analyzeIdeaUseCase, getAnalysisUseCase }
    };
    
  } catch (error) {
    console.error('❌ Factory usage failed:', error);
    throw error;
  }
}

/**
 * Example: Configuration usage
 */
export async function exampleConfigurationUsage() {
  try {
    const { 
      getAppConfig, 
      getDatabaseConfig, 
      getAIConfig, 
      getFeatureFlags 
    } = await import('../config');
    
    // Get configurations
    const appConfig = getAppConfig();
    const dbConfig = getDatabaseConfig();
    const aiConfig = getAIConfig();
    const features = getFeatureFlags();
    
    console.log('✅ Configuration loaded successfully');
    console.log('Configuration summary:', {
      environment: appConfig.environment,
      database: { url: !!dbConfig.supabaseUrl },
      ai: { model: aiConfig.model },
      features: {
        hackathon: features.enableHackathonAnalyzer,
        classic: features.enableClassicAnalyzer,
        audio: features.enableAudioFeatures
      }
    });
    
    return { appConfig, dbConfig, aiConfig, features };
    
  } catch (error) {
    console.error('❌ Configuration loading failed:', error);
    throw error;
  }
}

/**
 * Example: Health check usage
 */
export async function exampleHealthCheck() {
  try {
    const { healthCheck } = await import('../../main');
    
    const health = await healthCheck();
    
    console.log('✅ Health check completed');
    console.log('Health status:', health);
    
    return health;
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    throw error;
  }
}

/**
 * Example: Complete workflow
 */
export async function exampleCompleteWorkflow() {
  console.log('🚀 Starting complete workflow example...');
  
  try {
    // Step 1: Check configuration
    console.log('📋 Step 1: Loading configuration...');
    await exampleConfigurationUsage();
    
    // Step 2: Initialize application
    console.log('🏗️ Step 2: Initializing application...');
    await exampleApplicationInitialization();
    
    // Step 3: Test Next.js bootstrap
    console.log('🌐 Step 3: Testing Next.js bootstrap...');
    await exampleNextJSInitialization();
    
    // Step 4: Use factories
    console.log('🏭 Step 4: Using factories...');
    await exampleFactoryUsage();
    
    // Step 5: Health check
    console.log('🔍 Step 5: Running health check...');
    await exampleHealthCheck();
    
    console.log('✅ Complete workflow finished successfully!');
    
  } catch (error) {
    console.error('❌ Complete workflow failed:', error);
    throw error;
  }
}

// Export all examples
export const examples = {
  applicationInitialization: exampleApplicationInitialization,
  nextJSInitialization: exampleNextJSInitialization,
  factoryUsage: exampleFactoryUsage,
  configurationUsage: exampleConfigurationUsage,
  healthCheck: exampleHealthCheck,
  completeWorkflow: exampleCompleteWorkflow
};