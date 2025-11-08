import { describe, it, expect } from 'vitest';
import { generateStartupIdeaPrompt } from '../startupIdea';

describe('generateStartupIdeaPrompt', () => {
  const testIdea = 'A revolutionary AI-powered platform for sustainable agriculture';

  describe('English locale', () => {
    it('should return non-empty string for English locale', () => {
      const prompt = generateStartupIdeaPrompt(testIdea, 'en');
      
      expect(prompt).toBeDefined();
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('should include the provided idea in the prompt', () => {
      const prompt = generateStartupIdeaPrompt(testIdea, 'en');
      
      expect(prompt).toContain(testIdea);
    });

    it('should include English language instruction', () => {
      const prompt = generateStartupIdeaPrompt(testIdea, 'en');
      
      expect(prompt).toContain('English');
      expect(prompt).toContain('VERY IMPORTANT');
    });

    it('should include JSON formatting instructions', () => {
      const prompt = generateStartupIdeaPrompt(testIdea, 'en');
      
      expect(prompt).toContain('JSON');
      expect(prompt).toContain('CRITICAL FORMATTING INSTRUCTIONS');
    });

    it('should include scoring rubric criteria', () => {
      const prompt = generateStartupIdeaPrompt(testIdea, 'en');
      
      expect(prompt).toContain('Market Demand');
      expect(prompt).toContain('Market Size');
      expect(prompt).toContain('Uniqueness');
      expect(prompt).toContain('Scalability');
      expect(prompt).toContain('Potential Profitability');
    });

    it('should include required analysis sections', () => {
      const prompt = generateStartupIdeaPrompt(testIdea, 'en');
      
      expect(prompt).toContain('detailedSummary');
      expect(prompt).toContain('founderQuestions');
      expect(prompt).toContain('swotAnalysis');
      expect(prompt).toContain('currentMarketTrends');
      expect(prompt).toContain('scoringRubric');
      expect(prompt).toContain('competitors');
      expect(prompt).toContain('monetizationStrategies');
      expect(prompt).toContain('improvementSuggestions');
      expect(prompt).toContain('nextSteps');
      expect(prompt).toContain('finalScore');
    });
  });

  describe('Spanish locale', () => {
    it('should return non-empty string for Spanish locale', () => {
      const prompt = generateStartupIdeaPrompt(testIdea, 'es');
      
      expect(prompt).toBeDefined();
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('should include the provided idea in the prompt', () => {
      const prompt = generateStartupIdeaPrompt(testIdea, 'es');
      
      expect(prompt).toContain(testIdea);
    });

    it('should include Spanish language instruction', () => {
      const prompt = generateStartupIdeaPrompt(testIdea, 'es');
      
      expect(prompt).toContain('español');
      expect(prompt).toContain('MUY IMPORTANTE');
    });

    it('should include JSON formatting instructions', () => {
      const prompt = generateStartupIdeaPrompt(testIdea, 'es');
      
      expect(prompt).toContain('JSON');
    });
  });

  describe('Locale handling', () => {
    it('should generate different prompts for different locales', () => {
      const englishPrompt = generateStartupIdeaPrompt(testIdea, 'en');
      const spanishPrompt = generateStartupIdeaPrompt(testIdea, 'es');
      
      expect(englishPrompt).not.toBe(spanishPrompt);
    });

    it('should handle special characters in idea', () => {
      const ideaWithSpecialChars = 'An app with "quotes" and special chars: @#$%';
      const prompt = generateStartupIdeaPrompt(ideaWithSpecialChars, 'en');
      
      expect(prompt).toContain(ideaWithSpecialChars);
    });

    it('should handle empty idea string', () => {
      const prompt = generateStartupIdeaPrompt('', 'en');
      
      expect(prompt).toBeDefined();
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('should handle very long idea strings', () => {
      const longIdea = 'A'.repeat(5000);
      const prompt = generateStartupIdeaPrompt(longIdea, 'en');
      
      expect(prompt).toContain(longIdea);
    });
  });

  describe('Founder\'s Checklist', () => {
    it('should include all 10 founder questions', () => {
      const prompt = generateStartupIdeaPrompt(testIdea, 'en');
      
      expect(prompt).toContain('Founder\'s Checklist');
      expect(prompt).toContain('What\'s the specific problem?');
      expect(prompt).toContain('Who is the paying customer');
      expect(prompt).toContain('How bad is the problem');
      expect(prompt).toContain('Evidence of willingness to pay');
      expect(prompt).toContain('How will you acquire customers');
      expect(prompt).toContain('Unit economics');
      expect(prompt).toContain('Competition and differentiation');
      expect(prompt).toContain('Founders / team fit');
      expect(prompt).toContain('Top 3 risks');
      expect(prompt).toContain('Immediate experiment');
    });
  });
});
