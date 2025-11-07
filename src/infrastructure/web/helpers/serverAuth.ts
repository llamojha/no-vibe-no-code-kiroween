import { ServiceFactory } from '../../factories/ServiceFactory';
import { SupabaseAdapter } from '../../integration/SupabaseAdapter';
import { User } from '../../../domain/entities/User';
import { UserId } from '../../../domain/value-objects/UserId';
import { AuthenticationService } from '../../../application/services/AuthenticationService';
import { SessionService } from '../../../application/services/SessionService';

/**
 * Server-side authentication helpers
 * Provides easy access to user authentication in server components and API routes
 */

/**
 * Get current user from server context
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = SupabaseAdapter.getServerClient();
    const serviceFactory = ServiceFactory.getInstance(supabase);
    const authService = serviceFactory.createAuthenticationService();
    
    return await authService.getCurrentUser();
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Get current user ID from server context
 */
export async function getCurrentUserId(): Promise<UserId | null> {
  try {
    const supabase = SupabaseAdapter.getServerClient();
    const serviceFactory = ServiceFactory.getInstance(supabase);
    const authService = serviceFactory.createAuthenticationService();
    
    return await authService.getCurrentUserId();
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
}

/**
 * Check if user is authenticated in server context
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const supabase = SupabaseAdapter.getServerClient();
    const serviceFactory = ServiceFactory.getInstance(supabase);
    const authService = serviceFactory.createAuthenticationService();
    
    return await authService.isAuthenticated();
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

/**
 * Get authentication service instance
 */
export async function getAuthenticationService(): Promise<AuthenticationService> {
  const supabase = SupabaseAdapter.getServerClient();
  const serviceFactory = ServiceFactory.getInstance(supabase);
  return serviceFactory.createAuthenticationService();
}

/**
 * Get session service instance
 */
export async function getSessionService(): Promise<SessionService> {
  const supabase = SupabaseAdapter.getServerClient();
  const serviceFactory = ServiceFactory.getInstance(supabase);
  return serviceFactory.createSessionService();
}

/**
 * Require authenticated user in server context
 * Throws error if user is not authenticated
 */
export async function requireCurrentUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User must be authenticated');
  }
  return user;
}

/**
 * Require authenticated user ID in server context
 * Throws error if user is not authenticated
 */
export async function requireCurrentUserId(): Promise<UserId> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('User must be authenticated');
  }
  return userId;
}

/**
 * Check if current user has admin permissions
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const sessionService = await getSessionService();
    return await sessionService.isCurrentUserAdmin();
  } catch (error) {
    console.error('Error checking admin permissions:', error);
    return false;
  }
}

/**
 * Check if current user has paid subscription
 */
export async function isCurrentUserPaid(): Promise<boolean> {
  try {
    const sessionService = await getSessionService();
    return await sessionService.isCurrentUserPaid();
  } catch (error) {
    console.error('Error checking paid subscription:', error);
    return false;
  }
}

/**
 * Get full session context
 */
export async function getSessionContext() {
  try {
    const sessionService = await getSessionService();
    return await sessionService.getSessionContext();
  } catch (error) {
    console.error('Error getting session context:', error);
    return {
      user: null,
      userId: null,
      isAuthenticated: false,
      isAdmin: false,
      isPaid: false,
      isFree: true
    };
  }
}