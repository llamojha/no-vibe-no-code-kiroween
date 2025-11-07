import { Analysis } from '../entities/Analysis';
import { Category } from '../value-objects/Category';
import { Score } from '../value-objects/Score';
import { BusinessRuleViolationError } from '../../shared/types/errors';

/**
 * Hackathon project evaluation result
 */
export interface HackathonEvaluationResult {
  recommendedCategory: Category;
  categoryFitScore: Score;
  alternativeCategories: Array<{
    category: Category;
    fitScore: Score;
    reason: string;
  }>;
  improvementSuggestions: string[];
  competitiveAdvantages: string[];
}

/**
 * Category matching criteria for hackathon projects
 */
export interface CategoryMatchingCriteria {
  keywordMatches: string[];
  conceptAlignment: number; // 0-100
  implementationComplexity: number; // 0-100
  creativityLevel: number; // 0-100
}

/**
 * Hackathon project metadata
 */
export interface HackathonProjectMetadata {
  projectName: string;
  description: string;
  kiroUsage: string;
  githubUrl?: string;
  demoUrl?: string;
  videoUrl?: string;
  screenshots?: string[];
  teamSize: number;
  timeSpent?: number;
}

/**
 * Domain service for hackathon-specific analysis and business rules
 * Contains specialized logic for hackathon project evaluation
 */
export class HackathonAnalysisService {
  /**
   * Evaluate a project and recommend the best hackathon category
   */
  evaluateProjectForCategory(
    analysis: Analysis,
    metadata: HackathonProjectMetadata
  ): HackathonEvaluationResult {
    const categories = Category.getHackathonCategories();
    const evaluations = categories.map(categoryValue => {
      const category = Category.createHackathon(categoryValue);
      const criteria = this.assessCategoryFit(analysis, metadata, category);
      
      return {
        category,
        fitScore: Score.create(criteria.conceptAlignment),
        criteria,
        reason: this.generateCategoryFitReason(criteria, category)
      };
    });

    // Sort by fit score
    evaluations.sort((a, b) => b.fitScore.value - a.fitScore.value);
    
    const best = evaluations[0];
    const alternatives = evaluations.slice(1, 3); // Top 2 alternatives

    return {
      recommendedCategory: best.category,
      categoryFitScore: best.fitScore,
      alternativeCategories: alternatives.map(evaluation => ({
        category: evaluation.category,
        fitScore: evaluation.fitScore,
        reason: evaluation.reason
      })),
      improvementSuggestions: this.generateImprovementSuggestions(analysis, metadata, best.category),
      competitiveAdvantages: this.identifyCompetitiveAdvantages(analysis, metadata, best.category)
    };
  }

