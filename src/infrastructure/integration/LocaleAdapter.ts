import { Locale } from '@/src/domain/value-objects/Locale';

/**
 * Adapter to integrate the existing internationalization system with hexagonal architecture
 * Provides a clean interface for the application layer to handle localization
 */
export class LocaleAdapter {
  private static instance: LocaleAdapter;

  private constructor() {}

  static getInstance(): LocaleAdapter {
    if (!LocaleAdapter.instance) {
      LocaleAdapter.instance = new LocaleAdapter();
    }
    return LocaleAdapter.instance;
  }

  /**
   * Convert string locale to domain Locale value object
   */
  toDomainLocale(localeString: string): Locale {
    return Locale.fromString(localeString);
  }

  /**
   * Convert domain Locale to string for external systems
   */
  fromDomainLocale(locale: Locale): string {
    return locale.value;
  }

  /**
   * Get supported locales
   */
  getSupportedLocales(): string[] {
    return ['en', 'es'];
  }

  /**
   * Check if locale is supported
   */
  isSupported(localeString: string): boolean {
    return this.getSupportedLocales().includes(localeString);
  }

  /**
   * Get default locale
   */
  getDefaultLocale(): Locale {
    return Locale.fromString('en');
  }

  /**
   * Normalize locale string (handle variations like 'en-US' -> 'en')
   */
  normalizeLocale(localeString: string): string {
    const normalized = localeString.toLowerCase().split('-')[0];
    return this.isSupported(normalized) ? normalized : 'en';
  }

  /**
   * Get locale from browser/request headers
   */
  getLocaleFromHeaders(acceptLanguage?: string): Locale {
    if (!acceptLanguage) {
      return this.getDefaultLocale();
    }

    // Parse Accept-Language header
    const languages = acceptLanguage
      .split(',')
      .map(lang => {
        const [code, q = '1'] = lang.trim().split(';q=');
        return { code: this.normalizeLocale(code), quality: parseFloat(q) };
      })
      .sort((a, b) => b.quality - a.quality);

    // Find first supported language
    for (const lang of languages) {
      if (this.isSupported(lang.code)) {
        return Locale.fromString(lang.code);
      }
    }

    return this.getDefaultLocale();
  }

  /**
   * Get locale configuration for client-side use
   */
  getClientLocaleConfig() {
    return {
      supportedLocales: this.getSupportedLocales(),
      defaultLocale: this.getDefaultLocale().value,
    };
  }

  /**
   * Validate and sanitize locale input
   */
  validateLocale(localeString: string): { isValid: boolean; locale: Locale; error?: string } {
    try {
      const normalized = this.normalizeLocale(localeString);
      const locale = Locale.fromString(normalized);
      return { isValid: true, locale };
    } catch (error) {
      return {
        isValid: false,
        locale: this.getDefaultLocale(),
        error: error instanceof Error ? error.message : 'Invalid locale',
      };
    }
  }
}

/**
 * Convenience function to get locale adapter instance
 */
export function getLocaleAdapter(): LocaleAdapter {
  return LocaleAdapter.getInstance();
}

/**
 * Locale utilities for use in application layer
 */
export const localeUtils = {
  /**
   * Get locale from request headers
   */
  getRequestLocale(request: Request): Locale {
    const adapter = getLocaleAdapter();
    const acceptLanguage = request.headers.get('accept-language') || undefined;
    return adapter.getLocaleFromHeaders(acceptLanguage);
  },

  /**
   * Create locale-aware response headers
   */
  createLocaleHeaders(locale: Locale): Record<string, string> {
    return {
      'Content-Language': locale.value,
    };
  },

  /**
   * Validate locale from form data or query params
   */
  validateFormLocale(localeString: string | null): Locale {
    const adapter = getLocaleAdapter();
    if (!localeString) {
      return adapter.getDefaultLocale();
    }
    const validation = adapter.validateLocale(localeString);
    return validation.locale;
  },
};