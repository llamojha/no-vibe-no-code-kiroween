import { 
  INotificationService, 
  NotificationData, 
  NotificationResult, 
  NotificationAnalytics,
  NotificationType,
  NotificationChannel
} from './INotificationService';
import { UserId, Locale } from '../../domain/value-objects';
import { Result, success, failure } from '../../shared/types/common';

/**
 * Configuration for notification service
 */
export interface NotificationConfig {
  emailProvider: 'sendgrid' | 'ses' | 'mailgun';
  pushProvider: 'firebase' | 'apns' | 'onesignal';
  smsProvider: 'twilio' | 'sns';
  apiKeys: {
    sendgrid?: string;
    ses?: {
      accessKeyId: string;
      secretAccessKey: string;
      region: string;
    };
    firebase?: string;
    twilio?: {
      accountSid: string;
      authToken: string;
    };
  };
  defaultFromEmail: string;
  defaultFromName: string;
  timeout: number;
  maxRetries: number;
  rateLimits: {
    email: number; // per minute
    push: number;  // per minute
    sms: number;   // per minute
  };
}

/**
 * Notification service implementation
 * Handles multi-channel notifications with analytics and preferences
 */
export class NotificationService implements INotificationService {
  private notificationQueue: Map<string, NotificationData> = new Map();
  private analytics: NotificationAnalytics[] = [];

  constructor(
    private readonly config: NotificationConfig
  ) {}

