/**
 * Parser utilities for Doctor Frankenstein data sources
 */

export interface TechCompany {
  name: string;
  description: string;
  category: string;
}

export interface AWSService {
  name: string;
  category: string;
  description?: string;
}

/**
 * Parse tech companies from markdown file (table format)
 */
export function parseTechCompanies(markdown: string): TechCompany[] {
  const companies: TechCompany[] = [];
  const lines = markdown.split("\n");
  let currentCategory = "";
  let inTable = false;

  for (let rawLine of lines) {
    const line = rawLine.trim();

    // Detect category headers (remove emojis and special characters)
    if (
      line.startsWith("## ") &&
      !line.includes("How to use") &&
      !line.includes("Notes on")
    ) {
      currentCategory = line
        .replace("## ", "")
        .replace(/[☁️🤖🧰📱🎮🛒🧑‍💼🔐🛰️🔧🤖🏠🧪🗣️🧬🧭📰🏢✈️]/g, "")
        .replace(
          /â˜ï¸|ğŸ¤–|ğŸ§°|ğŸ"±|ğŸŽ®|ğŸ›'|ğŸ§'â€�ğŸ'¼|ğŸ"�|ğŸ›°ï¸|ğŸ"§|ğŸ¤–|ğŸ �|ğŸ§ª|ğŸ—£ï¸|ğŸ§¬|ğŸ§­|ğŸ"°|ğŸ¢|âœˆï¸/g,
          ""
        )
        .trim();
      inTable = false;
      continue;
    }

    // Detect table header
    if (line.startsWith("| Company |") || line.startsWith("| Service |")) {
      inTable = true;
      continue;
    }

    // Skip table separator line
    if (line.startsWith("|---") || line.startsWith("|-")) {
      continue;
    }

    // Parse table rows
    if (inTable && line.startsWith("|") && currentCategory) {
      const parts = line
        .split("|")
        .map((p) => p.trim())
        .filter((p) => p);
      if (parts.length >= 2) {
        const name = parts[0];
        const description = parts[1];
        if (name && description && name !== "Company" && name !== "Service") {
          companies.push({
            name,
            description,
            category: currentCategory,
          });
        }
      }
    }

    // Exit table when we hit an empty line or non-table content
    if (inTable && !line.startsWith("|")) {
      inTable = false;
    }
  }

  return companies;
}

/**
 * Parse AWS services from markdown file (table format)
 */
export function parseAWSServices(markdown: string): AWSService[] {
  const services: AWSService[] = [];
  const lines = markdown.split("\n");
  let currentCategory = "";
  let inTable = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Detect category headers
    if (trimmedLine.startsWith("## ") && !trimmedLine.includes("Notes")) {
      currentCategory = trimmedLine.replace("## ", "").trim();
      inTable = false;
      continue;
    }

    // Detect table header
    if (trimmedLine.startsWith("| Service |")) {
      inTable = true;
      continue;
    }

    // Skip table separator line
    if (trimmedLine.startsWith("|---") || trimmedLine.startsWith("|-")) {
      continue;
    }

    // Parse table rows
    if (inTable && trimmedLine.startsWith("|") && currentCategory) {
      const parts = trimmedLine
        .split("|")
        .map((p) => p.trim())
        .filter((p) => p);
      if (parts.length >= 2) {
        const serviceName = parts[0];
        const description = parts[1];
        if (serviceName && description && serviceName !== "Service") {
          services.push({
            name: serviceName,
            category: currentCategory,
            description: description,
          });
        }
      }
    }

    // Exit table when we hit an empty line or non-table content
    if (inTable && !trimmedLine.startsWith("|")) {
      inTable = false;
    }
  }

  return services;
}

/**
 * Select random items from array without duplicates
 */
export function selectRandom<T>(items: T[], count: number): T[] {
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, items.length));
}
