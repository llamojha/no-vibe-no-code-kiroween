import { Analysis } from '../entities/Analysis';
import { Category } from '../value-objects/Category';

/**
 * Validation result for analysis operations
 */
export interface AnalysisValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Analysis quality metrics
 */
export interface AnalysisQualityMetrics {
  ideaClarity: number; // 0-100
  ideaOriginality: number; // 0-100
  feasibilityScore: number; // 0-100
  marketPotential: number; // 0-100
  overallQuality: number; // 0-100
}

/**
 * Domain service for analysis validation and business rules
 * Contains pure business logic for analysis validation
 */
export class AnalysisValidationService {
  /**
   * Validate an analysis against business rules
   */
  validateAnalysis(analysis: Analysis): AnalysisValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate idea content
    const ideaValidation = this.validateIdeaContent(analysis.idea);
    errors.push(...ideaValidation.errors);
    warnings.push(...ideaValidation.warnings);

    // Validate score consistency
    const scoreValidation = this.validateScoreConsistency(analysis);
    errors.push(...scoreValidation.errors);
    warnings.push(...scoreValidation.warnings);

    // Validate category assignment
    if (analysis.category) {
      const categoryValidation = this.validateCategoryAssignment(analysis, analysis.category);
      errors.push(...categoryValidation.errors);
      warnings.push(...categoryValidation.warnings);
    }

