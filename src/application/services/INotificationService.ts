import { UserId, Locale } from '../../domain/value-objects';
import { Result } from '../../shared/types/common';

/**
 * Notification types
 */
export type NotificationType = 
  | 'analysis_completed'
  | 'analysis_reminder'
  | 'hackathon_submission'
  | 'leaderboard_update'
  | 'system_announcement'
  | 'welcome'
  | 'feedback_request';

/**
 * Notification priority levels
 */
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Notification channels
 */
export type NotificationChannel = 'email' | 'push' | 'in_app' | 'sms';

/**
 * Notification data
 */
export interface NotificationData {
  type: NotificationType;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  title: string;
  message: string;
  data?: Record<string, unknown>;
  scheduledFor?: Date;
  expiresAt?: Date;
}

/**
 * Notification result
 */
export interface NotificationResult {
  notificationId: string;
  status: 'sent' | 'scheduled' | 'failed';
  sentChannels: NotificationChannel[];
  failedChannels: Array<{
    channel: NotificationChannel;
    error: string;
  }>;
  sentAt?: Date;
  scheduledFor?: Date;
}

/**
 * Analytics data for notifications
 */
export interface NotificationAnalytics {
  notificationId: string;
  userId: UserId;
  type: NotificationType;
  channel: NotificationChannel;
  status: 'delivered' | 'opened' | 'clicked' | 'dismissed';
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Interface for notification service
 * Handles user notifications and analytics tracking
 */
export interface INotificationService {
  /**
   * Send notification to a user
   */
  sendNotification(
    userId: UserId,
    notification: NotificationData,
    locale: Locale
  ): Promise<Result<NotificationResult, Error>>;

  /**
   * Send notification to multiple users
   */
  sendBulkNotification(
    userIds: UserId[],
    notification: NotificationData,
    locale: Locale
  ): Promise<Result<Array<{
    userId: UserId;
    result: NotificationResult;
  }>, Error>>;

  /**
   * Schedule notification for later delivery
   */
  scheduleNotification(
    userId: UserId,
    notification: NotificationData,
    scheduledFor: Date,
    locale: Locale
  ): Promise<Result<NotificationResult, Error>>;

  /**
   * Cancel scheduled notification
   */
  cancelNotification(
    notificationId: string
  ): Promise<Result<boolean, Error>>;

  /**
   * Get user's notification preferences
   */
  getUserNotificationPreferences(
    userId: UserId
  ): Promise<Result<{
    channels: NotificationChannel[];
    types: NotificationType[];
    frequency: 'immediate' | 'daily' | 'weekly';
    quietHours?: {
      start: string; // HH:MM format
      end: string;   // HH:MM format
      timezone: string;
    };
  }, Error>>;

  /**
   * Update user's notification preferences
   */
  updateUserNotificationPreferences(
    userId: UserId,
    preferences: {
      channels?: NotificationChannel[];
      types?: NotificationType[];
      frequency?: 'immediate' | 'daily' | 'weekly';
      quietHours?: {
        start: string;
        end: string;
        timezone: string;
      };
    }
  ): Promise<Result<boolean, Error>>;

  /**
   * Track notification analytics
   */
  trackNotificationEvent(
    analytics: NotificationAnalytics
  ): Promise<Result<boolean, Error>>;

  /**
   * Get notification analytics for a user
   */
  getUserNotificationAnalytics(
    userId: UserId,
    startDate: Date,
    endDate: Date
  ): Promise<Result<{
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    byType: Record<NotificationType, {
      sent: number;
      delivered: number;
      opened: number;
      clicked: number;
    }>;
    byChannel: Record<NotificationChannel, {
      sent: number;
      delivered: number;
      opened: number;
      clicked: number;
    }>;
  }, Error>>;

  /**
   * Get system-wide notification analytics
   */
  getSystemNotificationAnalytics(
    startDate: Date,
    endDate: Date
  ): Promise<Result<{
    totalUsers: number;
    totalNotifications: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    topPerformingTypes: Array<{
      type: NotificationType;
      sent: number;
      openRate: number;
      clickRate: number;
    }>;
  }, Error>>;

  /**
   * Check service health and availability
   */
  healthCheck(): Promise<Result<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    channels: Record<NotificationChannel, 'healthy' | 'degraded' | 'unhealthy'>;
    latency: number;
  }, Error>>;
}