/**
 * Development endpoint to test the new logger system
 * Only available in development mode
 */

import { NextResponse } from 'next/server';
import { logger, LogCategory } from '@/lib/logger';

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  // Test different categories and levels
  logger.info(LogCategory.API, 'API endpoint called', { endpoint: '/api/dev/test-new-logger' });
  logger.debug(LogCategory.DATABASE, 'Database query executed', { query: 'SELECT * FROM users', duration: 45 });
  logger.warn(LogCategory.AI, 'AI service slow response', { duration: 5000, model: 'gemini-pro' });
  logger.error(LogCategory.AUTH, 'Authentication failed', { userId: '123', reason: 'Invalid token' });
  
  // Test with error object
  const testError = new Error('Test error with stack trace');
  logger.error(LogCategory.INFRASTRUCTURE, 'Infrastructure error occurred', testError);
  
  // Test different categories
  logger.info(LogCategory.VALIDATION, 'Validation passed', { field: 'email', value: 'test@example.com' });
  logger.warn(LogCategory.BUSINESS, 'Business rule warning', { rule: 'max_attempts', current: 4, max: 5 });
  logger.debug(LogCategory.UI, 'Component rendered', { component: 'TestLogger', props: { test: true } });

  return NextResponse.json({
    message: 'Test logs generated successfully',
    note: 'Check logs/ directory for categorized log files',
    files: [
      'logs/all.log - All logs',
      'logs/errors.log - Only errors',
      'logs/warnings.log - Only warnings',
      'logs/api.log - API category',
      'logs/database.log - Database category',
      'logs/ai.log - AI category',
      'logs/auth.log - Auth category',
      'logs/infrastructure.log - Infrastructure category',
      'logs/validation.log - Validation category',
      'logs/business.log - Business category',
      'logs/ui.log - UI category',
    ],
  });
}
