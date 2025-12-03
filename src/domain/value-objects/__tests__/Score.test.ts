import { describe, it, expect } from 'vitest';
import { Score } from '../Score';

describe('Score Value Object', () => {
  describe('create', () => {
    it('should create score with valid value', () => {
      const score = Score.create(85);
      expect(score.value).toBe(85);
    });

    it('should create score with minimum value (0)', () => {
      const score = Score.create(0);
      expect(score.value).toBe(0);
    });

    it('should create score with maximum value (100)', () => {
      const score = Score.create(100);
      expect(score.value).toBe(100);
    });

    it('should round decimal values to 2 decimal places', () => {
      const score = Score.create(85.123456);
      expect(score.value).toBe(85.12);
    });

    it('should throw error for negative values', () => {
      expect(() => Score.create(-1)).toThrow('Score must be between 0 and 100 inclusive');
    });

    it('should throw error for values over 100', () => {
      expect(() => Score.create(101)).toThrow('Score must be between 0 and 100 inclusive');
    });

    it('should throw error for NaN', () => {
      expect(() => Score.create(NaN)).toThrow('Score must be a valid number');
    });

    it('should throw error for non-numeric values', () => {
      expect(() => Score.create('85' as any)).toThrow('Score must be a valid number');
    });
  });

  describe('reconstruct', () => {
    it('should reconstruct score from persistence', () => {
      const score = Score.reconstruct(75);
      expect(score.value).toBe(75);
    });
  });

  describe('equals', () => {
    it('should return true for equal scores', () => {
      const score1 = Score.create(85);
      const score2 = Score.create(85);
      expect(score1.equals(score2)).toBe(true);
    });

    it('should return false for different scores', () => {
      const score1 = Score.create(85);
      const score2 = Score.create(90);
      expect(score1.equals(score2)).toBe(false);
    });
  });

  describe('compareTo', () => {
    it('should return negative when this score is lower', () => {
      const score1 = Score.create(75);
      const score2 = Score.create(85);
      expect(score1.compareTo(score2)).toBeLessThan(0);
    });

    it('should return positive when this score is higher', () => {
      const score1 = Score.create(85);
      const score2 = Score.create(75);
      expect(score1.compareTo(score2)).toBeGreaterThan(0);
    });

    it('should return zero when scores are equal', () => {
      const score1 = Score.create(85);
      const score2 = Score.create(85);
      expect(score1.compareTo(score2)).toBe(0);
    });
  });

  describe('isHigherThan', () => {
    it('should return true when this score is higher', () => {
      const score1 = Score.create(85);
      const score2 = Score.create(75);
      expect(score1.isHigherThan(score2)).toBe(true);
    });

    it('should return false when this score is lower', () => {
      const score1 = Score.create(75);
      const score2 = Score.create(85);
      expect(score1.isHigherThan(score2)).toBe(false);
    });

    it('should return false when scores are equal', () => {
      const score1 = Score.create(85);
      const score2 = Score.create(85);
      expect(score1.isHigherThan(score2)).toBe(false);
    });
  });

  describe('isLowerThan', () => {
    it('should return true when this score is lower', () => {
      const score1 = Score.create(75);
      const score2 = Score.create(85);
      expect(score1.isLowerThan(score2)).toBe(true);
    });

    it('should return false when this score is higher', () => {
      const score1 = Score.create(85);
      const score2 = Score.create(75);
      expect(score1.isLowerThan(score2)).toBe(false);
    });

    it('should return false when scores are equal', () => {
      const score1 = Score.create(85);
      const score2 = Score.create(85);
      expect(score1.isLowerThan(score2)).toBe(false);
    });
  });

  describe('toPercentage', () => {
    it('should return percentage string', () => {
      const score = Score.create(85);
      expect(score.toPercentage()).toBe('85%');
    });

    it('should handle decimal values', () => {
      const score = Score.create(85.5);
      expect(score.toPercentage()).toBe('85.5%');
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      const score = Score.create(85);
      expect(score.toString()).toBe('85');
    });
  });

  describe('toJSON', () => {
    it('should return numeric value for JSON serialization', () => {
      const score = Score.create(85);
      expect(score.toJSON()).toBe(85);
    });
  });
});