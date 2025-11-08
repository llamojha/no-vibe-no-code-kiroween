import { describe, it, expect } from 'vitest';
import { Locale } from '../Locale';

describe('Locale Value Object', () => {
  describe('create', () => {
    it('should create English locale', () => {
      const locale = Locale.create('en');
      expect(locale.value).toBe('en');
    });

    it('should create Spanish locale', () => {
      const locale = Locale.create('es');
      expect(locale.value).toBe('es');
    });

    it('should normalize to lowercase', () => {
      const locale = Locale.create('EN');
      expect(locale.value).toBe('en');
    });

    it('should trim whitespace', () => {
      const locale = Locale.create('  es  ');
      expect(locale.value).toBe('es');
    });

    it('should throw error for empty locale', () => {
      expect(() => Locale.create('')).toThrow('Locale value cannot be empty');
    });

    it('should throw error for null locale', () => {
      expect(() => Locale.create(null as any)).toThrow('Locale value cannot be empty');
    });

    it('should throw error for undefined locale', () => {
      expect(() => Locale.create(undefined as any)).toThrow('Locale value cannot be empty');
    });

    it('should throw error for unsupported locale', () => {
      const unsupportedLocales = ['fr', 'de', 'it', 'pt', 'invalid'];
      
      unsupportedLocales.forEach(locale => {
        expect(() => Locale.create(locale))
          .toThrow(`Unsupported locale: ${locale}. Supported locales are: en, es`);
      });
    });
  });

  describe('reconstruct', () => {
    it('should reconstruct English locale', () => {
      const locale = Locale.reconstruct('en');
      expect(locale.value).toBe('en');
    });

    it('should reconstruct Spanish locale', () => {
      const locale = Locale.reconstruct('es');
      expect(locale.value).toBe('es');
    });
  });

  describe('static factory methods', () => {
    it('should create English locale with english()', () => {
      const locale = Locale.english();
      expect(locale.value).toBe('en');
      expect(locale.isEnglish).toBe(true);
    });

    it('should create Spanish locale with spanish()', () => {
      const locale = Locale.spanish();
      expect(locale.value).toBe('es');
      expect(locale.isSpanish).toBe(true);
    });
  });

  describe('getSupportedLocales', () => {
    it('should return all supported locales', () => {
      const supported = Locale.getSupportedLocales();
      expect(supported).toEqual(['en', 'es']);
    });
  });

  describe('properties', () => {
    describe('isEnglish', () => {
      it('should return true for English locale', () => {
        const locale = Locale.english();
        expect(locale.isEnglish).toBe(true);
        expect(locale.isSpanish).toBe(false);
      });

      it('should return false for Spanish locale', () => {
        const locale = Locale.spanish();
        expect(locale.isEnglish).toBe(false);
        expect(locale.isSpanish).toBe(true);
      });
    });

    describe('displayName', () => {
      it('should return "English" for en locale', () => {
        const locale = Locale.english();
        expect(locale.displayName).toBe('English');
      });

      it('should return "Español" for es locale', () => {
        const locale = Locale.spanish();
        expect(locale.displayName).toBe('Español');
      });
    });
  });

  describe('equals', () => {
    it('should return true for equal locales', () => {
      const locale1 = Locale.english();
      const locale2 = Locale.create('en');
      expect(locale1.equals(locale2)).toBe(true);
    });

    it('should return false for different locales', () => {
      const locale1 = Locale.english();
      const locale2 = Locale.spanish();
      expect(locale1.equals(locale2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      const locale = Locale.english();
      expect(locale.toString()).toBe('en');
    });
  });

  describe('toJSON', () => {
    it('should return string value for JSON serialization', () => {
      const locale = Locale.spanish();
      expect(locale.toJSON()).toBe('es');
    });
  });
});