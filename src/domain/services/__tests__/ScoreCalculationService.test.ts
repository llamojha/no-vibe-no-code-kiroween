import { describe, it, expect, beforeEach } from 'vitest';
import { ScoreCalculationService } from '../ScoreCalculationService';
import { Analysis } from '../../entities/Analysis';
import { AnalysisId } from '../../value-objects/AnalysisId';
import { UserId } from '../../value-objects/UserId';
import { Score } from '../../value-objects/Score';
import { Locale } from '../../value-objects/Locale';
import { Category } from '../../value-objects/Category';

describe('ScoreCalculationService', () => {
  let scoreService: ScoreCalculationService;
  let testAnalysis: Analysis;

  beforeEach(() => {
    scoreService = new ScoreCalculationService();
    
    testAnalysis = Analysis.create({
      idea: 'An innovative AI-powered platform that helps developers create better applications with automated code review and suggestions',
      userId: UserId.generate(),
      score: Score.create(75),
      locale: Locale.english(),
      feedback: 'This is a comprehensive idea with strong technical merit.',
      suggestions: ['Add mobile support', 'Consider enterprise features', 'Implement real-time collaboration']
    });
  });

  describe('calculateAnalysisScore', () => {
    it('should calculate score breakdown for general analysis', () => {
      const context = {
        analysis: testAnalysis,
        category: Category.createGeneral('technology')
      };

      const breakdown = scoreService.calculateAnalysisScore(context);
      
      expect(breakdown.totalScore).toBeDefined();
      expect(breakdown.totalScore.value).toBeGreaterThan(0);
      expect(breakdown.totalScore.value).toBeLessThanOrEqual(100);
      expect(breakdown.criteriaScores).toHaveLength(4); // General criteria count
      expect(breakdown.bonusPoints).toBeGreaterThanOrEqual(0);
      expect(breakdown.penaltyPoints).toBeGreaterThanOrEqual(0);
    });

    it('should apply bonus points for detailed feedback', () => {
      const analysisWithDetailedFeedback = Analysis.create({
        idea: testAnalysis.idea,
        userId: testAnalysis.userId,
        score: testAnalysis.score,
        locale: testAnalysis.locale,
        feedback: 'This is a very detailed feedback that explains the analysis in depth with comprehensive insights about the market potential, technical feasibility, and business viability of the proposed solution.',
        suggestions: testAnalysis.suggestions
      });

      const context = {
        analysis: analysisWithDetailedFeedback,
        additionalFactors: {
          hasVisualMaterials: true,
          hasImplementation: true
        }
      };

      const breakdown = scoreService.calculateAnalysisScore(context);
      
      expect(breakdown.bonusPoints).toBeGreaterThan(0);
    });
  });

  describe('calculateHackathonScore', () => {
    it('should calculate hackathon-specific scores', () => {
      const hackathonCategory = Category.createHackathon('frankenstein');
      const context = {
        analysis: testAnalysis,
        category: hackathonCategory,
        additionalFactors: {
          hasImplementation: true,
          teamSize: 3
        }
      };

      const breakdown = scoreService.calculateHackathonScore(context);
      
      expect(breakdown.totalScore).toBeDefined();
      expect(breakdown.criteriaScores).toHaveLength(3); // Hackathon criteria count
      expect(breakdown.bonusPoints).toBeGreaterThanOrEqual(0);
    });

    it('should throw error for non-hackathon category', () => {
      const generalCategory = Category.createGeneral('technology');
      const context = {
        analysis: testAnalysis,
        category: generalCategory
      };

      expect(() => {
        scoreService.calculateHackathonScore(context);
      }).toThrow('Hackathon score calculation requires a hackathon category');
    });
  });

  describe('recalculateScore', () => {
    it('should recalculate score when idea is updated', () => {
      const newScore = scoreService.recalculateScore(testAnalysis, {
        idea: 'A completely new and revolutionary idea that changes everything'
      });
      
      expect(newScore).toBeDefined();
      expect(newScore.value).toBeGreaterThan(0);
      expect(newScore.value).toBeLessThanOrEqual(100);
    });

    it('should apply incremental adjustments for feedback updates', () => {
      const newScore = scoreService.recalculateScore(testAnalysis, {
        feedback: 'This is an excellent analysis with comprehensive insights and detailed recommendations for implementation.'
      });
      
      expect(newScore.value).toBeGreaterThanOrEqual(testAnalysis.score.value);
    });
  });

  describe('compareAnalyses', () => {
    it('should compare two analyses', () => {
      const analysis2 = Analysis.create({
        idea: 'A simple mobile app for task management',
        userId: UserId.generate(),
        score: Score.create(60),
        locale: Locale.english()
      });

      const comparison = scoreService.compareAnalyses(testAnalysis, analysis2);
      
      expect(comparison.scoreDifference).toBeGreaterThan(0);
      expect(comparison.betterAnalysis).toBe(testAnalysis);
      expect(comparison.comparisonInsights).toBeDefined();
    });
  });
});