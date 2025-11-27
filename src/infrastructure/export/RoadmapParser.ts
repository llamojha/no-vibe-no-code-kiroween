/**
 * RoadmapParser service
 *
 * Parses roadmap documents to extract items with descriptions and goals.
 * Identifies the first roadmap item for example spec generation.
 * Returns ParsedRoadmap with items array and firstItem.
 *
 * Requirements: 6.1, 8.3, 8.4
 */

import type { RoadmapItem, ParsedRoadmap } from "./types";
import { DocumentParser } from "./DocumentParser";

/**
 * Parses roadmap documents to extract structured roadmap items
 */
export class RoadmapParser {
  private documentParser: DocumentParser;

  constructor() {
    this.documentParser = new DocumentParser();
  }

  /**
   * Parse a roadmap document and extract all items
   * @param content - Raw markdown content of the roadmap
   * @returns ParsedRoadmap with items array and firstItem
   */
  parse(content: string): ParsedRoadmap {
    if (!content || content.trim().length === 0) {
      return {
        items: [],
        firstItem: null,
      };
    }

    const items = this.extractRoadmapItems(content);

    return {
      items,
      firstItem: items.length > 0 ? items[0] : null,
    };
  }

  /**
   * Extract roadmap items from the document content
   */
  private extractRoadmapItems(content: string): RoadmapItem[] {
    const items: RoadmapItem[] = [];
    const parsedDoc = this.documentParser.parse(content);

    // Look for roadmap items in various formats
    // Format 1: H2 or H3 sections representing phases/milestones
    const sections = this.documentParser.getSectionsAtLevel(parsedDoc, 2);

    for (const section of sections) {
      const item = this.extractItemFromSection(section);
      if (item) {
        items.push(item);
      }
    }

    // If no items found at H2 level, try H3
    if (items.length === 0) {
      const h3Sections = this.documentParser.getSectionsAtLevel(parsedDoc, 3);
      for (const section of h3Sections) {
        const item = this.extractItemFromSection(section);
        if (item) {
          items.push(item);
        }
      }
    }

    // If still no items, try to extract from list format
    if (items.length === 0) {
      const listItems = this.extractItemsFromLists(content);
      items.push(...listItems);
    }

    return items;
  }

  /**
   * Extract a roadmap item from a document section
   */
  private extractItemFromSection(section: {
    heading: string;
    content: string;
    subsections: Array<{
      heading: string;
      content: string;
      subsections: unknown[];
    }>;
  }): RoadmapItem | null {
    // Skip sections that are clearly not roadmap items
    const skipHeadings = [
      "introduction",
      "overview",
      "summary",
      "table of contents",
      "glossary",
      "appendix",
      "mvp overview",
      "build phases",
      "dependency graph",
      "critical path",
      "out of scope",
      "technical risks",
    ];

    if (
      skipHeadings.some((skip) => section.heading.toLowerCase().includes(skip))
    ) {
      return null;
    }

    const title = this.cleanTitle(section.heading);
    const description = this.extractDescription(section.content);
    const goals = this.extractGoals(section.content, section.subsections);
    const acceptanceCriteria = this.extractAcceptanceCriteria(
      section.content,
      section.subsections
    );
    const dependencies = this.extractDependencies(section.content);
    const userStory = this.extractUserStory(section.content);
    const technicalNotes = this.extractTechnicalNotes(section.content);
    const scope = this.extractScope(section.content);
    const phase = this.extractPhase(section.content);

    // Only return if we have meaningful content
    if (!title || (!description && goals.length === 0 && !userStory)) {
      return null;
    }

    return {
      title,
      description,
      goals,
      acceptanceCriteria:
        acceptanceCriteria.length > 0 ? acceptanceCriteria : undefined,
      dependencies: dependencies.length > 0 ? dependencies : undefined,
      userStory: userStory || undefined,
      technicalNotes: technicalNotes || undefined,
      scope: scope || undefined,
      phase: phase || undefined,
    };
  }

  /**
   * Clean up the title by removing common prefixes
   */
  private cleanTitle(heading: string): string {
    // Remove phase/milestone prefixes like "Phase 1:", "Milestone 1:", "Sprint 1:", etc.
    let title = heading.replace(
      /^(phase|milestone|sprint|week|month|quarter|q)\s*\d*[:\-\s]*/i,
      ""
    );

    // Remove numbering like "1.", "1)", "1 -"
    title = title.replace(/^\d+[\.\)\-\s]+/, "");

