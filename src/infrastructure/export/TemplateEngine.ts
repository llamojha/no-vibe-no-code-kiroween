/**
 * TemplateEngine service
 *
 * Loads and populates file templates with extracted content.
 * Handles variable substitution and conditional rendering for optional sections.
 *
 * Requirements: 2.1, 3.1, 4.1, 5.1, 7.1
 */

import type {
  ProductContent,
  TechContent,
  ArchitectureContent,
  RoadmapItem,
} from "./types";

/**
 * Template variable pattern: {{variableName}}
 */
const VARIABLE_PATTERN = /\{\{(\w+(?:\.\w+)*)\}\}/g;

/**
 * Conditional block pattern: {{#if condition}}...{{/if}}
 */
const CONDITIONAL_PATTERN =
  /\{\{#if\s+(\w+(?:\.\w+)*)\}\}([\s\S]*?)\{\{\/if\}\}/g;

/**
 * Loop pattern: {{#each items}}...{{/each}}
 */
const LOOP_PATTERN = /\{\{#each\s+(\w+(?:\.\w+)*)\}\}([\s\S]*?)\{\{\/each\}\}/g;

/**
 * Template data for example spec generation
 */
export interface ExampleSpecData {
  featureName: string;
  userStory: string;
  acceptanceCriteria: string[];
  technicalApproach: string;
  tasks: string[];
}

/**
 * Full template data for all templates
 */
export interface FullTemplateData {
  ideaName: string;
  timestamp: string;
  product: ProductContent;
  tech: TechContent;
  architecture: ArchitectureContent;
  exampleSpec: ExampleSpecData;
  roadmapContent?: string;
}

/**
 * Template engine for loading and populating file templates
 */
export class TemplateEngine {
  private templates: Map<string, string> = new Map();

  /**
   * Load a template by name
   * @param templateName - Name of the template (e.g., 'product.md', 'tech.md')
   * @returns Template content string
   */
  loadTemplate(templateName: string): string {
    // Check cache first
    if (this.templates.has(templateName)) {
      return this.templates.get(templateName)!;
    }

    // Get template content from predefined templates
    const template = this.getTemplateContent(templateName);
    this.templates.set(templateName, template);
    return template;
  }

  /**
   * Populate a template with data
   * @param template - Template string with placeholders
   * @param data - Data object for variable substitution
   * @returns Populated template string
   */
  populate(template: string, data: Record<string, unknown>): string {
    let result = template;

    // Process conditionals first
    result = this.processConditionals(result, data);

    // Process loops
    result = this.processLoops(result, data);

    // Process variable substitutions
    result = this.processVariables(result, data);

    return result;
  }

  /**
   * Generate a file from a template
   * @param templateName - Name of the template to use
   * @param data - Data for template population
   * @returns Generated file content
   */
  generateFile(templateName: string, data: Record<string, unknown>): string {
    const template = this.loadTemplate(templateName);
    return this.populate(template, data);
  }

  /**
   * Generate product steering file
   */
  generateProductSteering(product: ProductContent, ideaName: string): string {
    return this.generateFile("product.md", { ...product, ideaName });
  }

  /**
   * Generate tech steering file
   */
  generateTechSteering(tech: TechContent, ideaName: string): string {
    return this.generateFile("tech.md", { ...tech, ideaName });
  }

  /**
   * Generate architecture steering file
   */
  generateArchitectureSteering(
    architecture: ArchitectureContent,
    ideaName: string
  ): string {
    return this.generateFile("architecture.md", { ...architecture, ideaName });
  }

  /**
   * Generate spec-generation steering file
   */
  generateSpecGenerationSteering(ideaName: string): string {
    return this.generateFile("spec-generation.md", { ideaName });
  }

  /**
   * Generate README file
   */
  generateReadme(ideaName: string, timestamp: string): string {
    return this.generateFile("README.md", { ideaName, timestamp });
  }

  /**
   * Generate example spec requirements file
   */
  generateExampleRequirements(spec: ExampleSpecData, ideaName: string): string {
    return this.generateFile("example-spec/requirements.md", {
      ...spec,
      ideaName,
    });
  }

  /**
   * Generate example spec design file
   */
  generateExampleDesign(spec: ExampleSpecData, ideaName: string): string {
    return this.generateFile("example-spec/design.md", { ...spec, ideaName });
  }

  /**
   * Generate example spec tasks file
   */
  generateExampleTasks(spec: ExampleSpecData, ideaName: string): string {
    return this.generateFile("example-spec/tasks.md", { ...spec, ideaName });
  }

  /**
   * Create example spec data from a roadmap item
   */
  createExampleSpecFromRoadmapItem(item: RoadmapItem): ExampleSpecData {
    return {
      featureName: this.slugify(item.title),
      userStory: item.description,
      acceptanceCriteria: item.goals,
      technicalApproach: this.generateTechnicalApproach(item),
      tasks: this.generateTasksFromGoals(item.goals),
    };
  }

  /**
   * Process conditional blocks in template
   */
  private processConditionals(
    template: string,
    data: Record<string, unknown>
  ): string {
    return template.replace(CONDITIONAL_PATTERN, (_, condition, content) => {
      const value = this.getNestedValue(data, condition);
      // Show content if value is truthy and not empty
      if (this.isTruthy(value)) {
        return content;
      }
      return "";
    });
  }

  /**
   * Process loop blocks in template
   */
  private processLoops(
    template: string,
    data: Record<string, unknown>
  ): string {
    return template.replace(LOOP_PATTERN, (_, arrayPath, content) => {
      const array = this.getNestedValue(data, arrayPath);
      if (!Array.isArray(array) || array.length === 0) {
        return "";
      }

      return array
        .map((item, index) => {
          // Create context with item and index
          const itemData =
            typeof item === "object" ? item : { value: item, item };
          return this.populate(content, {
            ...data,
            ...itemData,
            index,
            isFirst: index === 0,
            isLast: index === array.length - 1,
          });
        })
        .join("");
    });
  }

  /**
   * Process variable substitutions in template
   */
  private processVariables(
    template: string,
    data: Record<string, unknown>
  ): string {
    return template.replace(VARIABLE_PATTERN, (match, path) => {
      const value = this.getNestedValue(data, path);
      if (value === undefined || value === null) {
        return "";
      }
      if (Array.isArray(value)) {
        return value.join("\n");
      }
      return String(value);
    });
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split(".");
    let current: unknown = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      if (typeof current !== "object") {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part];
    }

    return current;
  }

  /**
   * Check if a value is truthy for conditional rendering
   */
  private isTruthy(value: unknown): boolean {
    if (value === undefined || value === null || value === false) {
      return false;
    }
    if (typeof value === "string" && value.trim() === "") {
      return false;
    }
    if (Array.isArray(value) && value.length === 0) {
      return false;
    }
    return true;
  }

  /**
   * Convert a string to a URL-friendly slug
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /**
   * Generate technical approach from roadmap item
   */
  private generateTechnicalApproach(item: RoadmapItem): string {
    const parts: string[] = [];

    parts.push(`This feature implements "${item.title}".`);

    if (item.description) {
      parts.push(`\n\n${item.description}`);
    }

    if (item.dependencies && item.dependencies.length > 0) {
      parts.push(
        `\n\n**Dependencies:**\n${item.dependencies
          .map((d) => `- ${d}`)
          .join("\n")}`
      );
    }

    parts.push(
      "\n\nRefer to the Tech Architecture document for implementation details: #[[file:docs/tech-architecture.md]]"
    );

    return parts.join("");
  }

  /**
   * Generate tasks from goals
   */
  private generateTasksFromGoals(goals: string[]): string[] {
    return goals.map((goal, index) => `${index + 1}. ${goal}`);
  }

  /**
   * Get predefined template content
   */
  private getTemplateContent(templateName: string): string {
    const templates: Record<string, string> = {
      "product.md": this.getProductTemplate(),
      "tech.md": this.getTechTemplate(),
      "architecture.md": this.getArchitectureTemplate(),
      "spec-generation.md": this.getSpecGenerationTemplate(),
      "README.md": this.getReadmeTemplate(),
      "example-spec/requirements.md": this.getExampleRequirementsTemplate(),
      "example-spec/design.md": this.getExampleDesignTemplate(),
      "example-spec/tasks.md": this.getExampleTasksTemplate(),
    };

    const template = templates[templateName];
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    return template;
  }

  /**
   * Product steering file template
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
   */
  private getProductTemplate(): string {
    return `# Product Context - {{ideaName}}

This steering file provides product context for Kiro to understand the product vision, target users, and success metrics.

## Vision
{{#if vision}}
{{vision}}
{{/if}}

## Mission
{{#if mission}}
{{mission}}
{{/if}}

## Target Users
{{#if targetUsers}}
{{targetUsers}}
{{/if}}

## User Personas
{{#if personas}}
{{personas}}
{{/if}}

## Success Metrics & KPIs
{{#if metrics}}
{{metrics}}
{{/if}}

## Constraints
{{#if constraints}}
{{constraints}}
{{/if}}

## Core Value Proposition
{{#if valueProposition}}
{{valueProposition}}
{{/if}}
`;
  }

  /**
   * Tech steering file template
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
   */
  private getTechTemplate(): string {
    return `# Technology Context - {{ideaName}}

This steering file provides technology context for Kiro to understand the tech stack, dependencies, and development environment.

## Technology Stack
{{#if stack}}
{{stack}}
{{/if}}

## Dependencies
{{#if dependencies}}
{{dependencies}}
{{/if}}

## Framework Versions & Requirements
{{#if frameworkVersions}}
{{frameworkVersions}}
{{/if}}

## Development Environment Setup
{{#if setupInstructions}}
{{setupInstructions}}
{{/if}}

## Build Configuration
{{#if buildConfig}}
{{buildConfig}}
{{/if}}

## Technical Constraints
{{#if technicalConstraints}}
{{technicalConstraints}}
{{/if}}
`;
  }

  /**
   * Architecture steering file template
   * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
   */
  private getArchitectureTemplate(): string {
    return `# Architecture Context - {{ideaName}}

This steering file provides architectural context for Kiro to follow established patterns and code organization standards.

## Architectural Patterns
{{#if patterns}}
{{patterns}}
{{/if}}

## Layer Responsibilities & Boundaries
{{#if layerResponsibilities}}
{{layerResponsibilities}}
{{/if}}

## Code Organization
{{#if codeOrganization}}
{{codeOrganization}}
{{/if}}

## Naming Conventions
{{#if namingConventions}}
{{namingConventions}}
{{/if}}

## Import Patterns
{{#if importPatterns}}
{{importPatterns}}
{{/if}}
`;
  }

  /**
   * Spec generation steering file template
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
   */
  private getSpecGenerationTemplate(): string {
    return `---
inclusion: manual
---

# Spec Generation Guide - {{ideaName}}

This steering file helps you generate additional specs from your roadmap items using Kiro.

## How to Use This Guide

1. Reference your roadmap: #[[file:docs/roadmap.md]]
2. Select a roadmap item you want to implement
3. Use the prompts below to generate a complete spec

## Output Structure

When generating a spec, Kiro will create three files:

- \`requirements.md\` - User stories and acceptance criteria
- \`design.md\` - Technical design and architecture decisions
- \`tasks.md\` - Implementation tasks and checklist

## Example Prompts

### Generate Requirements
\`\`\`
Based on the roadmap item "[ITEM_NAME]" from #[[file:docs/roadmap.md]],
generate a requirements.md file with:
- A clear user story
- 3-5 acceptance criteria in EARS format
- References to relevant PRD sections
\`\`\`

### Generate Design
\`\`\`
Based on the requirements for "[FEATURE_NAME]" and the tech architecture
in #[[file:docs/tech-architecture.md]], generate a design.md file with:
- Technical approach
- Component design
- Data models
- Error handling strategy
\`\`\`

### Generate Tasks
\`\`\`
Based on the design for "[FEATURE_NAME]", generate a tasks.md file with:
- Numbered implementation tasks
- Sub-tasks where appropriate
- Test tasks marked as optional
- Checkpoint tasks for validation
\`\`\`

## Tips for Iterating on Specs

1. **Start with requirements** - Get the user story and acceptance criteria right first
2. **Review before proceeding** - Have Kiro explain the requirements before generating design
3. **Reference existing code** - Point Kiro to relevant existing implementations
4. **Keep tasks small** - Each task should be completable in one session
5. **Include tests** - Property-based tests catch edge cases early
`;
  }

  /**
   * README template
   * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
   */
  private getReadmeTemplate(): string {
    return `# Kiro Setup - {{ideaName}}

This package contains steering files, example specs, and documentation to help you start implementing your project with Kiro.

**Generated:** {{timestamp}}

## What's Included

### Steering Files (\`steering/\`)
- \`product.md\` - Product vision, users, and success metrics
- \`tech.md\` - Technology stack and development environment
- \`architecture.md\` - Architectural patterns and code organization
- \`spec-generation.md\` - Guide for generating additional specs (manual inclusion)

### Example Spec (\`specs/\`)
- An example feature spec generated from your first roadmap item
- Includes requirements, design, and tasks files

### Documentation (\`docs/\`)
- \`roadmap.md\` - Your project roadmap for reference
- \`PRD.md\` - Product requirements source document
- \`tech-architecture.md\` - Technical architecture source document

## Setup Instructions

### Step 1: Extract Files
Extract this package to your project root or a dedicated directory.

### Step 2: Copy Steering Files
Copy the steering files to your Kiro configuration:
\`\`\`bash
mkdir -p .kiro/steering
cp steering/*.md .kiro/steering/
\`\`\`

### Step 3: Copy Example Spec
Copy the example spec to your specs directory:
\`\`\`bash
mkdir -p .kiro/specs
cp -r specs/* .kiro/specs/
\`\`\`

### Step 4: Copy Documentation
Copy the roadmap, PRD, and tech architecture docs to your docs directory:
\`\`\`bash
mkdir -p docs
cp docs/roadmap.md docs/
cp docs/PRD.md docs/
cp docs/tech-architecture.md docs/
\`\`\`

## Example Workflows

### Implementing the Example Spec
1. Open the tasks file in \`.kiro/specs/[feature-name]/tasks.md\`
2. Click "Start task" on the first task
3. Let Kiro implement each task incrementally
4. Review and approve changes before proceeding

### Generating a New Spec
1. Include the spec-generation steering file in your chat
2. Reference a roadmap item you want to implement
3. Follow the prompts to generate requirements, design, and tasks
4. Review each document before proceeding to the next

### Customizing Steering Files
1. Edit the steering files to add project-specific context
2. Add new steering files for additional concerns (e.g., testing, security)
3. Use frontmatter to control when steering files are included

## Tips for Working with Kiro

1. **Be specific** - The more context you provide, the better Kiro's suggestions
2. **Review incrementally** - Don't let Kiro run too far ahead without review
3. **Use file references** - Reference existing code with \`#[[file:path]]\`
4. **Iterate on specs** - Refine requirements and design before implementation
5. **Keep steering updated** - Update steering files as your project evolves

## Need Help?

- Check the spec-generation guide for detailed prompts
- Reference the example spec for structure and format
- Update steering files with project-specific context
`;
  }

  /**
   * Example spec requirements template
   * Requirements: 6.2, 6.3
   */
  private getExampleRequirementsTemplate(): string {
    return `# Requirements - {{featureName}}

## User Story

{{userStory}}

## Acceptance Criteria

{{#each acceptanceCriteria}}
{{index}}. {{item}}
{{/each}}

## References

- PRD: #[[file:docs/PRD.md]]
- Roadmap: #[[file:docs/roadmap.md]]
`;
  }

  /**
   * Example spec design template
   * Requirements: 6.4
   */
  private getExampleDesignTemplate(): string {
    return `# Design - {{featureName}}

## Overview

This document describes the technical design for implementing "{{featureName}}".

## Technical Approach

{{technicalApproach}}

## References

- Tech Architecture: #[[file:docs/tech-architecture.md]]
- Requirements: #[[file:specs/{{featureName}}/requirements.md]]
`;
  }

  /**
   * Example spec tasks template
   * Requirements: 6.5
   */
  private getExampleTasksTemplate(): string {
    return `# Implementation Tasks - {{featureName}}

## Tasks

{{#each tasks}}
- [ ] {{item}}
{{/each}}

## Checkpoint

- [ ] Ensure all tests pass, ask the user if questions arise.
`;
  }

  /**
   * Clear template cache
   */
  clearCache(): void {
    this.templates.clear();
  }
}
