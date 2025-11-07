/**
 * Development endpoint to test the logger
 * Only available in development mode
 */

import { NextResponse } from 'next/server';
import { logError, logWarning } from '@/lib/dev-logger';

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  // Generate test logs
  logWarning('Test warning message from dev logger');
  logError('Test error message from dev logger');
  logError('Test error with object', { foo: 'bar', timestamp: new Date() });
  console.log('Test log message (not captured)');

  return NextResponse.json({
    message: 'Test logs generated',
    note: 'Check logs/errors.log and logs/warnings.log',
  });
}
