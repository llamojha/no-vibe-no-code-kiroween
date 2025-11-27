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
    // Use userStory if available, otherwise fall back to description
    const userStory =
      item.userStory || item.description || `Implement ${item.title}`;

    // Use acceptanceCriteria if available, otherwise fall back to goals
    const acceptanceCriteria = item.acceptanceCriteria?.length
      ? item.acceptanceCriteria
      : item.goals;

    return {
      featureName: this.slugify(item.title),
      userStory,
      acceptanceCriteria,
      technicalApproach: this.generateTechnicalApproach(item),
      tasks: this.generateTasksFromItem(item),
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

    // Use technicalNotes if available from the new roadmap format
    if (item.technicalNotes) {
      parts.push(`\n\n**Implementation Notes:**\n${item.technicalNotes}`);
    } else if (item.description) {
      parts.push(`\n\n${item.description}`);
    }

    if (item.dependencies && item.dependencies.length > 0) {
      parts.push(
        `\n\n**Dependencies:**\n${item.dependencies
          .map((d) => `- ${d}`)
          .join("\n")}`
      );
    }

    if (item.scope) {
      parts.push(`\n\n**Estimated Scope:** ${item.scope}`);
    }

    parts.push(
      "\n\nRefer to the Tech Architecture document for implementation details: #[[file:docs/tech-architecture.md]]"
    );

    return parts.join("");
  }

  /**
   * Generate tasks from roadmap item
   * Uses acceptance criteria for task breakdown, with scope-aware sizing
   */
  private generateTasksFromItem(item: RoadmapItem): string[] {
    const tasks: string[] = [];

    // Use acceptance criteria as primary source for tasks
    const criteria = item.acceptanceCriteria?.length
      ? item.acceptanceCriteria
      : item.goals;

    criteria.forEach((criterion, index) => {
      tasks.push(`${index + 1}. ${criterion}`);
    });

    // Add standard tasks based on scope
    if (item.scope === "Medium" || item.scope === "Large") {
      tasks.push(
        `${tasks.length + 1}. Write unit tests for core functionality`
      );
    }
    if (item.scope === "Large") {
      tasks.push(`${tasks.length + 1}. Add integration tests`);
    }

    return tasks;
  }

  /**
   * Generate tasks from goals (legacy support)
   * @deprecated Use generateTasksFromItem instead
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

Use this guide to generate Kiro specs from your MVP roadmap. Each feature in your roadmap can become a complete spec with requirements, design, and tasks.

## Quick Start

**To generate a spec, copy this prompt and replace [FEATURE_NAME]:**

\`\`\`
Create a new spec for "[FEATURE_NAME]" based on the roadmap at #[[file:docs/roadmap.md]].

Use the PRD at #[[file:docs/PRD.md]] for product context and the tech architecture at #[[file:docs/tech-architecture.md]] for technical guidance.

Generate three files in .kiro/specs/[feature-slug]/:
1. requirements.md - User story and acceptance criteria
2. design.md - Technical approach and component design
3. tasks.md - Implementation checklist
\`\`\`

## Spec Structure

Kiro will create specs with this structure:

\`\`\`
.kiro/specs/[feature-name]/
├── requirements.md   # What to build (user story, acceptance criteria)
├── design.md         # How to build it (technical approach, components)
└── tasks.md          # Step-by-step implementation checklist
\`\`\`

## Generating Specs by Phase

Your roadmap is organized into build phases. Generate specs in order:

### Phase 1: Foundation (Start Here)
These features have no dependencies. Generate and implement them first.

### Phase 2: Core MVP
These depend on Phase 1. Generate after foundation is complete.

### Phase 3: MVP Complete
These round out the MVP. Generate after core features work.

### Phase 4: Post-MVP (Optional)
Nice-to-have features. Generate only after MVP validation.

## Detailed Prompts

### Generate Full Spec (Recommended)
\`\`\`
I want to implement "[FEATURE_NAME]" from the roadmap #[[file:docs/roadmap.md]].

Create a complete spec in .kiro/specs/[feature-slug]/ with:

**requirements.md:**
- User story from the roadmap
- Acceptance criteria (convert checkboxes to EARS format)
- References to PRD sections

**design.md:**
- Technical approach based on #[[file:docs/tech-architecture.md]]
- Key components and interfaces
- Data models if needed
- Error handling strategy

**tasks.md:**
- Implementation tasks derived from acceptance criteria
- Each task should be completable in one session
- Include a checkpoint task at the end
\`\`\`

### Generate Requirements Only
\`\`\`
Generate requirements.md for "[FEATURE_NAME]" based on #[[file:docs/roadmap.md]].
Include the user story and convert acceptance criteria to EARS format.
Reference relevant sections from #[[file:docs/PRD.md]].
\`\`\`

### Generate Design Only
\`\`\`
Generate design.md for "[FEATURE_NAME]".
Use the tech stack from #[[file:docs/tech-architecture.md]].
Include technical approach, component design, and error handling.
\`\`\`

### Generate Tasks Only
\`\`\`
Generate tasks.md for "[FEATURE_NAME]".
Break down the acceptance criteria into implementable tasks.
Each task should be small enough to complete in one session.
Add a checkpoint task to verify the feature works.
\`\`\`

## Tips for Better Specs

1. **Generate in order** - Start with Phase 1 features, they have no dependencies
2. **Review before implementing** - Read through the spec and refine if needed
3. **Reference existing code** - Once you have code, point Kiro to it for consistency
4. **Keep tasks small** - If a task feels too big, ask Kiro to break it down
5. **Update as you learn** - Specs can evolve as you implement

## After Generating a Spec

1. Review the generated files in \`.kiro/specs/[feature-name]/\`
2. Edit if needed - you know your project best
3. Open \`tasks.md\` and click "Start task" on the first task
4. Let Kiro implement incrementally, reviewing each change
5. Mark tasks complete as you go

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

Your project documentation has been exported and is ready to use with Kiro IDE.

**Generated:** {{timestamp}}

---

## 🚀 What To Do Next

### Step 1: Set Up Your Project

1. **Create a new project folder** (or use an existing one)
2. **Extract this package** into your project root
3. **Copy files to Kiro's config folder:**

\`\`\`bash
# Create Kiro directories
mkdir -p .kiro/steering
mkdir -p .kiro/specs
mkdir -p docs

# Copy steering files (Kiro will auto-load these)
cp steering/*.md .kiro/steering/

# Copy documentation for reference
cp docs/*.md docs/
\`\`\`

### Step 2: Open in Kiro IDE

1. **Open Kiro IDE** (download from https://kiro.dev if needed)
2. **Open your project folder** in Kiro
3. Kiro will automatically detect the steering files

### Step 3: Generate Your First Spec

1. **Open Kiro chat** (Cmd/Ctrl + Shift + I)
2. **Type \`#spec-generation\`** to include the spec generation guide
3. **Copy and paste this prompt** (replace [FEATURE_NAME] with your first Phase 1 feature):

\`\`\`
Create a new spec for "[FEATURE_NAME]" based on the roadmap at #[[file:docs/roadmap.md]].

Use the PRD at #[[file:docs/PRD.md]] for product context and the tech architecture at #[[file:docs/tech-architecture.md]] for technical guidance.

Generate three files in .kiro/specs/[feature-slug]/:
1. requirements.md - User story and acceptance criteria
2. design.md - Technical approach and component design
3. tasks.md - Implementation checklist
\`\`\`

### Step 4: Implement the Spec

1. **Open the generated tasks.md** in \`.kiro/specs/[feature-name]/\`
2. **Click "Start task"** on the first task
3. **Review Kiro's changes** before accepting
4. **Repeat** for each task until the feature is complete

### Step 5: Continue with Next Feature

1. Check your roadmap for the next feature (respect dependencies!)
2. Generate a new spec using the prompt above
3. Implement, review, repeat

---

## 📁 What's Included

### Steering Files (\`steering/\`)
These provide context to Kiro for all your conversations:

| File | Purpose |
|------|---------|
| \`product.md\` | Product vision, target users, success metrics |
| \`tech.md\` | Technology stack, dependencies, setup |
| \`architecture.md\` | Code patterns, organization, conventions |
| \`spec-generation.md\` | Guide for generating specs (manual inclusion) |

### Documentation (\`docs/\`)
Reference documents for you and Kiro:

| File | Purpose |
|------|---------|
| \`roadmap.md\` | MVP roadmap with all features by phase |
| \`PRD.md\` | Product requirements document |
| \`tech-architecture.md\` | Technical architecture details |
| \`design.md\` | System design document |

---

## 💡 Tips for Success

### Build in Order
Your roadmap has 4 phases. Build Phase 1 features first — they have no dependencies.

### Review Before Implementing
Read through generated specs before starting tasks. Edit if something doesn't look right.

### Keep Specs Small
Each spec should be one feature. If it feels too big, split it.

### Update Steering Files
As your project evolves, update the steering files with new patterns and conventions.

### Use File References
Point Kiro to existing code with \`#[[file:path/to/file]]\` for consistency.

---

## 🔗 Quick Reference

**Generate a spec:**
\`\`\`
#spec-generation Create a spec for "[FEATURE]" from #[[file:docs/roadmap.md]]
\`\`\`

**Reference your docs:**
- Roadmap: \`#[[file:docs/roadmap.md]]\`
- PRD: \`#[[file:docs/PRD.md]]\`
- Tech: \`#[[file:docs/tech-architecture.md]]\`

**Start implementing:**
Open \`.kiro/specs/[feature]/tasks.md\` → Click "Start task"

---

## Need Help?

- **Kiro Documentation:** https://kiro.dev/docs
- **Spec Generation Guide:** See \`steering/spec-generation.md\`
- **Your Roadmap:** See \`docs/roadmap.md\` for feature list and dependencies
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
