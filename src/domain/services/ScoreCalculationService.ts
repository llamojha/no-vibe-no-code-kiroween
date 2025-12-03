import { Analysis } from '../entities/Analysis';
import { Score } from '../value-objects/Score';
import { Category } from '../value-objects/Category';
import { Criteria } from '../value-objects/Criteria';

/**
 * Detailed score breakdown for transparency
 */
export interface ScoreBreakdown {
  totalScore: Score;
  criteriaScores: Array<{
    criteria: Criteria;
    score: Score;
    weight: number;
    justification: string;
  }>;
  bonusPoints: number;
  penaltyPoints: number;
  finalAdjustments: string[];
}

/**
 * Score calculation context with additional data
 */
export interface ScoreCalculationContext {
  analysis: Analysis;
  category?: Category;
  additionalFactors?: {
    hasVisualMaterials?: boolean;
    hasImplementation?: boolean;
    teamSize?: number;
    timeSpent?: number;
    previousAnalyses?: Analysis[];
  };
}

/**
 * Domain service for score calculation and analysis scoring logic
 * Contains pure business logic for determining analysis scores
 */
export class ScoreCalculationService {
  /**
   * Calculate comprehensive score for an analysis
   */
  calculateAnalysisScore(context: ScoreCalculationContext): ScoreBreakdown {
    const { category } = context;
    
    // Determine criteria based on category
    const criteria = this.getCriteriaForCategory(category);
    
    // Calculate individual criteria scores
    const criteriaScores = criteria.map(criterion => ({
      criteria: criterion,
      score: this.calculateCriteriaScore(criterion, context),
      weight: criterion.weight,
      justification: this.generateCriteriaJustification(criterion, context)
    }));

    // Calculate weighted total
    const weightedTotal = criteriaScores.reduce(
      (total, item) => total + (item.score.value * item.weight), 
      0
    );

    // Apply bonuses and penalties
    const bonusPoints = this.calculateBonusPoints(context);
    const penaltyPoints = this.calculatePenaltyPoints(context);
    
    // Calculate final score
    const finalScore = Math.max(0, Math.min(100, weightedTotal + bonusPoints - penaltyPoints));
    
    const finalAdjustments = this.generateFinalAdjustments(
      weightedTotal, 
      bonusPoints, 
      penaltyPoints, 
      context
    );

    return {
      totalScore: Score.create(finalScore),
      criteriaScores,
      bonusPoints,
      penaltyPoints,
      finalAdjustments
    };
  }

  /**
   * Calculate score for hackathon-specific analysis
   */
  calculateHackathonScore(context: ScoreCalculationContext): ScoreBreakdown {
    if (!context.category || !context.category.isHackathon) {
      throw new Error('Hackathon score calculation requires a hackathon category');
    }

    // Use hackathon-specific criteria
    const criteria = [
      Criteria.createHackathon('potential-value'),
      Criteria.createHackathon('implementation'),
      Criteria.createHackathon('quality-design')
    ];

    const criteriaScores = criteria.map(criterion => ({
      criteria: criterion,
      score: this.calculateHackathonCriteriaScore(criterion, context),
      weight: criterion.weight,
      justification: this.generateHackathonJustification(criterion, context)
    }));

    const weightedTotal = criteriaScores.reduce(
      (total, item) => total + (item.score.value * item.weight), 
      0
    );

    // Hackathon-specific bonuses
    const bonusPoints = this.calculateHackathonBonusPoints(context);
    const penaltyPoints = this.calculateHackathonPenaltyPoints(context);
    
    const finalScore = Math.max(0, Math.min(100, weightedTotal + bonusPoints - penaltyPoints));
    
    const finalAdjustments = this.generateHackathonAdjustments(
      weightedTotal, 
      bonusPoints, 
      penaltyPoints, 
      context
    );

    return {
      totalScore: Score.create(finalScore),
      criteriaScores,
      bonusPoints,
      penaltyPoints,
      finalAdjustments
    };
  }

  /**
   * Recalculate score when analysis is updated
   */
  recalculateScore(
    currentAnalysis: Analysis, 
    updatedContent: Partial<{ idea: string; feedback: string; suggestions: string[] }>
  ): Score {
    // Create temporary analysis with updated content for calculation
    const tempContext: ScoreCalculationContext = {
      analysis: currentAnalysis,
      category: currentAnalysis.category
    };

    // If idea is updated, recalculate completely
    if (updatedContent.idea) {
      const breakdown = this.calculateAnalysisScore(tempContext);
      return breakdown.totalScore;
    }

    // For other updates, apply incremental adjustments
    let adjustedScore = currentAnalysis.score.value;

    if (updatedContent.feedback) {
      adjustedScore += this.calculateFeedbackQualityBonus(updatedContent.feedback);
    }

    if (updatedContent.suggestions) {
      adjustedScore += this.calculateSuggestionsBonus(updatedContent.suggestions);
    }

    return Score.create(Math.max(0, Math.min(100, adjustedScore)));
  }

