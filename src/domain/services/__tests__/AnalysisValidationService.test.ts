import { describe, it, expect, beforeEach } from 'vitest';
import { AnalysisValidationService } from '../AnalysisValidationService';
import { Analysis } from '../../entities/Analysis';
import { AnalysisId } from '../../value-objects/AnalysisId';
import { UserId } from '../../value-objects/UserId';
import { Score } from '../../value-objects/Score';
import { Locale } from '../../value-objects/Locale';
import { Category } from '../../value-objects/Category';

describe('AnalysisValidationService', () => {
  let validationService: AnalysisValidationService;
  let testAnalysis: Analysis;

  beforeEach(() => {
    validationService = new AnalysisValidationService();
    
    testAnalysis = Analysis.create({
      idea: 'A comprehensive startup idea that solves a real problem in the market with innovative technology',
      userId: UserId.generate(),
      score: Score.create(75),
      locale: Locale.english(),
      feedback: 'This is a well-thought-out idea with good market potential.',
      suggestions: ['Consider adding mobile app', 'Explore partnerships']
    });
  });

  describe('validateAnalysis', () => {
    it('should validate a well-formed analysis successfully', () => {
      const result = validationService.validateAnalysis(testAnalysis);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return warnings for short ideas', () => {
      const shortIdeaAnalysis = Analysis.create({
        idea: 'Short idea',
        userId: UserId.generate(),
        score: Score.create(50),
        locale: Locale.english()
      });

      const result = validationService.validateAnalysis(shortIdeaAnalysis);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.includes('quite short'))).toBe(true);
    });
  });

  describe('validateIdeaContent', () => {
    it('should validate good idea content', () => {
      const idea = 'A comprehensive platform that helps developers create better applications using AI assistance';
      const result = validationService.validateIdeaContent(idea);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return warnings for very short ideas', () => {
      const shortIdea = 'Bad idea';
      const result = validationService.validateIdeaContent(shortIdea);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.includes('very brief'))).toBe(true);
    });
  });

  describe('calculateQualityMetrics', () => {
    it('should calculate quality metrics for an analysis', () => {
      const metrics = validationService.calculateQualityMetrics(testAnalysis);
      
      expect(metrics.ideaClarity).toBeGreaterThan(0);
      expect(metrics.ideaOriginality).toBeGreaterThan(0);
      expect(metrics.feasibilityScore).toBeGreaterThan(0);
      expect(metrics.marketPotential).toBeGreaterThan(0);
      expect(metrics.overallQuality).toBeGreaterThan(0);
      
      expect(metrics.ideaClarity).toBeLessThanOrEqual(100);
      expect(metrics.ideaOriginality).toBeLessThanOrEqual(100);
      expect(metrics.feasibilityScore).toBeLessThanOrEqual(100);
      expect(metrics.marketPotential).toBeLessThanOrEqual(100);
      expect(metrics.overallQuality).toBeLessThanOrEqual(100);
    });
  });

  describe('canDeleteAnalysis', () => {
    it('should allow deletion of regular analyses', () => {
      const canDelete = validationService.canDeleteAnalysis(testAnalysis);
      expect(canDelete).toBe(true);
    });
  });

  describe('canUpdateAnalysis', () => {
    it('should allow updates to recent analyses', () => {
      const result = validationService.canUpdateAnalysis(testAnalysis);
      expect(result.canUpdate).toBe(true);
    });
  });
});