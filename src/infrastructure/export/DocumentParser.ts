/**
 * DocumentParser service
 *
 * Parses markdown documents and extracts structure (headings, sections, content).
 * Returns ParsedDocument with title, sections, and metadata.
 *
 * Requirements: 2.2, 3.2, 4.2, 8.2
 */

import type { DocumentSection, ParsedDocument } from "./types";

/**
 * Parses markdown documents to extract structured content
 */
export class DocumentParser {
  /**
   * Parse a markdown document and extract its structure
   * @param content - Raw markdown content
   * @returns ParsedDocument with title, sections, and metadata
   */
  parse(content: string): ParsedDocument {
    if (!content || content.trim().length === 0) {
      return {
        title: "",
        sections: [],
        metadata: {},
      };
    }

    const lines = content.split("\n");
    const title = this.extractTitle(lines);
    const sections = this.extractSections(lines);
    const metadata = this.extractMetadata(content);

    return {
      title,
      sections,
      metadata,
    };
  }

  /**
   * Extract the document title (first H1 heading)
   */
  private extractTitle(lines: string[]): string {
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("# ") && !trimmed.startsWith("## ")) {
        return trimmed.substring(2).trim();
      }
    }
    return "";
  }

  /**
   * Extract all sections from the document
   */
  private extractSections(lines: string[]): DocumentSection[] {
    const sections: DocumentSection[] = [];
    let currentSection: DocumentSection | null = null;
    let contentBuffer: string[] = [];
    let skipFirstH1 = true;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

      if (headingMatch) {
        const level = headingMatch[1].length;
        const heading = headingMatch[2].trim();

        // Skip the first H1 as it's the title
        if (level === 1 && skipFirstH1) {
          skipFirstH1 = false;
          continue;
        }

        // Save previous section's content
        if (currentSection) {
          currentSection.content = contentBuffer.join("\n").trim();
          this.addSectionToHierarchy(sections, currentSection);
        }

        // Start new section
        currentSection = {
          heading,
          level,
          content: "",
          subsections: [],
        };
        contentBuffer = [];
      } else if (currentSection) {
        contentBuffer.push(line);
      }
    }

    // Save last section
    if (currentSection) {
      currentSection.content = contentBuffer.join("\n").trim();
      this.addSectionToHierarchy(sections, currentSection);
    }

    return sections;
  }

  /**
   * Add a section to the appropriate place in the hierarchy
   */
  private addSectionToHierarchy(
    sections: DocumentSection[],
    newSection: DocumentSection
  ): void {
    // Find the appropriate parent for this section
    const parent = this.findParentSection(sections, newSection.level);

    if (parent) {
      parent.subsections.push(newSection);
    } else {
      sections.push(newSection);
    }
  }

  /**
   * Find the parent section for a given level
   */
  private findParentSection(
    sections: DocumentSection[],
    level: number
  ): DocumentSection | null {
    if (sections.length === 0) return null;

    // Look for the most recent section with a lower level
    for (let i = sections.length - 1; i >= 0; i--) {
      const section = sections[i];
      if (section.level < level) {
        // Check if there's a more appropriate parent in subsections
        const deeperParent = this.findParentSection(section.subsections, level);
        return deeperParent || section;
      }
    }

    return null;
  }

  /**
   * Extract metadata from frontmatter if present
   */
  private extractMetadata(content: string): Record<string, unknown> {
    const metadata: Record<string, unknown> = {};

    // Check for YAML frontmatter
    if (content.startsWith("---")) {
      const endIndex = content.indexOf("---", 3);
      if (endIndex !== -1) {
        const frontmatter = content.substring(3, endIndex).trim();
        const lines = frontmatter.split("\n");

        for (const line of lines) {
          const colonIndex = line.indexOf(":");
          if (colonIndex !== -1) {
            const key = line.substring(0, colonIndex).trim();
            const value = line.substring(colonIndex + 1).trim();
            // Remove quotes if present
            metadata[key] = value.replace(/^["']|["']$/g, "");
          }
        }
      }
    }

    return metadata;
  }

  /**
   * Find a section by heading name (case-insensitive)
   */
  findSection(
    document: ParsedDocument,
    heading: string
  ): DocumentSection | null {
    const normalizedHeading = heading.toLowerCase();
    return this.findSectionRecursive(document.sections, normalizedHeading);
  }

  /**
   * Recursively search for a section by heading
   */
  private findSectionRecursive(
    sections: DocumentSection[],
    heading: string
  ): DocumentSection | null {
    for (const section of sections) {
      if (section.heading.toLowerCase().includes(heading)) {
        return section;
      }
      const found = this.findSectionRecursive(section.subsections, heading);
      if (found) return found;
    }
    return null;
  }

  /**
   * Get all sections at a specific level
   */
  getSectionsAtLevel(
    document: ParsedDocument,
    level: number
  ): DocumentSection[] {
    return this.collectSectionsAtLevel(document.sections, level);
  }

  /**
   * Recursively collect sections at a specific level
   */
  private collectSectionsAtLevel(
    sections: DocumentSection[],
    level: number
  ): DocumentSection[] {
    const result: DocumentSection[] = [];

    for (const section of sections) {
      if (section.level === level) {
        result.push(section);
      }
      result.push(...this.collectSectionsAtLevel(section.subsections, level));
    }

    return result;
  }

  /**
   * Extract content from a section including its subsections
   */
  getSectionWithSubsections(section: DocumentSection): string {
    let content = section.content;

    for (const subsection of section.subsections) {
      const headingPrefix = "#".repeat(subsection.level);
      content += `\n\n${headingPrefix} ${
        subsection.heading
      }\n\n${this.getSectionWithSubsections(subsection)}`;
    }

    return content.trim();
  }
}