    return title.trim();
  }

  /**
   * Extract description from section content
   */
  private extractDescription(content: string): string {
    // Get the first paragraph before any lists or subsections
    const lines = content.split("\n");
    const descriptionLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // Stop at lists, headers, or empty lines after content
      if (
        trimmed.startsWith("-") ||
        trimmed.startsWith("*") ||
        trimmed.startsWith("#")
      ) {
        break;
      }

      if (trimmed.length > 0) {
        descriptionLines.push(trimmed);
      } else if (descriptionLines.length > 0) {
        // Empty line after content - stop
        break;
      }
    }

    return descriptionLines.join(" ").trim();
  }

  /**
   * Extract goals from content and subsections
   */
  private extractGoals(
    content: string,
    subsections: Array<{ heading: string; content: string }>
  ): string[] {
    const goals: string[] = [];

    // Look for goals in subsections
    for (const sub of subsections) {
      if (sub.heading.toLowerCase().includes("goal")) {
        goals.push(...this.extractListItems(sub.content));
      }
    }

    // Look for goals in main content
    const goalsSection = this.findSectionInContent(content, [
      "goals",
      "objectives",
      "targets",
    ]);
    if (goalsSection) {
      goals.push(...this.extractListItems(goalsSection));
    }

    // If no explicit goals section, extract from bullet points
    if (goals.length === 0) {
      const listItems = this.extractListItems(content);
      // Filter to items that look like goals (not too long, not acceptance criteria)
      for (const item of listItems) {
        if (
          item.length < 200 &&
          !item.toLowerCase().includes("when") &&
          !item.toLowerCase().includes("shall")
        ) {
          goals.push(item);
        }
      }
    }

    return goals;
  }

  /**
   * Extract acceptance criteria from content and subsections
   */
  private extractAcceptanceCriteria(
    content: string,
    subsections: Array<{ heading: string; content: string }>
  ): string[] {
    const criteria: string[] = [];

    // Look for acceptance criteria in subsections
    for (const sub of subsections) {
      if (
        sub.heading.toLowerCase().includes("acceptance") ||
        sub.heading.toLowerCase().includes("criteria") ||
        sub.heading.toLowerCase().includes("requirements")
      ) {
        criteria.push(...this.extractListItems(sub.content));
      }
    }

    // Look for acceptance criteria in main content
    const criteriaSection = this.findSectionInContent(content, [
      "acceptance criteria",
      "requirements",
      "success criteria",
    ]);
    if (criteriaSection) {
      criteria.push(...this.extractListItems(criteriaSection));
    }

    return criteria;
  }

  /**
   * Extract dependencies from content
   */
  private extractDependencies(content: string): string[] {
    const dependencies: string[] = [];

    // Look for inline dependencies format: **Dependencies**: [List] or "None"
    const inlineMatch = content.match(
      /\*\*Dependencies\*\*:\s*\[?([^\]\n]+)\]?/i
    );
    if (inlineMatch) {
      const depsText = inlineMatch[1].trim();
      if (
        depsText.toLowerCase() !== "none" &&
        depsText.toLowerCase() !== "none (foundation)"
      ) {
        // Split by comma and clean up
        const deps = depsText.split(",").map((d) => d.trim());
        dependencies.push(...deps.filter((d) => d.length > 0));
      }
      return dependencies;
    }

    // Look for dependencies section
    const depsSection = this.findSectionInContent(content, [
      "dependencies",
      "depends on",
      "prerequisites",
      "blockers",
    ]);

    if (depsSection) {
      dependencies.push(...this.extractListItems(depsSection));
    }

    return dependencies;
  }

  /**
   * Extract user story from content
   * Format: "As a [user], I want to [action], so that [benefit]"
   */
  private extractUserStory(content: string): string | null {
    // Look for **User Story**: format
    const userStoryMatch = content.match(
      /\*\*User Story\*\*:\s*(.+?)(?=\n\s*-\s*\*\*|\n\n|$)/is
    );
    if (userStoryMatch) {
      return userStoryMatch[1].trim();
    }

    // Look for "As a" pattern anywhere in content
    const asAMatch = content.match(/As a[n]?\s+.+?,\s+I want to\s+.+/i);
    if (asAMatch) {
      return asAMatch[0].trim();
    }

    return null;
  }

  /**
   * Extract technical notes/implementation hints from content
   */
  private extractTechnicalNotes(content: string): string | null {
    // Look for **Technical Notes**: format
    const techNotesMatch = content.match(
      /\*\*Technical Notes\*\*:\s*(.+?)(?=\n\s*-\s*\*\*|\n\n|$)/is
    );
    if (techNotesMatch) {
      return techNotesMatch[1].trim();
    }

    // Look for **Technical Approach**: format (alternative)
    const techApproachMatch = content.match(
      /\*\*Technical Approach\*\*:\s*(.+?)(?=\n\s*-\s*\*\*|\n\n|$)/is
    );
    if (techApproachMatch) {
      return techApproachMatch[1].trim();
    }

    return null;
  }

  /**
   * Extract scope estimate from content
   * Format: Small (<1 day), Medium (1-3 days), Large (3-5 days)
   */
  private extractScope(content: string): string | null {
    // Look for **Scope**: format
    const scopeMatch = content.match(/\*\*Scope\*\*:\s*(\w+)/i);
    if (scopeMatch) {
      return scopeMatch[1].trim();
    }

    return null;
  }

  /**
   * Extract phase number from content
   */
  private extractPhase(content: string): number | null {
    // Look for **Phase**: format
    const phaseMatch = content.match(/\*\*Phase\*\*:\s*(\d+)/i);
    if (phaseMatch) {
      return parseInt(phaseMatch[1], 10);
    }

    return null;
  }

  /**
   * Find a section within content by keywords
   */
  private findSectionInContent(
    content: string,
    keywords: string[]
  ): string | null {
    const lines = content.split("\n");
    let capturing = false;
    const capturedLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();

      // Check if this line starts a relevant section
      if (
        keywords.some(
          (kw) =>
            trimmed.includes(kw) &&
            (trimmed.endsWith(":") || trimmed.startsWith("**"))
        )
      ) {
        capturing = true;
        continue;
      }

      // Stop capturing at next section header
      if (capturing && (trimmed.startsWith("**") || trimmed.endsWith(":"))) {
        break;
      }

      if (capturing) {
        capturedLines.push(line);
      }
    }

    return capturedLines.length > 0 ? capturedLines.join("\n") : null;
  }

  /**
   * Extract list items from content
   */
  private extractListItems(content: string): string[] {
    const items: string[] = [];
    const lines = content.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();

      // Match bullet points (-, *, •) or numbered lists (1., 1))
      const listMatch =
        trimmed.match(/^[-*•]\s+(.+)$/) || trimmed.match(/^\d+[\.\)]\s+(.+)$/);

      if (listMatch) {
        const item = listMatch[1].trim();
        if (item.length > 0) {
          items.push(item);
        }
      }
    }

    return items;
  }

  /**
   * Extract roadmap items from list format (when no sections are found)
   */
  private extractItemsFromLists(content: string): RoadmapItem[] {
    const items: RoadmapItem[] = [];
    const lines = content.split("\n");
    let currentItem: Partial<RoadmapItem> | null = null;

    for (const line of lines) {
      const trimmed = line.trim();

      // Check for main list item (potential roadmap item)
      const mainItemMatch = trimmed.match(/^[-*•]\s+\*\*(.+?)\*\*[:\s]*(.*)$/);

      if (mainItemMatch) {
        // Save previous item
        if (currentItem && currentItem.title) {
          items.push({
            title: currentItem.title,
            description: currentItem.description || "",
            goals: currentItem.goals || [],
            acceptanceCriteria: currentItem.acceptanceCriteria,
            dependencies: currentItem.dependencies,
            userStory: currentItem.userStory,
            technicalNotes: currentItem.technicalNotes,
            scope: currentItem.scope,
            phase: currentItem.phase,
          });
        }

        // Start new item
        currentItem = {
          title: mainItemMatch[1].trim(),
          description: mainItemMatch[2].trim(),
          goals: [],
        };
      } else if (currentItem) {
        // Check for sub-items (goals)
        const subItemMatch = trimmed.match(/^\s+[-*•]\s+(.+)$/);
        if (subItemMatch) {
          if (!currentItem.goals) currentItem.goals = [];
          currentItem.goals.push(subItemMatch[1].trim());
        }

        // Extract inline fields from list items
        const userStoryMatch = trimmed.match(/\*\*User Story\*\*:\s*(.+)/i);
        if (userStoryMatch) {
          currentItem.userStory = userStoryMatch[1].trim();
        }

        const techNotesMatch = trimmed.match(
          /\*\*Technical Notes\*\*:\s*(.+)/i
        );
        if (techNotesMatch) {
          currentItem.technicalNotes = techNotesMatch[1].trim();
        }

        const scopeMatch = trimmed.match(/\*\*Scope\*\*:\s*(\w+)/i);
        if (scopeMatch) {
          currentItem.scope = scopeMatch[1].trim();
        }

        const phaseMatch = trimmed.match(/\*\*Phase\*\*:\s*(\d+)/i);
        if (phaseMatch) {
          currentItem.phase = parseInt(phaseMatch[1], 10);
        }
      }
    }

    // Save last item
    if (currentItem && currentItem.title) {
      items.push({
        title: currentItem.title,
        description: currentItem.description || "",
        goals: currentItem.goals || [],
        acceptanceCriteria: currentItem.acceptanceCriteria,
        dependencies: currentItem.dependencies,
        userStory: currentItem.userStory,
        technicalNotes: currentItem.technicalNotes,
        scope: currentItem.scope,
        phase: currentItem.phase,
      });
    }

    return items;
  }

  /**
   * Get the first roadmap item (for example spec generation)
   * Requirements: 6.1
   */
  getFirstItem(roadmap: ParsedRoadmap): RoadmapItem | null {
    return roadmap.firstItem;
  }

  /**
   * Get all roadmap items
   * Requirements: 8.3, 8.4
   */
  getAllItems(roadmap: ParsedRoadmap): RoadmapItem[] {
    return roadmap.items;
  }
}