  /**
   * Send notification to a user
   */
  async sendNotification(
    userId: UserId,
    notification: NotificationData,
    locale: Locale
  ): Promise<Result<NotificationResult, Error>> {
    try {
      // Get user preferences
      const preferencesResult = await this.getUserNotificationPreferences(userId);
      
      if (!preferencesResult.success) {
        return failure(preferencesResult.error);
      }

      const preferences = preferencesResult.data;

      // Filter channels based on user preferences
      const allowedChannels = notification.channels.filter(channel => 
        preferences.channels.includes(channel)
      );

      if (allowedChannels.length === 0) {
        return failure(new Error('No allowed channels for this user'));
      }

      // Check if notification type is allowed
      if (!preferences.types.includes(notification.type)) {
        return failure(new Error('Notification type not allowed for this user'));
      }

      // Check quiet hours
      if (this.isInQuietHours(preferences.quietHours)) {
        // Schedule for later if in quiet hours
        const scheduledFor = this.calculateNextDeliveryTime(preferences.quietHours);
        return this.scheduleNotification(userId, notification, scheduledFor, locale);
      }

      // Generate notification ID
      const notificationId = this.generateNotificationId();

      // Send to each allowed channel
      const sentChannels: NotificationChannel[] = [];
      const failedChannels: Array<{ channel: NotificationChannel; error: string }> = [];

      for (const channel of allowedChannels) {
        try {
          const channelResult = await this.sendToChannel(
            userId,
            notification,
            channel,
            locale
          );

          if (channelResult.success) {
            sentChannels.push(channel);
          } else {
            failedChannels.push({
              channel,
              error: channelResult.error.message
            });
          }
        } catch (error) {
          failedChannels.push({
            channel,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Track analytics
      await this.trackNotificationEvent({
        notificationId,
        userId,
        type: notification.type,
        channel: sentChannels[0], // Track primary channel
        status: 'delivered',
        timestamp: new Date()
      });

      const result: NotificationResult = {
        notificationId,
        status: sentChannels.length > 0 ? 'sent' : 'failed',
        sentChannels,
        failedChannels,
        sentAt: new Date()
      };

      return success(result);

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Unknown error sending notification'));
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendBulkNotification(
    userIds: UserId[],
    notification: NotificationData,
    locale: Locale
  ): Promise<Result<Array<{ userId: UserId; result: NotificationResult }>, Error>> {
    try {
      const results: Array<{ userId: UserId; result: NotificationResult }> = [];

      // Process in batches to avoid overwhelming the system
      const batchSize = 50;
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (userId) => {
          const result = await this.sendNotification(userId, notification, locale);
          return {
            userId,
            result: result.success ? result.data : {
              notificationId: this.generateNotificationId(),
              status: 'failed' as const,
              sentChannels: [],
              failedChannels: [{ channel: 'email' as const, error: result.error.message }]
            }
          };
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Add delay between batches to respect rate limits
        if (i + batchSize < userIds.length) {
          await this.delay(1000);
        }
      }

      return success(results);

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Unknown error in bulk notification'));
    }
  }

  /**
   * Schedule notification for later delivery
   */
  async scheduleNotification(
    userId: UserId,
    notification: NotificationData,
    scheduledFor: Date,
    locale: Locale
  ): Promise<Result<NotificationResult, Error>> {
    try {
      const notificationId = this.generateNotificationId();

      // Store in queue (in real implementation, this would be in a persistent queue)
      this.notificationQueue.set(notificationId, {
        ...notification,
        scheduledFor
      });

      // In real implementation, you would set up a job scheduler here
      setTimeout(async () => {
        await this.sendNotification(userId, notification, locale);
        this.notificationQueue.delete(notificationId);
      }, scheduledFor.getTime() - Date.now());

      const result: NotificationResult = {
        notificationId,
        status: 'scheduled',
        sentChannels: [],
        failedChannels: [],
        scheduledFor
      };

      return success(result);

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Unknown error scheduling notification'));
    }
  }

  /**
   * Cancel scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<Result<boolean, Error>> {
    try {
      const wasScheduled = this.notificationQueue.has(notificationId);
      this.notificationQueue.delete(notificationId);
      
      return success(wasScheduled);

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Unknown error canceling notification'));
    }
  }

  /**
   * Get user's notification preferences
   */
  async getUserNotificationPreferences(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    userId: UserId
  ): Promise<Result<{
    channels: NotificationChannel[];
    types: NotificationType[];
    frequency: 'immediate' | 'daily' | 'weekly';
    quietHours?: {
      start: string;
      end: string;
      timezone: string;
    };
  }, Error>> {
    try {
      // In real implementation, this would fetch from database
      // For now, return default preferences
      const preferences = {
        channels: ['email', 'in_app'] as NotificationChannel[],
        types: [
          'analysis_completed',
          'hackathon_submission',
          'leaderboard_update',
          'welcome'
        ] as NotificationType[],
        frequency: 'immediate' as const,
        quietHours: {
          start: '22:00',
          end: '08:00',
          timezone: 'UTC'
        }
      };

      return success(preferences);

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Error getting preferences'));
    }
  }

  /**
   * Update user's notification preferences
   */
  async updateUserNotificationPreferences(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _userId: UserId,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _preferences: {
      channels?: NotificationChannel[];
      types?: NotificationType[];
      frequency?: 'immediate' | 'daily' | 'weekly';
      quietHours?: {
        start: string;
        end: string;
        timezone: string;
      };
    }
  ): Promise<Result<boolean, Error>> {
    try {
      // In real implementation, this would update the database
      // For now, just simulate success
      return success(true);

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Error updating preferences'));
    }
  }

  /**
   * Track notification analytics
   */
  async trackNotificationEvent(analytics: NotificationAnalytics): Promise<Result<boolean, Error>> {
    try {
      // Store analytics (in real implementation, this would go to analytics database)
      this.analytics.push(analytics);
      return success(true);

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Error tracking analytics'));
    }
  }

  /**
   * Get notification analytics for a user
   */
  async getUserNotificationAnalytics(
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
  }, Error>> {
    try {
      // Filter analytics for user and date range
      const userAnalytics = this.analytics.filter(a => 
        a.userId.equals(userId) &&
        a.timestamp >= startDate &&
        a.timestamp <= endDate
      );

      // Calculate metrics
      const totalSent = userAnalytics.length;
      const totalDelivered = userAnalytics.filter(a => a.status === 'delivered').length;
      const totalOpened = userAnalytics.filter(a => a.status === 'opened').length;
      const totalClicked = userAnalytics.filter(a => a.status === 'clicked').length;

      // Group by type and channel (simplified implementation)
      const byType = {} as Record<NotificationType, { sent: number; delivered: number; opened: number; clicked: number }>;
      const byChannel = {} as Record<NotificationChannel, { sent: number; delivered: number; opened: number; clicked: number }>;

      const result = {
        totalSent,
        totalDelivered,
        totalOpened,
        totalClicked,
        byType,
        byChannel
      };

      return success(result);

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Error getting user analytics'));
    }
  }

  /**
   * Get system-wide notification analytics
   */
  async getSystemNotificationAnalytics(
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
  }, Error>> {
    try {
      // Filter analytics for date range
      const periodAnalytics = this.analytics.filter(a => 
        a.timestamp >= startDate &&
        a.timestamp <= endDate
      );

      const totalUsers = new Set(periodAnalytics.map(a => a.userId.value)).size;
      const totalNotifications = periodAnalytics.length;
      const delivered = periodAnalytics.filter(a => a.status === 'delivered').length;
      const opened = periodAnalytics.filter(a => a.status === 'opened').length;
      const clicked = periodAnalytics.filter(a => a.status === 'clicked').length;

      const result = {
        totalUsers,
        totalNotifications,
        deliveryRate: totalNotifications > 0 ? delivered / totalNotifications : 0,
        openRate: delivered > 0 ? opened / delivered : 0,
        clickRate: opened > 0 ? clicked / opened : 0,
        topPerformingTypes: [] // Simplified for now
      };

      return success(result);

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Error getting system analytics'));
    }
  }

  /**
   * Check service health and availability
   */
  async healthCheck(): Promise<Result<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    channels: Record<NotificationChannel, 'healthy' | 'degraded' | 'unhealthy'>;
    latency: number;
  }, Error>> {
    try {
      const startTime = Date.now();

      // Test each channel
      const channels: Record<NotificationChannel, 'healthy' | 'degraded' | 'unhealthy'> = {
        email: 'healthy',
        push: 'healthy',
        in_app: 'healthy',
        sms: 'healthy'
      };

      const latency = Date.now() - startTime;
      const status = latency < 1000 ? 'healthy' : 'degraded';

      return success({
        status,
        channels,
        latency
      });

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Health check failed'));
    }
  }

  /**
   * Send notification to specific channel
   */
  private async sendToChannel(
    userId: UserId,
    notification: NotificationData,
    channel: NotificationChannel,
    locale: Locale
  ): Promise<Result<boolean, Error>> {
    try {
      // Simulate channel-specific sending
      await this.delay(100 + Math.random() * 200);

      switch (channel) {
        case 'email':
          return this.sendEmail(userId, notification, locale);
        case 'push':
          return this.sendPush(userId, notification, locale);
        case 'in_app':
          return this.sendInApp(userId, notification, locale);
        case 'sms':
          return this.sendSMS(userId, notification, locale);
        default:
          return failure(new Error(`Unsupported channel: ${channel}`));
      }

    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Channel send error'));
    }
  }

  /**
   * Send email notification
   */
  private async sendEmail(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _userId: UserId,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _notification: NotificationData,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _locale: Locale
  ): Promise<Result<boolean, Error>> {
    // Simulate email sending
    await this.delay(200);
    return success(true);
  }

  /**
   * Send push notification
   */
  private async sendPush(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _userId: UserId,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _notification: NotificationData,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _locale: Locale
  ): Promise<Result<boolean, Error>> {
    // Simulate push sending
    await this.delay(100);
    return success(true);
  }

  /**
   * Send in-app notification
   */
  private async sendInApp(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _userId: UserId,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _notification: NotificationData,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _locale: Locale
  ): Promise<Result<boolean, Error>> {
    // Simulate in-app notification
    await this.delay(50);
    return success(true);
  }

  /**
   * Send SMS notification
   */
  private async sendSMS(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _userId: UserId,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _notification: NotificationData,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _locale: Locale
  ): Promise<Result<boolean, Error>> {
    // Simulate SMS sending
    await this.delay(300);
    return success(true);
  }

  /**
   * Check if current time is in quiet hours
   */
  private isInQuietHours(quietHours?: {
    start: string;
    end: string;
    timezone: string;
  }): boolean {
    if (!quietHours) return false;

    // Simplified implementation - in real app would handle timezones properly
    const now = new Date();
    const currentHour = now.getHours();
    const startHour = parseInt(quietHours.start.split(':')[0]);
    const endHour = parseInt(quietHours.end.split(':')[0]);

    if (startHour <= endHour) {
      return currentHour >= startHour && currentHour < endHour;
    } else {
      return currentHour >= startHour || currentHour < endHour;
    }
  }

  /**
   * Calculate next delivery time after quiet hours
   */
  private calculateNextDeliveryTime(quietHours?: {
    start: string;
    end: string;
    timezone: string;
  }): Date {
    const now = new Date();
    
    if (!quietHours) return now;

    const endHour = parseInt(quietHours.end.split(':')[0]);
    const endMinute = parseInt(quietHours.end.split(':')[1]);

    const nextDelivery = new Date(now);
    nextDelivery.setHours(endHour, endMinute, 0, 0);

    // If end time is tomorrow
    if (nextDelivery <= now) {
      nextDelivery.setDate(nextDelivery.getDate() + 1);
    }

    return nextDelivery;
  }

  /**
   * Generate unique notification ID
   */
  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}