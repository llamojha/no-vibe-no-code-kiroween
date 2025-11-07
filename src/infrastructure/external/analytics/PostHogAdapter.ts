import { Result, success, failure } from '../../../shared/types/common';

/**
 * Configuration for PostHog analytics
 */
export interface PostHogConfig {
  apiKey: string;
  host?: string;
  timeout?: number;
  batchSize?: number;
  flushInterval?: number;
}

/**
 * Analytics event data
 */
export interface AnalyticsEvent {
  event: string;
  userId?: string;
  properties?: Record<string, any>;
  timestamp?: Date;
}

/**
 * User properties for analytics
 */
export interface UserProperties {
  userId: string;
  email?: string;
  name?: string;
  tier?: string;
  locale?: string;
  createdAt?: Date;
  [key: string]: any;
}

/**
 * Analytics service error
 */
export class AnalyticsError extends Error {
  constructor(
    message: string,
    public readonly originalError?: any,
    public readonly operation?: string
  ) {
    super(message);
    this.name = 'AnalyticsError';
  }
}

/**
 * PostHog adapter for analytics integration
 * Provides analytics tracking functionality for user actions and system events
 */
export class PostHogAdapter {
  private readonly config: PostHogConfig;
  private eventQueue: AnalyticsEvent[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(config: PostHogConfig) {
    this.config = {
      host: 'https://app.posthog.com',
      timeout: 5000,
      batchSize: 50,
      flushInterval: 30000, // 30 seconds
      ...config,
    };

    // Start periodic flush
    this.startPeriodicFlush();
  }

  /**
   * Track an analytics event
   */
  async trackEvent(event: AnalyticsEvent): Promise<Result<void, Error>> {
    try {
      // Validate event
      if (!event.event || event.event.trim().length === 0) {
        return failure(new AnalyticsError('Event name cannot be empty'));
      }

      // Add to queue
      this.eventQueue.push({
        ...event,
        timestamp: event.timestamp || new Date(),
      });

      // Flush if queue is full
      if (this.eventQueue.length >= (this.config.batchSize || 50)) {
        await this.flush();
      }

      return success(undefined);
    } catch (error) {
      return failure(new AnalyticsError(
        'Failed to track event',
        error,
        'track'
      ));
    }
  }

  /**
   * Track analysis creation
   */
  async trackAnalysisCreated(
    userId: string,
    analysisId: string,
    score: number,
    locale: string
  ): Promise<Result<void, Error>> {
    return this.trackEvent({
      event: 'analysis_created',
      userId,
      properties: {
        analysis_id: analysisId,
        score,
        locale,
        score_category: this.getScoreCategory(score),
      },
    });
  }

  /**
   * Track hackathon analysis creation
   */
  async trackHackathonAnalysisCreated(
    userId: string,
    analysisId: string,
    category: string,
    score: number
  ): Promise<Result<void, Error>> {
    return this.trackEvent({
      event: 'hackathon_analysis_created',
      userId,
      properties: {
        analysis_id: analysisId,
        hackathon_category: category,
        score,
        score_category: this.getScoreCategory(score),
      },
    });
  }

  /**
   * Track user registration
   */
  async trackUserRegistered(userId: string, email?: string, locale?: string): Promise<Result<void, Error>> {
    return this.trackEvent({
      event: 'user_registered',
      userId,
      properties: {
        email,
        locale,
        registration_method: 'direct',
      },
    });
  }

  /**
   * Track user login
   */
  async trackUserLogin(userId: string): Promise<Result<void, Error>> {
    return this.trackEvent({
      event: 'user_login',
      userId,
      properties: {
        login_method: 'supabase',
      },
    });
  }

  /**
   * Track audio feature usage
   */
  async trackAudioFeatureUsed(
    userId: string,
    feature: 'tts' | 'transcription',
    success: boolean,
    duration?: number
  ): Promise<Result<void, Error>> {
    return this.trackEvent({
      event: 'audio_feature_used',
      userId,
      properties: {
        feature,
        success,
        duration,
      },
    });
  }

  /**
   * Track error occurrence
   */
  async trackError(
    error: Error,
    context: string,
    userId?: string
  ): Promise<Result<void, Error>> {
    return this.trackEvent({
      event: 'error_occurred',
      userId,
      properties: {
        error_name: error.name,
        error_message: error.message,
        context,
        stack_trace: error.stack?.substring(0, 1000), // Limit stack trace length
      },
    });
  }

  /**
   * Set user properties
   */
  async setUserProperties(properties: UserProperties): Promise<Result<void, Error>> {
    try {
      // In a real implementation, this would call PostHog's identify API
      // For now, we'll track it as an event
      return this.trackEvent({
        event: '$identify',
        userId: properties.userId,
        properties: {
          $set: properties,
        },
      });
    } catch (error) {
      return failure(new AnalyticsError(
        'Failed to set user properties',
        error,
        'identify'
      ));
    }
  }

  /**
   * Track page view
   */
  async trackPageView(
    userId: string,
    page: string,
    properties?: Record<string, any>
  ): Promise<Result<void, Error>> {
    return this.trackEvent({
      event: '$pageview',
      userId,
      properties: {
        $current_url: page,
        ...properties,
      },
    });
  }

  /**
   * Track feature flag usage
   */
  async trackFeatureFlagUsed(
    userId: string,
    flagName: string,
    flagValue: boolean | string
  ): Promise<Result<void, Error>> {
    return this.trackEvent({
      event: 'feature_flag_used',
      userId,
      properties: {
        flag_name: flagName,
        flag_value: flagValue,
      },
    });
  }

  /**
   * Flush queued events to PostHog
   */
  async flush(): Promise<Result<void, Error>> {
    try {
      if (this.eventQueue.length === 0) {
        return success(undefined);
      }

      const eventsToFlush = [...this.eventQueue];
      this.eventQueue = [];

      // In a real implementation, this would send events to PostHog API
      // For now, we'll simulate the API call
      await this.sendEventsToPostHog(eventsToFlush);

      return success(undefined);
    } catch (error) {
      // Put events back in queue on failure
      this.eventQueue.unshift(...this.eventQueue);
      
      return failure(new AnalyticsError(
        'Failed to flush events to PostHog',
        error,
        'flush'
      ));
    }
  }

  /**
   * Get analytics configuration
   */
  getConfig(): PostHogConfig {
    return { ...this.config };
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    queueLength: number;
    isFlushTimerActive: boolean;
  } {
    return {
      queueLength: this.eventQueue.length,
      isFlushTimerActive: !!this.flushTimer,
    };
  }

  /**
   * Shutdown analytics adapter
   */
  async shutdown(): Promise<void> {
    // Clear flush timer
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }

    // Flush remaining events
    await this.flush();
  }