    // Validate feedback quality
    if (analysis.feedback) {
      const feedbackValidation = this.validateFeedbackQuality(analysis.feedback);
      warnings.push(...feedbackValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate idea content for quality and completeness
   */
  validateIdeaContent(idea: string): AnalysisValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic length validation - only warnings for short ideas
    if (idea.length < 50) {
      warnings.push('Idea description is quite short. Consider adding more details for better analysis.');
    }

    if (idea.length > 2000) {
      warnings.push('Idea description is very long. Consider summarizing key points.');
    }

    // Content quality checks - warning instead of error for low word count
    const wordCount = idea.split(/\s+/).length;
    if (wordCount < 10) {
      warnings.push('Idea is very brief. Consider adding more details for a comprehensive analysis.');
    }

    // Check for common issues
    if (this.containsOnlyGenericTerms(idea)) {
      warnings.push('Idea contains mostly generic terms. Try to be more specific about your solution.');
    }

    if (this.lacksActionableElements(idea)) {
      warnings.push('Consider adding more actionable elements or specific implementation details.');
    }

    if (this.containsInappropriateContent(idea)) {
      errors.push('Idea contains inappropriate content that cannot be analyzed.');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate score consistency with analysis content
   */
  validateScoreConsistency(analysis: Analysis): AnalysisValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const score = analysis.score.value;
    const ideaLength = analysis.idea.length;
    const hasDetailedFeedback = analysis.feedback && analysis.feedback.length > 100;

    // High scores should have detailed feedback
    if (score >= 80 && !hasDetailedFeedback) {
      warnings.push('High-scoring analyses should include detailed feedback explaining the score.');
    }

    // Low scores should have improvement suggestions
    if (score < 40 && analysis.suggestions.length === 0) {
      warnings.push('Low-scoring analyses should include suggestions for improvement.');
    }

    // Very short ideas shouldn't have very high scores
    if (ideaLength < 100 && score > 90) {
      warnings.push('Very brief ideas rarely warrant extremely high scores. Consider if the score is justified.');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate category assignment appropriateness
   */
  validateCategoryAssignment(analysis: Analysis, category: Category): AnalysisValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const idea = analysis.idea.toLowerCase();

    // Check if category matches content for hackathon categories
    if (category.isHackathon) {
      const categoryFit = this.assessHackathonCategoryFit(idea, category);
      if (categoryFit < 0.3) {
        warnings.push(`The idea doesn't seem to fit well with the ${category.displayName} category. Consider reviewing the category assignment.`);
      }
    }

    // Check for general category appropriateness
    if (category.isGeneral) {
      const categoryFit = this.assessGeneralCategoryFit(idea, category);
      if (categoryFit < 0.3) {
        warnings.push(`The idea might not be the best fit for the ${category.displayName} category.`);
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate feedback quality
   */
  validateFeedbackQuality(feedback: string): AnalysisValidationResult {
    const warnings: string[] = [];

    if (feedback.length < 50) {
      warnings.push('Feedback is quite brief. Consider providing more detailed analysis.');
    }

    if (!this.containsConstructiveElements(feedback)) {
      warnings.push('Feedback should include constructive suggestions or specific insights.');
    }

    if (this.isGenericFeedback(feedback)) {
      warnings.push('Feedback appears generic. Try to provide more specific, tailored insights.');
    }

    return { isValid: true, errors: [], warnings };
  }

  /**
   * Calculate quality metrics for an analysis
   */
  calculateQualityMetrics(analysis: Analysis): AnalysisQualityMetrics {
    const ideaClarity = this.assessIdeaClarity(analysis.idea);
    const ideaOriginality = this.assessIdeaOriginality(analysis.idea);
    const feasibilityScore = this.assessFeasibility(analysis.idea);
    const marketPotential = this.assessMarketPotential(analysis.idea);

    const overallQuality = Math.round(
      (ideaClarity * 0.25 + 
       ideaOriginality * 0.25 + 
       feasibilityScore * 0.25 + 
       marketPotential * 0.25)
    );

    return {
      ideaClarity,
      ideaOriginality,
      feasibilityScore,
      marketPotential,
      overallQuality
    };
  }

  /**
   * Check if an analysis can be safely deleted (analysis parameter unused in current implementation)
   */
  canDeleteAnalysis(_analysis: Analysis): boolean {
    // Allow deletion of regular analyses
    // Only prevent deletion of special analyses (templates, demos, etc.)
    // For now, all regular analyses can be deleted
    return true;
  }

  /**
   * Validate if an analysis can be updated
   */
  canUpdateAnalysis(analysis: Analysis): { canUpdate: boolean; reason?: string } {
    if (analysis.isCompleted() && analysis.getAgeInDays() > 30) {
      return {
        canUpdate: false,
        reason: 'Cannot update completed analyses older than 30 days'
      };
    }

    return { canUpdate: true };
  }

  // Private helper methods
  private containsOnlyGenericTerms(idea: string): boolean {
    const genericTerms = ['app', 'website', 'platform', 'system', 'solution', 'tool', 'service'];
    const words = idea.toLowerCase().split(/\s+/);
    const genericCount = words.filter(word => genericTerms.includes(word)).length;
    return genericCount / words.length > 0.5;
  }

  private lacksActionableElements(idea: string): boolean {
    const actionWords = ['create', 'build', 'develop', 'implement', 'design', 'make', 'provide', 'offer'];
    const lowerIdea = idea.toLowerCase();
    return !actionWords.some(word => lowerIdea.includes(word));
  }

  private containsInappropriateContent(idea: string): boolean {
    const inappropriateTerms = ['illegal', 'harmful', 'offensive', 'discriminatory'];
    const lowerIdea = idea.toLowerCase();
    return inappropriateTerms.some(term => lowerIdea.includes(term));
  }

  private assessHackathonCategoryFit(idea: string, category: Category): number {
    const categoryKeywords = {
      'resurrection': ['legacy', 'old', 'revive', 'modernize', 'update', 'refresh'],
      'frankenstein': ['combine', 'merge', 'integrate', 'hybrid', 'mix', 'blend'],
      'skeleton-crew': ['framework', 'foundation', 'structure', 'base', 'core'],
      'costume-contest': ['ui', 'design', 'visual', 'interface', 'appearance', 'style']
    };

    const keywords = categoryKeywords[category.value as keyof typeof categoryKeywords] || [];
    const matches = keywords.filter(keyword => idea.includes(keyword)).length;
    return Math.min(matches / keywords.length, 1);
  }

  private assessGeneralCategoryFit(idea: string, category: Category): number {
    // Simplified category fit assessment
    const categoryKeywords = {
      'technology': ['tech', 'software', 'digital', 'ai', 'machine learning'],
      'business': ['revenue', 'profit', 'market', 'customer', 'business'],
      'market': ['market', 'demand', 'customer', 'segment', 'target'],
      'innovation': ['new', 'innovative', 'novel', 'unique', 'creative'],
      'feasibility': ['possible', 'achievable', 'realistic', 'practical']
    };

    const keywords = categoryKeywords[category.value as keyof typeof categoryKeywords] || [];
    const matches = keywords.filter(keyword => idea.includes(keyword)).length;
    return Math.min(matches / Math.max(keywords.length, 1), 1);
  }

  private containsConstructiveElements(feedback: string): boolean {
    const constructiveWords = ['suggest', 'recommend', 'consider', 'improve', 'enhance', 'could', 'might'];
    const lowerFeedback = feedback.toLowerCase();
    return constructiveWords.some(word => lowerFeedback.includes(word));
  }

  private isGenericFeedback(feedback: string): boolean {
    const genericPhrases = ['good idea', 'interesting concept', 'nice work', 'well done'];
    const lowerFeedback = feedback.toLowerCase();
    return genericPhrases.some(phrase => lowerFeedback.includes(phrase));
  }

  private assessIdeaClarity(idea: string): number {
    // Simple clarity assessment based on structure and detail
    const sentences = idea.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = idea.length / Math.max(sentences.length, 1);
    
    let clarity = 50; // Base score
    
    // Bonus for good sentence structure
    if (sentences.length >= 3 && avgSentenceLength > 20 && avgSentenceLength < 100) {
      clarity += 20;
    }
    
    // Bonus for specific details
    if (idea.includes('by') || idea.includes('through') || idea.includes('using')) {
      clarity += 15;
    }
    
    return Math.min(clarity, 100);
  }

  private assessIdeaOriginality(idea: string): number {
    // Simple originality assessment
    const commonWords = ['app', 'website', 'platform', 'mobile', 'web'];
    const lowerIdea = idea.toLowerCase();
    const commonWordCount = commonWords.filter(word => lowerIdea.includes(word)).length;
    
    let originality = 70; // Base score
    originality -= commonWordCount * 10; // Penalty for common words
    
    // Bonus for unique concepts
    if (lowerIdea.includes('ai') || lowerIdea.includes('blockchain') || lowerIdea.includes('vr')) {
      originality += 10;
    }
    
    return Math.max(Math.min(originality, 100), 0);
  }

  private assessFeasibility(idea: string): number {
    // Simple feasibility assessment
    const complexTerms = ['ai', 'machine learning', 'blockchain', 'quantum'];
    const simpleTerms = ['website', 'app', 'dashboard', 'form'];
    
    const lowerIdea = idea.toLowerCase();
    let feasibility = 60; // Base score
    
    if (complexTerms.some(term => lowerIdea.includes(term))) {
      feasibility -= 20; // More complex = less feasible
    }
    
    if (simpleTerms.some(term => lowerIdea.includes(term))) {
      feasibility += 20; // Simpler = more feasible
    }
    
    return Math.max(Math.min(feasibility, 100), 0);
  }

  private assessMarketPotential(idea: string): number {
    // Simple market potential assessment
    const marketTerms = ['users', 'customers', 'market', 'demand', 'problem', 'solution'];
    const lowerIdea = idea.toLowerCase();
    
    let potential = 50; // Base score
    
    const marketWordCount = marketTerms.filter(term => lowerIdea.includes(term)).length;
    potential += marketWordCount * 10;
    
    return Math.min(potential, 100);
  }
}