/**
 * Value object representing evaluation criteria in the analysis system
 * Supports different types of criteria for various analysis contexts
 */
export class Criteria {
  private readonly _name: string;
  private readonly _description: string;
  private readonly _weight: number;
  private readonly _type: 'general' | 'hackathon';

  private constructor(name: string, description: string, weight: number, type: 'general' | 'hackathon') {
    this._name = name;
    this._description = description;
    this._weight = weight;
    this._type = type;
  }

  /**
   * Predefined general analysis criteria
   */
  private static readonly GENERAL_CRITERIA = {
    'market-potential': {
      name: 'Market Potential',
      description: 'Potential market size and opportunity for the idea',
      weight: 0.25
    },
    'technical-feasibility': {
      name: 'Technical Feasibility', 
      description: 'Technical complexity and implementation feasibility',
      weight: 0.25
    },
    'innovation-level': {
      name: 'Innovation Level',
      description: 'Uniqueness and novelty of the proposed solution',
      weight: 0.25
    },
    'business-viability': {
      name: 'Business Viability',
      description: 'Potential for sustainable business model and profitability',
      weight: 0.25
    }
  } as const;

  /**
   * Predefined hackathon criteria
   */
  private static readonly HACKATHON_CRITERIA = {
    'potential-value': {
      name: 'Potential Value',
      description: 'Overall potential and value proposition of the project',
      weight: 0.33
    },
    'implementation': {
      name: 'Implementation',
      description: 'Quality of implementation and use of Kiro features',
      weight: 0.33
    },
    'quality-design': {
      name: 'Quality and Design',
      description: 'Overall quality, creativity, and design of the project',
      weight: 0.34
    }
  } as const;

  /**
   * Create a general analysis criteria
   */
  static createGeneral(key: keyof typeof Criteria.GENERAL_CRITERIA): Criteria {
    const criteriaData = this.GENERAL_CRITERIA[key];
    if (!criteriaData) {
      throw new Error(`Invalid general criteria key: ${key}`);
    }
    
    return new Criteria(
      criteriaData.name,
      criteriaData.description,
      criteriaData.weight,
      'general'
    );
  }

  /**
   * Create a hackathon criteria
   */
  static createHackathon(key: keyof typeof Criteria.HACKATHON_CRITERIA): Criteria {
    const criteriaData = this.HACKATHON_CRITERIA[key];
    if (!criteriaData) {
      throw new Error(`Invalid hackathon criteria key: ${key}`);
    }
    
    return new Criteria(
      criteriaData.name,
      criteriaData.description,
      criteriaData.weight,
      'hackathon'
    );
  }

  /**
   * Create custom criteria
   */
  static createCustom(
    name: string, 
    description: string, 
    weight: number, 
    type: 'general' | 'hackathon' = 'general'
  ): Criteria {
    if (!name || name.trim().length === 0) {
      throw new Error('Criteria name cannot be empty');
    }
    
    if (!description || description.trim().length === 0) {
      throw new Error('Criteria description cannot be empty');
    }
    
    if (weight < 0 || weight > 1) {
      throw new Error('Criteria weight must be between 0 and 1');
    }
    
    return new Criteria(name.trim(), description.trim(), weight, type);
  }

  /**
   * Create Criteria for reconstruction from persistence
   */
  static reconstruct(name: string, description: string, weight: number, type: 'general' | 'hackathon'): Criteria {
    return new Criteria(name, description, weight, type);
  }

  /**
   * Get all general criteria
   */
  static getAllGeneralCriteria(): Criteria[] {
    return Object.keys(this.GENERAL_CRITERIA).map(key => 
      this.createGeneral(key as keyof typeof this.GENERAL_CRITERIA)
    );
  }

  /**
   * Get all hackathon criteria
   */
  static getAllHackathonCriteria(): Criteria[] {
    return Object.keys(this.HACKATHON_CRITERIA).map(key => 
      this.createHackathon(key as keyof typeof this.HACKATHON_CRITERIA)
    );
  }

  /**
   * Get the criteria name
   */
  get name(): string {
    return this._name;
  }

  /**
   * Get the criteria description
   */
  get description(): string {
    return this._description;
  }

  /**
   * Get the criteria weight (0-1)
   */
  get weight(): number {
    return this._weight;
  }

  /**
   * Get the criteria type
   */
  get type(): 'general' | 'hackathon' {
    return this._type;
  }

  /**
   * Check if this is a general criteria
   */
  get isGeneral(): boolean {
    return this._type === 'general';
  }

  /**
   * Check if this is a hackathon criteria
   */
  get isHackathon(): boolean {
    return this._type === 'hackathon';
  }

  /**
   * Get weight as percentage
   */
  get weightPercentage(): string {
    return `${Math.round(this._weight * 100)}%`;
  }

  /**
   * Check if two criteria are equal
   */
  equals(other: Criteria): boolean {
    return this._name === other._name && 
           this._description === other._description &&
           this._weight === other._weight &&
           this._type === other._type;
  }

  /**
   * Get string representation of the criteria
   */
  toString(): string {
    return `${this._name} (${this.weightPercentage})`;
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): {
    name: string;
    description: string;
    weight: number;
    type: 'general' | 'hackathon';
  } {
    return {
      name: this._name,
      description: this._description,
      weight: this._weight,
      type: this._type
    };
  }
}