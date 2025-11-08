import { describe, it, expect } from 'vitest';
import { generateHackathonProjectPrompt } from '../hackathonProject';

describe('generateHackathonProjectPrompt', () => {
  const testProject = 'A spooky AI-powered code analyzer that haunts your repository';
  const testKiroUsage = 'Used Kiro for automated code review and ghost detection';
  const testCategory = 'frankenstein';

  describe('English locale', () => {
    it('should return non-empty string for English locale', () => {
      const prompt = generateHackathonProjectPrompt(testProject, testKiroUsage, testCategory, 'en');
      
      expect(prompt).toBeDefined();
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('should include the provided project description in the prompt', () => {
      const prompt = generateHackathonProjectPrompt(testProject, testKiroUsage, testCategory, 'en');
      
      expect(prompt).toContain(testProject);
    });

    it('should include the Kiro usage description in the prompt', () => {
      const prompt = generateHackathonProjectPrompt(testProject, testKiroUsage, testCategory, 'en');
      
      expect(prompt).toContain(testKiroUsage);
    });

    it('should include the category in the prompt', () => {
      const prompt = generateHackathonProjectPrompt(testProject, testKiroUsage, testCategory, 'en');
      
      expect(prompt).toContain(testCategory);
    });

    it('should include English language instruction', () => {
      const prompt = generateHackathonProjectPrompt(testProject, testKiroUsage, testCategory, 'en');
      
      expect(prompt).toContain('English');
      expect(prompt).toContain('VERY IMPORTANT');
    });

    it('should include JSON formatting instructions', () => {
      const prompt = generateHackathonProjectPrompt(testProject, testKiroUsage, testCategory, 'en');
      
      expect(prompt).toContain('JSON');
      expect(prompt).toContain('CRITICAL FORMATTING INSTRUCTIONS');
    });

    it('should include all Kiroween categories', () => {
      const prompt = generateHackathonProjectPrompt(testProject, testKiroUsage, testCategory, 'en');
      
      expect(prompt).toContain('Resurrection');
      expect(prompt).toContain('Frankenstein');
      expect(prompt).toContain('Skeleton Crew');
      expect(prompt).toContain('Costume Contest');
    });

    it('should include judging criteria', () => {
      const prompt = generateHackathonProjectPrompt(testProject, testKiroUsage, testCategory, 'en');
      
      expect(prompt).toContain('Potential Value');
      expect(prompt).toContain('Implementation');
      expect(prompt).toContain('Quality and Design');
    });

    it('should include required analysis sections', () => {
      const prompt = generateHackathonProjectPrompt(testProject, testKiroUsage, testCategory, 'en');
      
      expect(prompt).toContain('categoryAnalysis');
      expect(prompt).toContain('criteriaAnalysis');
      expect(prompt).toContain('detailedSummary');
      expect(prompt).toContain('viabilitySummary');
      expect(prompt).toContain('improvementSuggestions');
      expect(prompt).toContain('nextSteps');
      expect(prompt).toContain('hackathonSpecificAdvice');
    });
  });

  describe('Spanish locale', () => {
    it('should return non-empty string for Spanish locale', () => {
      const prompt = generateHackathonProjectPrompt(testProject, testKiroUsage, testCategory, 'es');
      
      expect(prompt).toBeDefined();
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('should include the provided project description in the prompt', () => {
      const prompt = generateHackathonProjectPrompt(testProject, testKiroUsage, testCategory, 'es');
      
      expect(prompt).toContain(testProject);
    });

    it('should include the Kiro usage description in the prompt', () => {
      const prompt = generateHackathonProjectPrompt(testProject, testKiroUsage, testCategory, 'es');
      
      expect(prompt).toContain(testKiroUsage);
    });

    it('should include Spanish language instruction', () => {
      const prompt = generateHackathonProjectPrompt(testProject, testKiroUsage, testCategory, 'es');
      
      expect(prompt).toContain('español');
      expect(prompt).toContain('MUY IMPORTANTE');
    });

    it('should include JSON formatting instructions', () => {
      const prompt = generateHackathonProjectPrompt(testProject, testKiroUsage, testCategory, 'es');
      
      expect(prompt).toContain('JSON');
    });
  });

  describe('Category handling', () => {
    it('should handle resurrection category', () => {
      const prompt = generateHackathonProjectPrompt(testProject, testKiroUsage, 'resurrection', 'en');
      
      expect(prompt).toContain('resurrection');
      expect(prompt).toContain('Reviving obsolete technology');
    });

    it('should handle frankenstein category', () => {
      const prompt = generateHackathonProjectPrompt(testProject, testKiroUsage, 'frankenstein', 'en');
      
      expect(prompt).toContain('frankenstein');
      expect(prompt).toContain('Integration of seemingly incompatible');
    });

    it('should handle skeleton-crew category', () => {
      const prompt = generateHackathonProjectPrompt(testProject, testKiroUsage, 'skeleton-crew', 'en');
      
      expect(prompt).toContain('skeleton-crew');
      expect(prompt).toContain('Flexible foundation');
    });

    it('should handle costume-contest category', () => {
      const prompt = generateHackathonProjectPrompt(testProject, testKiroUsage, 'costume-contest', 'en');
      
      expect(prompt).toContain('costume-contest');
      expect(prompt).toContain('UI polish');
    });

    it('should handle unknown category gracefully', () => {
      const prompt = generateHackathonProjectPrompt(testProject, testKiroUsage, 'unknown-category', 'en');
      
      expect(prompt).toBeDefined();
      expect(prompt).toContain('unknown-category');
    });
  });

  describe('Locale handling', () => {
    it('should generate different prompts for different locales', () => {
      const englishPrompt = generateHackathonProjectPrompt(testProject, testKiroUsage, testCategory, 'en');
      const spanishPrompt = generateHackathonProjectPrompt(testProject, testKiroUsage, testCategory, 'es');
      
      expect(englishPrompt).not.toBe(spanishPrompt);
    });

    it('should handle special characters in project description', () => {
      const projectWithSpecialChars = 'A project with "quotes" and special chars: @#$%';
      const prompt = generateHackathonProjectPrompt(projectWithSpecialChars, testKiroUsage, testCategory, 'en');
      
      expect(prompt).toBeDefined();
    });

    it('should handle special characters in Kiro usage', () => {
      const kiroUsageWithSpecialChars = 'Used Kiro\'s "advanced" features & tools';
      const prompt = generateHackathonProjectPrompt(testProject, kiroUsageWithSpecialChars, testCategory, 'en');
      
      expect(prompt).toBeDefined();
    });

    it('should handle empty strings', () => {
      const prompt = generateHackathonProjectPrompt('', '', testCategory, 'en');
      
      expect(prompt).toBeDefined();
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('should handle very long descriptions', () => {
      const longProject = 'A'.repeat(5000);
      const longKiroUsage = 'B'.repeat(5000);
      const prompt = generateHackathonProjectPrompt(longProject, longKiroUsage, testCategory, 'en');
      
      expect(prompt).toBeDefined();
    });
  });

  describe('Evaluation guidelines', () => {
    it('should include category fit scoring guidelines', () => {
      const prompt = generateHackathonProjectPrompt(testProject, testKiroUsage, testCategory, 'en');
      
      expect(prompt).toContain('Category Fit Scoring');
      expect(prompt).toContain('1-10 scale');
    });

    it('should include criteria scoring guidelines', () => {
      const prompt = generateHackathonProjectPrompt(testProject, testKiroUsage, testCategory, 'en');
      
      expect(prompt).toContain('Criteria Scoring');
      expect(prompt).toContain('1-5 scale');
    });

    it('should include evaluation focus areas', () => {
      const prompt = generateHackathonProjectPrompt(testProject, testKiroUsage, testCategory, 'en');
      
      expect(prompt).toContain('Focus on:');
      expect(prompt).toContain('Kiro\'s unique capabilities');
    });
  });
});