  /**
   * Start periodic flush of events
   */
  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(async () => {
      try {
        await this.flush();
      } catch (error) {
        console.error('Failed to flush analytics events:', error);
      }
    }, this.config.flushInterval);
  }

  /**
   * Send events to PostHog API
   */
  private async sendEventsToPostHog(events: AnalyticsEvent[]): Promise<void> {
    // Simulate API call - in real implementation, this would use PostHog's API
    const payload = {
      api_key: this.config.apiKey,
      batch: events.map(event => ({
        event: event.event,
        distinct_id: event.userId || 'anonymous',
        properties: {
          ...event.properties,
          timestamp: event.timestamp?.toISOString(),
        },
      })),
    };

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Log events in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics events sent:', payload);
    }
  }

  /**
   * Categorize score for analytics
   */
  private getScoreCategory(score: number): string {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    if (score >= 40) return 'low';
    return 'very_low';
  }

  /**
   * Create a configured PostHogAdapter instance
   */
  static create(apiKey?: string, config?: Partial<PostHogConfig>): PostHogAdapter {
    const key = apiKey || process.env.POSTHOG_API_KEY;
    if (!key) {
      throw new Error(
        'PostHog API key not provided. Set POSTHOG_API_KEY environment variable or pass it directly.'
      );
    }

    return new PostHogAdapter({
      apiKey: key,
      ...config,
    });
  }

  /**
   * Create a no-op adapter for testing or when analytics is disabled
   */
  static createNoOp(): PostHogAdapter {
    return new PostHogAdapter({
      apiKey: 'test-key',
    });
  }
}