  /**
   * Validate hackathon project submission
   */
  validateHackathonSubmission(
    analysis: Analysis,
    metadata: HackathonProjectMetadata
  ): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!metadata.projectName || metadata.projectName.trim().length === 0) {
      errors.push('Project name is required');
    }

    if (!metadata.description || metadata.description.trim().length < 50) {
      errors.push('Project description must be at least 50 characters');
    }

    if (!metadata.kiroUsage || metadata.kiroUsage.trim().length < 30) {
      errors.push('Kiro usage description must be at least 30 characters');
    }

    // Team size validation
    if (metadata.teamSize < 1 || metadata.teamSize > 10) {
      errors.push('Team size must be between 1 and 10 members');
    }

    // URL validation
    if (metadata.githubUrl && !this.isValidUrl(metadata.githubUrl)) {
      errors.push('GitHub URL is not valid');
    }

    if (metadata.demoUrl && !this.isValidUrl(metadata.demoUrl)) {
      errors.push('Demo URL is not valid');
    }

    if (metadata.videoUrl && !this.isValidUrl(metadata.videoUrl)) {
      errors.push('Video URL is not valid');
    }

    // Warnings for missing optional elements
    if (!metadata.githubUrl) {
      warnings.push('Consider adding a GitHub repository link for better evaluation');
    }

    if (!metadata.demoUrl) {
      warnings.push('A live demo URL would strengthen your submission');
    }

    if (!metadata.screenshots || metadata.screenshots.length === 0) {
      warnings.push('Screenshots would help showcase your project visually');
    }

    if (metadata.teamSize === 1) {
      warnings.push('Solo projects are impressive but consider the collaboration aspect');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate category-specific improvement suggestions
   */
  generateCategoryImprovements(
    analysis: Analysis,
    category: Category
  ): string[] {
    if (!category.isHackathon) {
      throw new BusinessRuleViolationError('Category must be a hackathon category');
    }

    const suggestions: string[] = [];
    const idea = analysis.idea.toLowerCase();

    switch (category.value) {
      case 'resurrection':
        suggestions.push(...this.getResurrectionSuggestions(idea));
        break;
      case 'frankenstein':
        suggestions.push(...this.getFrankensteinSuggestions(idea));
        break;
      case 'skeleton-crew':
        suggestions.push(...this.getSkeletonCrewSuggestions(idea));
        break;
      case 'costume-contest':
        suggestions.push(...this.getCostumeContestSuggestions(idea));
        break;
    }

    return suggestions;
  }

  /**
   * Calculate competitive advantage score for a hackathon project
   */
  calculateCompetitiveAdvantage(
    analysis: Analysis,
    metadata: HackathonProjectMetadata,
    category: Category
  ): {
    overallAdvantage: Score;
    advantages: Array<{
      factor: string;
      impact: 'high' | 'medium' | 'low';
      description: string;
    }>;
  } {
    const advantages: Array<{
      factor: string;
      impact: 'high' | 'medium' | 'low';
      description: string;
    }> = [];

    let advantageScore = 50; // Base score

    // Technical implementation advantage
    if (metadata.githubUrl && metadata.demoUrl) {
      advantages.push({
        factor: 'Complete Implementation',
        impact: 'high',
        description: 'Both code repository and live demo available'
      });
      advantageScore += 15;
    }

    // Visual presentation advantage
    if (metadata.screenshots && metadata.screenshots.length >= 3) {
      advantages.push({
        factor: 'Strong Visual Presentation',
        impact: 'medium',
        description: 'Multiple screenshots showcase the project effectively'
      });
      advantageScore += 10;
    }

    // Team collaboration advantage
    if (metadata.teamSize > 1 && metadata.teamSize <= 4) {
      advantages.push({
        factor: 'Optimal Team Size',
        impact: 'medium',
        description: 'Good balance of collaboration and coordination'
      });
      advantageScore += 8;
    }

    // Kiro integration advantage
    if (this.hasStrongKiroIntegration(metadata.kiroUsage)) {
      advantages.push({
        factor: 'Excellent Kiro Integration',
        impact: 'high',
        description: 'Demonstrates deep understanding and creative use of Kiro'
      });
      advantageScore += 12;
    }

    // Category fit advantage
    const categoryFit = this.assessCategoryFit(analysis, metadata, category);
    if (categoryFit.conceptAlignment > 80) {
      advantages.push({
        factor: 'Perfect Category Fit',
        impact: 'high',
        description: 'Project aligns excellently with category requirements'
      });
      advantageScore += 10;
    }

    return {
      overallAdvantage: Score.create(Math.min(advantageScore, 100)),
      advantages
    };
  }

  /**
   * Compare hackathon projects within the same category
   */
  compareHackathonProjects(
    project1: { analysis: Analysis; metadata: HackathonProjectMetadata },
    project2: { analysis: Analysis; metadata: HackathonProjectMetadata },
    category: Category
  ): {
    winner: 'project1' | 'project2' | 'tie';
    scoreDifference: number;
    comparisonFactors: Array<{
      factor: string;
      project1Score: number;
      project2Score: number;
      winner: 'project1' | 'project2' | 'tie';
    }>;
  } {
    const factors = [
      'implementation',
      'creativity',
      'kiro_integration',
      'presentation',
      'category_fit'
    ];

    const comparisonFactors = factors.map(factor => {
      const score1 = this.evaluateProjectFactor(project1, factor, category);
      const score2 = this.evaluateProjectFactor(project2, factor, category);
      
      let winner: 'project1' | 'project2' | 'tie' = 'tie';
      if (Math.abs(score1 - score2) > 5) {
        winner = score1 > score2 ? 'project1' : 'project2';
      }

      return {
        factor,
        project1Score: score1,
        project2Score: score2,
        winner
      };
    });

    const totalScore1 = comparisonFactors.reduce((sum, f) => sum + f.project1Score, 0);
    const totalScore2 = comparisonFactors.reduce((sum, f) => sum + f.project2Score, 0);
    
    const scoreDifference = Math.abs(totalScore1 - totalScore2);
    let overallWinner: 'project1' | 'project2' | 'tie' = 'tie';
    
    if (scoreDifference > 10) {
      overallWinner = totalScore1 > totalScore2 ? 'project1' : 'project2';
    }

    return {
      winner: overallWinner,
      scoreDifference,
      comparisonFactors
    };
  }

  // Private helper methods
  private assessCategoryFit(
    analysis: Analysis,
    metadata: HackathonProjectMetadata,
    category: Category
  ): CategoryMatchingCriteria {
    const idea = analysis.idea.toLowerCase();
    const description = metadata.description.toLowerCase();
    const combinedText = `${idea} ${description}`;

    let conceptAlignment = 50;
    let implementationComplexity = 50;
    let creativityLevel = 50;
    const keywordMatches: string[] = [];

    switch (category.value) {
      case 'resurrection':
        const resurrectionKeywords = ['legacy', 'old', 'revive', 'modernize', 'update', 'refresh', 'outdated'];
        keywordMatches.push(...resurrectionKeywords.filter(kw => combinedText.includes(kw)));
        conceptAlignment = Math.min(50 + (keywordMatches.length * 15), 95);
        break;

      case 'frankenstein':
        const frankensteinKeywords = ['combine', 'merge', 'integrate', 'hybrid', 'mix', 'blend', 'fusion'];
        keywordMatches.push(...frankensteinKeywords.filter(kw => combinedText.includes(kw)));
        conceptAlignment = Math.min(50 + (keywordMatches.length * 15), 95);
        implementationComplexity += 10; // Combining things is complex
        break;

      case 'skeleton-crew':
        const skeletonKeywords = ['framework', 'foundation', 'structure', 'base', 'core', 'platform'];
        keywordMatches.push(...skeletonKeywords.filter(kw => combinedText.includes(kw)));
        conceptAlignment = Math.min(50 + (keywordMatches.length * 15), 95);
        break;

      case 'costume-contest':
        const costumeKeywords = ['ui', 'design', 'visual', 'interface', 'appearance', 'style', 'beautiful'];
        keywordMatches.push(...costumeKeywords.filter(kw => combinedText.includes(kw)));
        conceptAlignment = Math.min(50 + (keywordMatches.length * 15), 95);
        creativityLevel += 15; // Design-focused projects need creativity
        break;
    }

    return {
      keywordMatches,
      conceptAlignment,
      implementationComplexity,
      creativityLevel
    };
  }

  private generateCategoryFitReason(criteria: CategoryMatchingCriteria, category: Category): string {
    const { keywordMatches, conceptAlignment } = criteria;
    
    if (conceptAlignment >= 80) {
      return `Excellent fit for ${category.displayName} with strong keyword matches: ${keywordMatches.join(', ')}`;
    } else if (conceptAlignment >= 60) {
      return `Good fit for ${category.displayName} with some relevant elements`;
    } else {
      return `Limited fit for ${category.displayName} - consider emphasizing relevant aspects`;
    }
  }

  private generateImprovementSuggestions(
    analysis: Analysis,
    metadata: HackathonProjectMetadata,
    category: Category
  ): string[] {
    const suggestions: string[] = [];

    // General improvements
    if (analysis.idea.length < 200) {
      suggestions.push('Expand your project description with more technical details');
    }

    if (!metadata.githubUrl) {
      suggestions.push('Add a GitHub repository to showcase your code');
    }

    if (!metadata.demoUrl) {
      suggestions.push('Deploy a live demo to let judges interact with your project');
    }

    // Category-specific improvements
    suggestions.push(...this.generateCategoryImprovements(analysis, category));

    return suggestions;
  }

  private identifyCompetitiveAdvantages(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _analysis: Analysis,
    metadata: HackathonProjectMetadata,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _category: Category
  ): string[] {
    const advantages: string[] = [];

    if (metadata.githubUrl && metadata.demoUrl) {
      advantages.push('Complete implementation with both code and live demo');
    }

    if (metadata.teamSize > 1) {
      advantages.push('Collaborative team effort demonstrating coordination skills');
    }

    if (this.hasStrongKiroIntegration(metadata.kiroUsage)) {
      advantages.push('Excellent integration and creative use of Kiro features');
    }

    if (metadata.screenshots && metadata.screenshots.length >= 3) {
      advantages.push('Strong visual presentation with comprehensive screenshots');
    }

    return advantages;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private getResurrectionSuggestions(_idea: string): string[] {
    return [
      'Emphasize what legacy technology or concept you\'re modernizing',
      'Explain the specific improvements over the original version',
      'Show before/after comparisons to highlight the transformation'
    ];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private getFrankensteinSuggestions(_idea: string): string[] {
    return [
      'Clearly identify the different technologies or concepts being combined',
      'Explain why this combination creates unique value',
      'Address potential integration challenges and solutions'
    ];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private getSkeletonCrewSuggestions(_idea: string): string[] {
    return [
      'Focus on the foundational aspects and core architecture',
      'Explain how others can build upon your framework',
      'Demonstrate extensibility and modularity'
    ];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private getCostumeContestSuggestions(_idea: string): string[] {
    return [
      'Highlight the visual design and user interface elements',
      'Include mockups, wireframes, or design prototypes',
      'Explain the user experience and design decisions'
    ];
  }

  private hasStrongKiroIntegration(kiroUsage: string): boolean {
    const strongIndicators = ['extensively', 'creatively', 'innovative', 'multiple features', 'advanced'];
    const lowerUsage = kiroUsage.toLowerCase();
    return strongIndicators.some(indicator => lowerUsage.includes(indicator)) && kiroUsage.length > 100;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private evaluateProjectFactor(
    project: { analysis: Analysis; metadata: HackathonProjectMetadata },
    factor: string,
    category: Category
  ): number {
    const { analysis, metadata } = project;
    
    switch (factor) {
      case 'implementation':
        let implScore = 40;
        if (metadata.githubUrl) implScore += 20;
        if (metadata.demoUrl) implScore += 25;
        if (metadata.videoUrl) implScore += 10;
        return Math.min(implScore, 95);

      case 'creativity':
        return this.assessCreativity(analysis, metadata);

      case 'kiro_integration':
        return this.hasStrongKiroIntegration(metadata.kiroUsage) ? 85 : 60;

      case 'presentation':
        let presScore = 50;
        if (metadata.screenshots && metadata.screenshots.length > 0) presScore += 15;
        if (metadata.videoUrl) presScore += 20;
        if (analysis.idea.length > 200) presScore += 10;
        return Math.min(presScore, 95);

      case 'category_fit':
        const fit = this.assessCategoryFit(analysis, metadata, category);
        return fit.conceptAlignment;

      default:
        return 50;
    }
  }

  private assessCreativity(analysis: Analysis, metadata: HackathonProjectMetadata): number {
    let creativity = 50;
    
    const uniqueWords = ['innovative', 'unique', 'creative', 'novel', 'original'];
    const combinedText = `${analysis.idea} ${metadata.description}`.toLowerCase();
    
    creativity += uniqueWords.filter(word => combinedText.includes(word)).length * 8;
    
    if (metadata.teamSize === 1) creativity += 5; // Solo creativity bonus
    if (analysis.suggestions.length > 3) creativity += 10;
    
    return Math.min(creativity, 95);
  }
}