  /**
   * Compare scores between analyses
   */
  compareAnalyses(analysis1: Analysis, analysis2: Analysis): {
    scoreDifference: number;
    betterAnalysis: Analysis;
    comparisonInsights: string[];
  } {
    const scoreDiff = analysis1.score.value - analysis2.score.value;
    const betterAnalysis = scoreDiff >= 0 ? analysis1 : analysis2;
    
    const insights: string[] = [];
    
    if (Math.abs(scoreDiff) < 5) {
      insights.push('The analyses have very similar scores');
    } else if (Math.abs(scoreDiff) > 20) {
      insights.push('There is a significant score difference between the analyses');
    }

    if (analysis1.category && analysis2.category && !analysis1.category.equals(analysis2.category)) {
      insights.push('The analyses are in different categories, which may affect comparison');
    }

    if (analysis1.locale && analysis2.locale && !analysis1.locale.equals(analysis2.locale)) {
      insights.push('The analyses are in different languages');
    }

    return {
      scoreDifference: Math.abs(scoreDiff),
      betterAnalysis,
      comparisonInsights: insights
    };
  }

  // Private helper methods
  private getCriteriaForCategory(category?: Category): Criteria[] {
    if (!category) {
      return Criteria.getAllGeneralCriteria();
    }

    if (category.isHackathon) {
      return Criteria.getAllHackathonCriteria();
    }

    return Criteria.getAllGeneralCriteria();
  }

  private calculateCriteriaScore(criteria: Criteria, context: ScoreCalculationContext): Score {
    const { analysis } = context;
    const idea = analysis.idea.toLowerCase();
    
    let baseScore = 50; // Start with neutral score

    switch (criteria.name) {
      case 'Market Potential':
        baseScore = this.assessMarketPotential(idea);
        break;
      case 'Technical Feasibility':
        baseScore = this.assessTechnicalFeasibility(idea);
        break;
      case 'Innovation Level':
        baseScore = this.assessInnovationLevel(idea);
        break;
      case 'Business Viability':
        baseScore = this.assessBusinessViability(idea);
        break;
      default:
        baseScore = this.assessGenericCriteria(idea);
    }

    return Score.create(baseScore);
  }

  private calculateHackathonCriteriaScore(criteria: Criteria, context: ScoreCalculationContext): Score {
    const { analysis, additionalFactors } = context;
    let baseScore = 50;

    switch (criteria.name) {
      case 'Potential Value':
        baseScore = this.assessPotentialValue(analysis, additionalFactors);
        break;
      case 'Implementation':
        baseScore = this.assessImplementationQuality(analysis, additionalFactors);
        break;
      case 'Quality and Design':
        baseScore = this.assessQualityAndDesign(analysis, additionalFactors);
        break;
    }

    return Score.create(baseScore);
  }

  private calculateBonusPoints(context: ScoreCalculationContext): number {
    let bonus = 0;
    const { analysis, additionalFactors } = context;

    // Bonus for detailed feedback
    if (analysis.feedback && analysis.feedback.length > 200) {
      bonus += 2;
    }

    // Bonus for multiple suggestions
    if (analysis.suggestions.length >= 3) {
      bonus += 3;
    }

    // Bonus for additional materials
    if (additionalFactors?.hasVisualMaterials) {
      bonus += 5;
    }

    if (additionalFactors?.hasImplementation) {
      bonus += 5;
    }

    return Math.min(bonus, 10); // Cap at 10 bonus points
  }

  private calculatePenaltyPoints(context: ScoreCalculationContext): number {
    let penalty = 0;
    const { analysis } = context;

    // Penalty for very short ideas
    if (analysis.idea.length < 50) {
      penalty += 5;
    }

    // Penalty for no feedback on completed analysis
    if (analysis.isCompleted() && !analysis.feedback) {
      penalty += 3;
    }

    return Math.min(penalty, 15); // Cap at 15 penalty points
  }

  private calculateHackathonBonusPoints(context: ScoreCalculationContext): number {
    let bonus = 0;
    const { additionalFactors } = context;

    if (additionalFactors?.hasVisualMaterials) bonus += 3;
    if (additionalFactors?.hasImplementation) bonus += 5;
    if (additionalFactors?.teamSize && typeof additionalFactors.teamSize === 'number' && additionalFactors.teamSize > 1) bonus += 2;

    return Math.min(bonus, 10);
  }

  private calculateHackathonPenaltyPoints(context: ScoreCalculationContext): number {
    let penalty = 0;
    const { analysis } = context;

    if (analysis.idea.length < 100) penalty += 3;
    if (!analysis.category) penalty += 5;

    return Math.min(penalty, 10);
  }

