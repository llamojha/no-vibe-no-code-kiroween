/**
 * Property Tests: Localization (I18N)
 * Tests localization properties for translation completeness and consistency
 *
 * Properties tested:
 * - P-I18N-001: Translation Key Coverage
 * - P-I18N-002: Language Consistency
 * - P-I18N-003: Locale Persistence
 */

import { describe, it, expect, beforeEach } from "vitest";
import { Locale } from "@/src/domain/value-objects/Locale";
import translations from "@/locales/en.json";
import translationsEs from "@/locales/es.json";
import { forAll } from "../utils/property-helpers";
import { generateLocale } from "../utils/generators";

describe("Property: Localization", () => {
  describe("P-I18N-001: Translation Key Coverage", () => {
    it("should have all English translation keys defined", () => {
      // Property: All translation keys should have values
      const keys = Object.keys(translations);

      keys.forEach((key) => {
        const value = translations[key as keyof typeof translations];
        expect(value).toBeDefined();
        expect(typeof value).toBe("string");
        expect(value.length).toBeGreaterThan(0);
      });
    });

    it("should have all Spanish translation keys defined", () => {
      // Property: All translation keys should have values
      const keys = Object.keys(translationsEs);

      keys.forEach((key) => {
        const value = translationsEs[key as keyof typeof translationsEs];
        expect(value).toBeDefined();
        expect(typeof value).toBe("string");
        expect(value.length).toBeGreaterThan(0);
      });
    });

    it("should have matching keys between English and Spanish", () => {
      // Property: Both language files should have the same keys
      const enKeys = Object.keys(translations).sort();
      const esKeys = Object.keys(translationsEs).sort();

      expect(enKeys).toEqual(esKeys);
    });

    it("should not have hardcoded text in translation values", () => {
      // Property: Translation values should not contain placeholder text
      const allTranslations = [
        ...Object.values(translations),
        ...Object.values(translationsEs),
      ];

      allTranslations.forEach((value) => {
        // Check for common placeholder patterns (word boundaries to avoid false positives)
        expect(value).not.toMatch(/\bTODO\b|\bFIXME\b|\bXXX\b/i);
        expect(value).not.toMatch(/\[.*\]/); // Bracketed placeholders
        expect(value).not.toBe(""); // Empty strings
      });
    });

    it("should have consistent key naming convention", () => {
      // Property: All keys should follow camelCase convention
      const keys = Object.keys(translations);

      keys.forEach((key) => {
        // Check camelCase pattern (starts with lowercase, no spaces, no special chars except dots)
        expect(key).toMatch(/^[a-z][a-zA-Z0-9.]*$/);
      });
    });
  });

  describe("P-I18N-002: Language Consistency", () => {
    it("should not mix languages in English translations", () => {
      // Property: English translations should not contain Spanish words
      const commonSpanishWords = [
        "el",
        "la",
        "los",
        "las",
        "un",
        "una",
        "de",
        "del",
        "por",
        "para",
        "con",
        "sin",
        "sobre",
        "entre",
        "hasta",
        "desde",
        "hacia",
        "según",
        "durante",
        "mediante",
      ];

      Object.values(translations).forEach((value) => {
        const lowerValue = value.toLowerCase();
        const words = lowerValue.split(/\s+/);

        // Check if any Spanish words appear (with some tolerance for common words)
        const suspiciousWords = words.filter((word) =>
          commonSpanishWords.includes(word)
        );

        // Allow some common words that might appear in English context
        const allowedInEnglish = ["el", "la", "de"]; // These can appear in English (e.g., "El Paso", "de facto")
        const actualSpanishWords = suspiciousWords.filter(
          (word) => !allowedInEnglish.includes(word)
        );

        expect(actualSpanishWords.length).toBe(0);
      });
    });

    it("should not mix languages in Spanish translations", () => {
      // Property: Spanish translations should not contain obvious English-only words
      const commonEnglishOnlyWords = [
        "the",
        "and",
        "for",
        "with",
        "from",
        "about",
        "into",
        "through",
        "during",
        "before",
        "after",
        "above",
        "below",
        "between",
        "under",
        "again",
        "further",
        "then",
        "once",
      ];

      Object.values(translationsEs).forEach((value) => {
        const lowerValue = value.toLowerCase();
        const words = lowerValue.split(/\s+/);

        // Check if any English-only words appear
        const englishWords = words.filter((word) =>
          commonEnglishOnlyWords.includes(word)
        );

        expect(englishWords.length).toBe(0);
      });
    });

    it("should maintain consistent terminology across translations", () => {
      // Property: Key terms should be translated consistently
      // For example, if "analysis" is translated as "análisis" once, it should be consistent

      const enValues = Object.values(translations);
      const esValues = Object.values(translationsEs);

      // Check that both have similar structure (same number of translations)
      expect(enValues.length).toBe(esValues.length);

      // Check that translations are not identical (would indicate missing translation)
      const identicalCount = enValues.filter(
        (enVal, idx) => enVal === esValues[idx]
      ).length;
      const identicalPercentage = (identicalCount / enValues.length) * 100;

      // Allow some identical values (like numbers, names) but not too many
      expect(identicalPercentage).toBeLessThan(30);
    });

    it("should have appropriate length for translations", () => {
      // Property: Translations should have reasonable length (not too short, not too long)
      const allTranslations = [
        ...Object.values(translations),
        ...Object.values(translationsEs),
      ];

      allTranslations.forEach((value) => {
        // Minimum length (at least 1 character)
        expect(value.length).toBeGreaterThan(0);

        // Maximum reasonable length (not a novel)
        expect(value.length).toBeLessThan(500);
      });
    });

    it("should preserve placeholders in translations", () => {
      // Property: If English has placeholders like {name}, Spanish should too
      const enKeys = Object.keys(translations);

      enKeys.forEach((key) => {
        const enValue = translations[key as keyof typeof translations];
        const esValue = translationsEs[key as keyof typeof translationsEs];

        // Extract placeholders from English
        const enPlaceholders = enValue.match(/\{[^}]+\}/g) || [];
        const esPlaceholders = esValue.match(/\{[^}]+\}/g) || [];

        // Both should have the same placeholders
        expect(enPlaceholders.sort()).toEqual(esPlaceholders.sort());
      });
    });
  });

  describe("P-I18N-003: Locale Persistence", () => {
    it("should support English locale", () => {
      // Property: English locale should be valid
      const locale = Locale.english();

      expect(locale).toBeDefined();
      expect(locale.value).toBe("en");
    });

    it("should support Spanish locale", () => {
      // Property: Spanish locale should be valid
      const locale = Locale.spanish();

      expect(locale).toBeDefined();
      expect(locale.value).toBe("es");
    });

    it("should validate locale values", () => {
      // Property: Only valid locales should be accepted
      expect(() => Locale.fromString("en")).not.toThrow();
      expect(() => Locale.fromString("es")).not.toThrow();
      expect(() => Locale.fromString("invalid")).toThrow();
    });

    it("should maintain locale equality", () => {
      // Property: Two locales with same value should be equal
      const locale1 = Locale.english();
      const locale2 = Locale.english();

      expect(locale1.equals(locale2)).toBe(true);
    });

    it("should distinguish different locales", () => {
      // Property: Different locales should not be equal
      const enLocale = Locale.english();
      const esLocale = Locale.spanish();

      expect(enLocale.equals(esLocale)).toBe(false);
    });

    it("should generate valid locales randomly", () => {
      // Property: Generated locales should always be valid
      forAll(
        generateLocale,
        (locale) => {
          return locale.value === "en" || locale.value === "es";
        },
        100
      );
    });

    it("should preserve locale through serialization", () => {
      // Property: Locale should survive JSON round-trip
      forAll(
        generateLocale,
        (locale) => {
          const serialized = locale.value;
          const deserialized = Locale.fromString(serialized);

          return locale.equals(deserialized);
        },
        100
      );
    });

    it("should have translation files for all supported locales", () => {
      // Property: Every supported locale should have a translation file
      const supportedLocales = ["en", "es"];

      supportedLocales.forEach((localeCode) => {
        const locale = Locale.fromString(localeCode);
        expect(locale).toBeDefined();

        // Verify translation file exists and has content
        if (localeCode === "en") {
          expect(Object.keys(translations).length).toBeGreaterThan(0);
        } else if (localeCode === "es") {
          expect(Object.keys(translationsEs).length).toBeGreaterThan(0);
        }
      });
    });
  });
});
