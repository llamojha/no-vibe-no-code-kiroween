import { describe, it, expect } from 'vitest';
import { Category } from '../Category';

describe('Category Value Object', () => {
  describe('createGeneral', () => {
    it('should create valid general categories', () => {
      const validCategories = ['technology', 'business', 'market', 'innovation', 'feasibility'];
      
      validCategories.forEach(categoryValue => {
        const category = Category.createGeneral(categoryValue);
        expect(category.value).toBe(categoryValue);
        expect(category.type).toBe('general');
        expect(category.isGeneral).toBe(true);
        expect(category.isHackathon).toBe(false);
      });
    });

    it('should normalize to lowercase and trim', () => {
      const category = Category.createGeneral('  TECHNOLOGY  ');
      expect(category.value).toBe('technology');
    });

    it('should throw error for invalid general category', () => {
      const invalidCategories = ['invalid', 'random', 'unknown'];
      
      invalidCategories.forEach(categoryValue => {
        expect(() => Category.createGeneral(categoryValue))
          .toThrow(`Invalid general category: ${categoryValue}. Supported categories are: technology, business, market, innovation, feasibility`);
      });
    });
  });

  describe('createHackathon', () => {
    it('should create valid hackathon categories', () => {
      const validCategories = ['resurrection', 'frankenstein', 'skeleton-crew', 'costume-contest'];
      
      validCategories.forEach(categoryValue => {
        const category = Category.createHackathon(categoryValue);
        expect(category.value).toBe(categoryValue);
        expect(category.type).toBe('hackathon');
        expect(category.isHackathon).toBe(true);
        expect(category.isGeneral).toBe(false);
      });
    });

    it('should normalize to lowercase and trim', () => {
      const category = Category.createHackathon('  FRANKENSTEIN  ');
      expect(category.value).toBe('frankenstein');
    });

    it('should throw error for invalid hackathon category', () => {
      const invalidCategories = ['invalid', 'random', 'unknown'];
      
      invalidCategories.forEach(categoryValue => {
        expect(() => Category.createHackathon(categoryValue))
          .toThrow(`Invalid hackathon category: ${categoryValue}. Supported categories are: resurrection, frankenstein, skeleton-crew, costume-contest`);
      });
    });
  });

  describe('reconstruct', () => {
    it('should reconstruct general category', () => {
      const category = Category.reconstruct('technology', 'general');
      expect(category.value).toBe('technology');
      expect(category.type).toBe('general');
    });

    it('should reconstruct hackathon category', () => {
      const category = Category.reconstruct('frankenstein', 'hackathon');
      expect(category.value).toBe('frankenstein');
      expect(category.type).toBe('hackathon');
    });
  });

  describe('static getters', () => {
    it('should return all general categories', () => {
      const categories = Category.getGeneralCategories();
      expect(categories).toEqual(['technology', 'business', 'market', 'innovation', 'feasibility']);
    });

    it('should return all hackathon categories', () => {
      const categories = Category.getHackathonCategories();
      expect(categories).toEqual(['resurrection', 'frankenstein', 'skeleton-crew', 'costume-contest']);
    });
  });

  describe('displayName', () => {
    it('should return proper display names for hackathon categories', () => {
      expect(Category.createHackathon('resurrection').displayName).toBe('Resurrection');
      expect(Category.createHackathon('frankenstein').displayName).toBe('Frankenstein');
      expect(Category.createHackathon('skeleton-crew').displayName).toBe('Skeleton Crew');
      expect(Category.createHackathon('costume-contest').displayName).toBe('Costume Contest');
    });

    it('should return proper display names for general categories', () => {
      expect(Category.createGeneral('technology').displayName).toBe('Technology');
      expect(Category.createGeneral('business').displayName).toBe('Business');
      expect(Category.createGeneral('market').displayName).toBe('Market');
      expect(Category.createGeneral('innovation').displayName).toBe('Innovation');
      expect(Category.createGeneral('feasibility').displayName).toBe('Feasibility');
    });
  });

  describe('equals', () => {
    it('should return true for equal categories', () => {
      const category1 = Category.createGeneral('technology');
      const category2 = Category.createGeneral('technology');
      expect(category1.equals(category2)).toBe(true);
    });

    it('should return false for different values', () => {
      const category1 = Category.createGeneral('technology');
      const category2 = Category.createGeneral('business');
      expect(category1.equals(category2)).toBe(false);
    });

    it('should return false for different types', () => {
      const category1 = Category.reconstruct('technology', 'general');
      const category2 = Category.reconstruct('technology', 'hackathon');
      expect(category1.equals(category2)).toBe(false);
    });

    it('should return true for equal hackathon categories', () => {
      const category1 = Category.createHackathon('frankenstein');
      const category2 = Category.createHackathon('frankenstein');
      expect(category1.equals(category2)).toBe(true);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      const category = Category.createGeneral('technology');
      expect(category.toString()).toBe('technology');
    });
  });

  describe('toJSON', () => {
    it('should return JSON representation with value and type', () => {
      const category = Category.createHackathon('frankenstein');
      expect(category.toJSON()).toEqual({
        value: 'frankenstein',
        type: 'hackathon'
      });
    });

    it('should return JSON representation for general category', () => {
      const category = Category.createGeneral('technology');
      expect(category.toJSON()).toEqual({
        value: 'technology',
        type: 'general'
      });
    });
  });
});