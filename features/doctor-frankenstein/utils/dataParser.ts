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
 * Parse tech companies from markdown file
 */
export function parseTechCompanies(markdown: string): TechCompany[] {
  const companies: TechCompany[] = [];
  const lines = markdown.split('\n');
  let currentCategory = '';

  for (let rawLine of lines) {
    // Trim to handle Windows line endings (\r\n)
    const line = rawLine.trim();
    
    // Detect category headers (remove emojis and special characters)
    if (line.startsWith('## ') && !line.includes('How to use')) {
      currentCategory = line
        .replace('## ', '')
        .replace(/[☁️🤖🧰📱🎮🛒🧑‍💼🔐🛰️🔧🤖🏠🧪🗣️🧬🧭📰🏢✈️]/g, '')
        .replace(/â˜ï¸|ğŸ¤–|ğŸ§°|ğŸ"±|ğŸŽ®|ğŸ›'|ğŸ§'â€�ğŸ'¼|ğŸ"�|ğŸ›°ï¸|ğŸ"§|ğŸ¤–|ğŸ �|ğŸ§ª|ğŸ—£ï¸|ğŸ§¬|ğŸ§­|ğŸ"°|ğŸ¢|âœˆï¸/g, '')
        .trim();
      continue;
    }

    // Parse company entries - handle em dash (—) which appears as character code 8212
    // Format: "number. **Name** — description"
    const match = line.match(/^\d+\.\s+\*\*(.+?)\*\*\s+[\u2014\u2013\-—–]\s+(.+)$/);
    if (match && currentCategory) {
      const name = match[1].trim();
      const description = match[2].trim();
      // Verify it's a valid entry
      if (name && description && description.length > 5) {
        companies.push({
          name,
          description,
          category: currentCategory,
        });
      }
    }
  }

  return companies;
}

/**
 * Parse AWS services from markdown file
 */
export function parseAWSServices(markdown: string): AWSService[] {
  const services: AWSService[] = [];
  const lines = markdown.split('\n');
  let currentCategory = '';

  for (const line of lines) {
    // Detect category headers
    if (line.startsWith('## ')) {
      currentCategory = line.replace('## ', '').trim();
      continue;
    }

    // Parse service entries (format: "- Service Name (details)" or "- Service Name")
    const lineContent = line.trim();
    if (lineContent.startsWith('-') && currentCategory && !line.includes('---')) {
      // Try to match: "- Service Name (description)"
      const matchWithDesc = lineContent.match(/^-\s+(.+?)\s+\((.+)\)$/);
      if (matchWithDesc) {
        const serviceName = matchWithDesc[1].trim();
        const description = matchWithDesc[2].trim();
        if (serviceName && !serviceName.startsWith('#')) {
          services.push({
            name: serviceName,
            category: currentCategory,
            description: description,
          });
        }
      } else {
        // Try to match: "- Service Name" (without description)
        const matchNoDesc = lineContent.match(/^-\s+(.+?)$/);
        if (matchNoDesc) {
          const serviceName = matchNoDesc[1].trim();
          if (serviceName && !serviceName.startsWith('#')) {
            services.push({
              name: serviceName,
              category: currentCategory,
            });
          }
        }
      }
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
