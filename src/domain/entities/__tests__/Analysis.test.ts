import { describe, it, expect, beforeEach } from 'vitest';
import { Analysis, CreateAnalysisProps, ReconstructAnalysisProps } from '../Analysis';
import { AnalysisId } from '../../value-objects/AnalysisId';
import { UserId } from '../../value-objects/UserId';
import { Score } from '../../value-objects/Score';
import { Locale } from '../../value-objects/Locale';
import { Category } from '../../value-objects/Category';
import { BusinessRuleViolationError, InvariantViolationError } from '../../../shared/types/errors';

describe('Analysis Entity', () => {
  const validProps: CreateAnalysisProps = {
    idea: 'A revolutionary startup idea that will change the world',
    userId: UserId.generate(),
    score: Score.create(85),
    locale: Locale.english(),
    category: Category.createGeneral('technology'),
    feedback: 'Great idea with strong market potential',
    suggestions: ['Consider market research', 'Validate with users']
  };

  describe('create', () => {
    it('should create analysis with valid data', () => {
      const analysis = Analysis.create(validProps);
      
      expect(analysis.id).toBeDefined();
      expect(analysis.idea).toBe(validProps.idea);
      expect(analysis.userId.equals(validProps.userId)).toBe(true);
      expect(analysis.score.equals(validProps.score)).toBe(true);
      expect(analysis.locale.equals(validProps.locale)).toBe(true);
      expect(analysis.category?.equals(validProps.category!)).toBe(true);
      expect(analysis.feedback).toBe(validProps.feedback);
      expect(analysis.suggestions).toEqual(validProps.suggestions);
      expect(analysis.createdAt).toBeInstanceOf(Date);
      expect(analysis.updatedAt).toBeInstanceOf(Date);
    });

    it('should create analysis with minimal required data', () => {
      const minimalProps: CreateAnalysisProps = {
        idea: 'A simple startup idea',
        userId: UserId.generate(),
        score: Score.create(50),
        locale: Locale.spanish()
      };

      const analysis = Analysis.create(minimalProps);
      
      expect(analysis.id).toBeDefined();
      expect(analysis.idea).toBe(minimalProps.idea);
      expect(analysis.category).toBeUndefined();
      expect(analysis.feedback).toBeUndefined();
      expect(analysis.suggestions).toEqual([]);
    });

    it('should throw error for empty idea', () => {
      const invalidProps = { ...validProps, idea: '' };
      
      expect(() => Analysis.create(invalidProps)).toThrow(InvariantViolationError);
      expect(() => Analysis.create(invalidProps)).toThrow('Analysis idea cannot be empty');
    });

    it('should throw error for idea too short', () => {
      const invalidProps = { ...validProps, idea: 'Short' };
      
      expect(() => Analysis.create(invalidProps)).toThrow(InvariantViolationError);
      expect(() => Analysis.create(invalidProps)).toThrow('Analysis idea must be at least 10 characters long');
    });

    it('should throw error for idea too long', () => {
      const invalidProps = { ...validProps, idea: 'x'.repeat(5001) };
      
      expect(() => Analysis.create(invalidProps)).toThrow(InvariantViolationError);
      expect(() => Analysis.create(invalidProps)).toThrow('Analysis idea cannot exceed 5000 characters');
    });

    it('should throw error for feedback too long', () => {
      const invalidProps = { ...validProps, feedback: 'x'.repeat(10001) };
      
      expect(() => Analysis.create(invalidProps)).toThrow(InvariantViolationError);
      expect(() => Analysis.create(invalidProps)).toThrow('Analysis feedback cannot exceed 10000 characters');
    });

    it('should throw error for too many suggestions', () => {
      const invalidProps = { ...validProps, suggestions: Array(51).fill('suggestion') };
      
      expect(() => Analysis.create(invalidProps)).toThrow(InvariantViolationError);
      expect(() => Analysis.create(invalidProps)).toThrow('Analysis cannot have more than 50 suggestions');
    });
  });

  describe('reconstruct', () => {
    it('should reconstruct analysis from persistence data', () => {
      const reconstructProps: ReconstructAnalysisProps = {
        ...validProps,
        id: AnalysisId.generate(),
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02')
      };

      const analysis = Analysis.reconstruct(reconstructProps);
      
      expect(analysis.id.equals(reconstructProps.id)).toBe(true);
      expect(analysis.createdAt).toEqual(reconstructProps.createdAt);
      expect(analysis.updatedAt).toEqual(reconstructProps.updatedAt);
    });
  });

  describe('business methods', () => {
    let analysis: Analysis;

    beforeEach(() => {
      analysis = Analysis.create(validProps);
    });

    describe('updateScore', () => {
      it('should update score successfully', () => {
        // Create analysis without feedback so it's not completed
        const incompleteAnalysis = Analysis.create({
          idea: 'A revolutionary startup idea that will change the world',
          userId: UserId.generate(),
          score: Score.create(75),
          locale: Locale.english()
        });
        
        const newScore = Score.create(90);
        
        incompleteAnalysis.updateScore(newScore);
        
        expect(incompleteAnalysis.score.equals(newScore)).toBe(true);
      });

      it('should throw error when updating score of completed analysis', () => {
        // Make analysis completed by ensuring it has feedback
        const completedAnalysis = Analysis.create({
          ...validProps,
          feedback: 'This is completed feedback'
        });
        
        expect(() => completedAnalysis.updateScore(Score.create(95))).toThrow(BusinessRuleViolationError);
        expect(() => completedAnalysis.updateScore(Score.create(95))).toThrow('Cannot update score of a completed analysis');
      });
    });

    describe('updateFeedback', () => {
      it('should update feedback successfully', () => {
        const newFeedback = 'Updated feedback content';
        
        analysis.updateFeedback(newFeedback);
        
        expect(analysis.feedback).toBe(newFeedback);
      });

      it('should throw error for feedback too long', () => {
        const longFeedback = 'x'.repeat(10001);
        
        expect(() => analysis.updateFeedback(longFeedback)).toThrow(BusinessRuleViolationError);
        expect(() => analysis.updateFeedback(longFeedback)).toThrow('Feedback cannot exceed 10000 characters');
      });
    });

    describe('addSuggestion', () => {
      it('should add suggestion successfully', () => {
        const newSuggestion = 'New suggestion';
        
        analysis.addSuggestion(newSuggestion);
        
        expect(analysis.suggestions).toContain(newSuggestion);
      });

      it('should throw error for empty suggestion', () => {
        expect(() => analysis.addSuggestion('')).toThrow(BusinessRuleViolationError);
        expect(() => analysis.addSuggestion('')).toThrow('Suggestion cannot be empty');
      });

      it('should throw error for suggestion too long', () => {
        const longSuggestion = 'x'.repeat(501);
        
        expect(() => analysis.addSuggestion(longSuggestion)).toThrow(BusinessRuleViolationError);
        expect(() => analysis.addSuggestion(longSuggestion)).toThrow('Suggestion cannot exceed 500 characters');
      });

      it('should throw error for duplicate suggestion', () => {
        const suggestion = 'Duplicate suggestion';
        analysis.addSuggestion(suggestion);
        
        expect(() => analysis.addSuggestion(suggestion)).toThrow(BusinessRuleViolationError);
        expect(() => analysis.addSuggestion(suggestion)).toThrow('Suggestion already exists');
      });

      it('should throw error when adding too many suggestions', () => {
        // Create analysis with maximum suggestions
        const maxSuggestions = Array(50).fill(0).map((_, i) => `Suggestion ${i}`);
        const fullAnalysis = Analysis.create({
          ...validProps,
          suggestions: maxSuggestions
        });
        
        expect(() => fullAnalysis.addSuggestion('One more')).toThrow(BusinessRuleViolationError);
        expect(() => fullAnalysis.addSuggestion('One more')).toThrow('Cannot add more than 50 suggestions to an analysis');
      });
    });

    describe('removeSuggestion', () => {
      it('should remove suggestion successfully', () => {
        const suggestionToRemove = validProps.suggestions![0];
        
        analysis.removeSuggestion(suggestionToRemove);
        
        expect(analysis.suggestions).not.toContain(suggestionToRemove);
      });

      it('should throw error for non-existent suggestion', () => {
        expect(() => analysis.removeSuggestion('Non-existent')).toThrow(BusinessRuleViolationError);
        expect(() => analysis.removeSuggestion('Non-existent')).toThrow('Suggestion not found');
      });
    });

    describe('setCategory', () => {
      it('should set category successfully', () => {
        const newCategory = Category.createGeneral('business');
        
        analysis.setCategory(newCategory);
        
        expect(analysis.category?.equals(newCategory)).toBe(true);
      });
    });
  });

  describe('business queries', () => {
    let analysis: Analysis;

    beforeEach(() => {
      analysis = Analysis.create(validProps);
    });

    describe('isHighQuality', () => {
      it('should return true for score >= 80', () => {
        const highQualityAnalysis = Analysis.create({
          ...validProps,
          score: Score.create(80)
        });
        
        expect(highQualityAnalysis.isHighQuality()).toBe(true);
      });

      it('should return false for score < 80', () => {
        const lowQualityAnalysis = Analysis.create({
          ...validProps,
          score: Score.create(79)
        });
        
        expect(lowQualityAnalysis.isHighQuality()).toBe(false);
      });
    });

    describe('isLowQuality', () => {
      it('should return true for score < 40', () => {
        const lowQualityAnalysis = Analysis.create({
          ...validProps,
          score: Score.create(39)
        });
        
        expect(lowQualityAnalysis.isLowQuality()).toBe(true);
      });

      it('should return false for score >= 40', () => {
        const goodAnalysis = Analysis.create({
          ...validProps,
          score: Score.create(40)
        });
        
        expect(goodAnalysis.isLowQuality()).toBe(false);
      });
    });

    describe('isCompleted', () => {
      it('should return true when has feedback', () => {
        const completedAnalysis = Analysis.create({
          ...validProps,
          feedback: 'Analysis completed'
        });
        
        expect(completedAnalysis.isCompleted()).toBe(true);
      });

      it('should return false when no feedback', () => {
        const incompleteAnalysis = Analysis.create({
          ...validProps,
          feedback: undefined
        });
        
        expect(incompleteAnalysis.isCompleted()).toBe(false);
      });
    });

    describe('belongsToUser', () => {
      it('should return true for same user', () => {
        expect(analysis.belongsToUser(validProps.userId)).toBe(true);
      });

      it('should return false for different user', () => {
        const differentUserId = UserId.generate();
        expect(analysis.belongsToUser(differentUserId)).toBe(false);
      });
    });

    describe('isRecent', () => {
      it('should return true for analysis created within 24 hours', () => {
        expect(analysis.isRecent()).toBe(true);
      });

      it('should return false for old analysis', () => {
        const oldAnalysis = Analysis.reconstruct({
          ...validProps,
          id: AnalysisId.generate(),
          createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
          updatedAt: new Date()
        });
        
        expect(oldAnalysis.isRecent()).toBe(false);
      });
    });

    describe('getAgeInDays', () => {
      it('should return correct age in days', () => {
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const oldAnalysis = Analysis.reconstruct({
          ...validProps,
          id: AnalysisId.generate(),
          createdAt: threeDaysAgo,
          updatedAt: new Date()
        });
        
        expect(oldAnalysis.getAgeInDays()).toBe(3);
      });
    });
  });

  describe('getSummary', () => {
    it('should return summary with full idea when short', () => {
      const shortIdea = 'Short idea';
      const shortAnalysis = Analysis.create({
        ...validProps,
        idea: shortIdea
      });
      
      const summary = shortAnalysis.getSummary();
      expect(summary).toContain(shortIdea);
      expect(summary).toContain('85%');
    });

    it('should truncate long idea in summary', () => {
      const longIdea = 'x'.repeat(150);
      const longAnalysis = Analysis.create({
        ...validProps,
        idea: longIdea
      });
      
      const summary = longAnalysis.getSummary();
      expect(summary).toContain('...');
      expect(summary.length).toBeLessThan(longIdea.length);
    });
  });
});