  private generateCriteriaJustification(criteria: Criteria, context: ScoreCalculationContext): string {
    const score = this.calculateCriteriaScore(criteria, context).value;
    
    if (score >= 80) {
      return `Excellent ${criteria.name.toLowerCase()} with strong potential and clear value proposition.`;
    } else if (score >= 60) {
      return `Good ${criteria.name.toLowerCase()} with solid foundation and room for improvement.`;
    } else if (score >= 40) {
      return `Average ${criteria.name.toLowerCase()} that needs development and refinement.`;
    } else {
      return `Below average ${criteria.name.toLowerCase()} requiring significant improvement.`;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private generateHackathonJustification(criteria: Criteria, _context: ScoreCalculationContext): string {
    return `Hackathon ${criteria.name}: Evaluated based on creativity, implementation quality, and category fit.`;
  }

  private generateFinalAdjustments(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    baseScore: number, 
    bonus: number, 
    penalty: number, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _context: ScoreCalculationContext
  ): string[] {
    const adjustments: string[] = [];
    
    if (bonus > 0) {
      adjustments.push(`+${bonus} bonus points for additional quality factors`);
    }
    
    if (penalty > 0) {
      adjustments.push(`-${penalty} penalty points for areas needing improvement`);
    }

    return adjustments;
  }

  private generateHackathonAdjustments(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    baseScore: number, 
    bonus: number, 
    penalty: number, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _context: ScoreCalculationContext
  ): string[] {
    const adjustments: string[] = [];
    
    if (bonus > 0) {
      adjustments.push(`+${bonus} hackathon bonus for implementation and materials`);
    }
    
    if (penalty > 0) {
      adjustments.push(`-${penalty} penalty for missing elements`);
    }

    return adjustments;
  }

  // Assessment helper methods
  private assessMarketPotential(idea: string): number {
    const marketKeywords = ['users', 'customers', 'market', 'demand', 'problem', 'solution', 'revenue'];
    const matches = marketKeywords.filter(keyword => idea.includes(keyword)).length;
    return Math.min(40 + (matches * 10), 90);
  }

  private assessTechnicalFeasibility(idea: string): number {
    const complexKeywords = ['ai', 'blockchain', 'quantum', 'machine learning'];
    const simpleKeywords = ['website', 'app', 'dashboard', 'api'];
    
    let score = 60;
    if (complexKeywords.some(keyword => idea.includes(keyword))) score -= 15;
    if (simpleKeywords.some(keyword => idea.includes(keyword))) score += 15;
    
    return Math.max(20, Math.min(score, 95));
  }

  private assessInnovationLevel(idea: string): number {
    const innovativeKeywords = ['new', 'novel', 'unique', 'innovative', 'revolutionary'];
    const commonKeywords = ['standard', 'typical', 'common', 'usual'];
    
    let score = 50;
    score += innovativeKeywords.filter(keyword => idea.includes(keyword)).length * 8;
    score -= commonKeywords.filter(keyword => idea.includes(keyword)).length * 10;
    
    return Math.max(10, Math.min(score, 95));
  }

  private assessBusinessViability(idea: string): number {
    const viabilityKeywords = ['profitable', 'sustainable', 'scalable', 'monetize', 'business model'];
    const matches = viabilityKeywords.filter(keyword => idea.includes(keyword)).length;
    return Math.min(35 + (matches * 12), 90);
  }

  private assessGenericCriteria(idea: string): number {
    // Generic assessment based on idea length and structure
    let score = 50;
    if (idea.length > 100) score += 10;
    if (idea.length > 300) score += 10;
    return Math.min(score, 85);
  }

  private assessPotentialValue(analysis: Analysis, additionalFactors?: Record<string, unknown>): number {
    let score = 50;
    
    if (analysis.idea.length > 200) score += 15;
    if (analysis.suggestions.length > 2) score += 10;
    if (additionalFactors?.hasVisualMaterials) score += 10;
    
    return Math.min(score, 95);
  }

  private assessImplementationQuality(analysis: Analysis, additionalFactors?: Record<string, unknown>): number {
    let score = 45;
    
    if (additionalFactors?.hasImplementation) score += 25;
    if (analysis.feedback && analysis.feedback.length > 100) score += 15;
    if (additionalFactors?.teamSize && typeof additionalFactors.teamSize === 'number' && additionalFactors.teamSize > 1) score += 10;
    
    return Math.min(score, 95);
  }

  private assessQualityAndDesign(analysis: Analysis, additionalFactors?: Record<string, unknown>): number {
    let score = 50;
    
    if (additionalFactors?.hasVisualMaterials) score += 20;
    if (analysis.idea.includes('design') || analysis.idea.includes('ui')) score += 15;
    
    return Math.min(score, 95);
  }

  private calculateFeedbackQualityBonus(feedback: string): number {
    if (feedback.length > 200) return 2;
    if (feedback.length > 100) return 1;
    return 0;
  }

  private calculateSuggestionsBonus(suggestions: string[]): number {
    if (suggestions.length >= 5) return 3;
    if (suggestions.length >= 3) return 2;
    if (suggestions.length >= 1) return 1;
    return 0;
  }
}