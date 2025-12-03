import { describe, it, expect, beforeEach } from 'vitest';
import { HackathonAnalysisService } from '../HackathonAnalysisService';
import { Analysis } from '../../entities/Analysis';
import { AnalysisId } from '../../value-objects/AnalysisId';
import { UserId } from '../../value-objects/UserId';
import { Score } from '../../value-objects/Score';
import { Locale } from '../../value-objects/Locale';
import { Category } from '../../value-objects/Category';

interface TestMetadata {
  projectName: string;
  description: string;
  kiroUsage: string;
  githubUrl?: string;
  demoUrl?: string;
  screenshots?: string[];
  teamSize: number;
  timeSpent?: number;
}

describe('HackathonAnalysisService', () => {
  let hackathonService: HackathonAnalysisService;
  let testAnalysis: Analysis;
  let testMetadata: TestMetadata;

  beforeEach(() => {
    hackathonService = new HackathonAnalysisService();
    
    testAnalysis = Analysis.create({
      idea: 'A Frankenstein project that combines legacy code modernization with AI-powered refactoring tools to create a hybrid development platform',
      userId: UserId.generate(),
      score: Score.create(80),
      locale: Locale.english(),
      feedback: 'Excellent hackathon project with strong technical implementation.'
    });

    testMetadata = {
      projectName: 'Legacy AI Refactor',
      description: 'This project combines old legacy systems with modern AI to create a powerful refactoring tool that helps developers modernize their codebase automatically.',
      kiroUsage: 'We extensively used Kiro to analyze our project structure, generate documentation, and create implementation plans. The AI features helped us identify the best approaches for combining different technologies.',
      githubUrl: 'https://github.com/test/legacy-ai-refactor',
      demoUrl: 'https://demo.legacy-ai-refactor.com',
      screenshots: ['screenshot1.png', 'screenshot2.png', 'screenshot3.png'],
      teamSize: 3,
      timeSpent: 48
    };
  });

  describe('evaluateProjectForCategory', () => {
    it('should recommend appropriate hackathon category', () => {
      const evaluation = hackathonService.evaluateProjectForCategory(testAnalysis, testMetadata);
      
      expect(evaluation.recommendedCategory).toBeDefined();
      expect(evaluation.categoryFitScore).toBeDefined();
      expect(evaluation.categoryFitScore.value).toBeGreaterThan(0);
      expect(evaluation.alternativeCategories).toHaveLength(2);
      expect(evaluation.improvementSuggestions).toBeDefined();
      expect(evaluation.competitiveAdvantages).toBeDefined();
    });

    it('should identify Frankenstein category for combination projects', () => {
      const evaluation = hackathonService.evaluateProjectForCategory(testAnalysis, testMetadata);
      
      // Should recommend Frankenstein category due to "combines" and "hybrid" keywords
      expect(evaluation.recommendedCategory.value).toBe('frankenstein');
    });
  });

  describe('validateHackathonSubmission', () => {
    it('should validate complete hackathon submission', () => {
      const validation = hackathonService.validateHackathonSubmission(testAnalysis, testMetadata);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should require project name', () => {
      const invalidMetadata = { ...testMetadata, projectName: '' };
      const validation = hackathonService.validateHackathonSubmission(testAnalysis, invalidMetadata);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('Project name is required'))).toBe(true);
    });

    it('should require minimum description length', () => {
      const invalidMetadata = { ...testMetadata, description: 'Too short' };
      const validation = hackathonService.validateHackathonSubmission(testAnalysis, invalidMetadata);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('at least 50 characters'))).toBe(true);
    });

    it('should validate team size limits', () => {
      const invalidMetadata = { ...testMetadata, teamSize: 15 };
      const validation = hackathonService.validateHackathonSubmission(testAnalysis, invalidMetadata);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('between 1 and 10 members'))).toBe(true);
    });
  });

  describe('generateCategoryImprovements', () => {
    it('should generate improvements for hackathon categories', () => {
      const category = Category.createHackathon('resurrection');
      const improvements = hackathonService.generateCategoryImprovements(testAnalysis, category);
      
      expect(improvements).toBeDefined();
      expect(improvements.length).toBeGreaterThan(0);
    });

    it('should throw error for non-hackathon category', () => {
      const generalCategory = Category.createGeneral('technology');
      
      expect(() => {
        hackathonService.generateCategoryImprovements(testAnalysis, generalCategory);
      }).toThrow('Category must be a hackathon category');
    });
  });

  describe('calculateCompetitiveAdvantage', () => {
    it('should calculate competitive advantage', () => {
      const category = Category.createHackathon('frankenstein');
      const advantage = hackathonService.calculateCompetitiveAdvantage(testAnalysis, testMetadata, category);
      
      expect(advantage.overallAdvantage).toBeDefined();
      expect(advantage.overallAdvantage.value).toBeGreaterThan(0);
      expect(advantage.advantages).toBeDefined();
      expect(advantage.advantages.length).toBeGreaterThan(0);
    });

    it('should identify implementation advantages', () => {
      const category = Category.createHackathon('frankenstein');
      const advantage = hackathonService.calculateCompetitiveAdvantage(testAnalysis, testMetadata, category);
      
      const hasImplementationAdvantage = advantage.advantages.some(
        adv => adv.factor === 'Complete Implementation'
      );
      expect(hasImplementationAdvantage).toBe(true);
    });
  });

  describe('compareHackathonProjects', () => {
    it('should compare two hackathon projects', () => {
      const project2Analysis = Analysis.create({
        idea: 'A simple UI redesign project',
        userId: UserId.generate(),
        score: Score.create(60),
        locale: Locale.english()
      });

      const project2Metadata = {
        projectName: 'Simple UI',
        description: 'A basic UI redesign project with minimal functionality and limited scope.',
        kiroUsage: 'Used Kiro for basic analysis.',
        teamSize: 1
      };

      const category = Category.createHackathon('frankenstein');
      const comparison = hackathonService.compareHackathonProjects(
        { analysis: testAnalysis, metadata: testMetadata },
        { analysis: project2Analysis, metadata: project2Metadata },
        category
      );
      
      expect(comparison.winner).toBe('project1');
      expect(comparison.scoreDifference).toBeGreaterThan(0);
      expect(comparison.comparisonFactors).toBeDefined();
      expect(comparison.comparisonFactors.length).toBeGreaterThan(0);
    });
  });
});