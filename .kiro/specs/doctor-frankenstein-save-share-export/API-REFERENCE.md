# Doctor Frankenstein - API Reference

## Types

### TechItem
```typescript
interface TechItem {
  name: string;
  description: string;
  category: string;
}
```

### FrankensteinAnalysis
```typescript
interface FrankensteinAnalysis {
  ideaName: string;
  description: string;
  keyFeatures: string[];
  targetMarket: string;
  uniqueValueProposition: string;
  language: 'en' | 'es';
  fullAnalysis?: FrankensteinIdeaResult;
  allSelectedTechnologies?: TechItem[];
}
```

### SavedFrankensteinIdea
```typescript
interface SavedFrankensteinIdea {
  id: string;
  userId: string;
  mode: 'companies' | 'aws';
  tech1: TechItem;
  tech2: TechItem;
  analysis: FrankensteinAnalysis;
  createdAt: string;
}
```

### ExportData
```typescript
interface ExportData {
  mode: 'companies' | 'aws';
  tech1: TechItem;
  tech2: TechItem;
  analysis: FrankensteinAnalysis;
  fullAnalysis?: FrankensteinIdeaResult;
  allTechnologies?: TechItem[];
}
```

### FrankensteinIdeaResult
```typescript
interface FrankensteinIdeaResult {
  idea_title: string;
  idea_description: string;
  core_concept: string;
  problem_statement: string;
  proposed_solution: string;
  unique_value_proposition: string;
  target_audience: string;
  business_model: string;
  growth_strategy: string;
  tech_stack_suggestion: string;
  risks_and_challenges: string;
  metrics: {
    originality_score: number;
    feasibility_score: number;
    impact_score: number;
    scalability_score: number;
    wow_factor: number;
  };
  summary: string;
  language: 'en' | 'es';
}
```

## Functions

### saveFrankensteinIdea

Saves a generated Frankenstein idea to database or localStorage.

**Signature:**
```typescript
async function saveFrankensteinIdea(params: {
  mode: 'companies' | 'aws';
  tech1: TechItem;
  tech2: TechItem;
  analysis: FrankensteinAnalysis;
}): Promise<{
  data: SavedFrankensteinIdea | null;
  error: string | null;
}>
```

**Parameters:**
- `mode`: Generation mode ('companies' or 'aws')
- `tech1`: First technology item
- `tech2`: Second technology item
- `analysis`: Complete analysis data

**Returns:**
- `data`: Saved idea with generated ID, or null if error
- `error`: Error message, or null if successful

**Behavior:**
- Checks if user is authenticated (production only)
- Uses localStorage in dev mode (FF_LOCAL_DEV_MODE=true)
- Uses Supabase in production mode
- Generates UUID for new ideas
- Returns error if authentication fails

**Example:**
```typescript
const { data, error } = await saveFrankensteinIdea({
  mode: 'companies',
  tech1: { name: 'OpenAI', description: '...', category: 'AI' },
  tech2: { name: 'Stripe', description: '...', category: 'Payments' },
  analysis: {
    ideaName: 'AI Payment Assistant',
    description: '...',
    // ... other fields
  }
});

if (error) {
  console.error('Save failed:', error);
} else {
  console.log('Saved with ID:', data.id);
}
```

### loadFrankensteinIdea

Loads a saved Frankenstein idea by ID.

**Signature:**
```typescript
async function loadFrankensteinIdea(
  ideaId: string
): Promise<{
  data: SavedFrankensteinIdea | null;
  error: string | null;
}>
```

**Parameters:**
- `ideaId`: UUID of the saved idea

**Returns:**
- `data`: Saved idea data, or null if not found
- `error`: Error message, or null if successful

**Behavior:**
- Works without authentication (for sharing)
- Uses localStorage in dev mode
- Uses Supabase in production mode
- Returns "Idea not found" if ID doesn't exist

**Example:**
```typescript
const { data, error } = await loadFrankensteinIdea('uuid-here');

if (error) {
  console.error('Load failed:', error);
} else {
  console.log('Loaded idea:', data.analysis.ideaName);
}
```

### generatePDFReport

Generates and downloads a PDF report of the Frankenstein idea.

**Signature:**
```typescript
async function generatePDFReport(
  data: ExportData,
  locale: string = 'en'
): Promise<void>
```

**Parameters:**
- `data`: Export data including technologies and analysis
- `locale`: Language code ('en' or 'es')

**Behavior:**
- Uses jsPDF library
- Formats title, metadata, technologies, and analysis
- Handles page breaks for long content
- Sanitizes idea name for filename
- Triggers browser download
- Filename format: `frankenstein-{idea-name}-{timestamp}.pdf`

**Example:**
```typescript
await generatePDFReport({
  mode: 'companies',
  tech1: { ... },
  tech2: { ... },
  analysis: { ... },
  fullAnalysis: { ... },
  allTechnologies: [...]
}, 'en');
```

### generateMarkdownReport

Generates a Markdown document of the Frankenstein idea.

**Signature:**
```typescript
function generateMarkdownReport(
  data: ExportData,
  locale: string = 'en'
): string
```

**Parameters:**
- `data`: Export data including technologies and analysis
- `locale`: Language code ('en' or 'es')

**Returns:**
- Formatted Markdown string

**Behavior:**
- Includes frontmatter with metadata
- Formats technologies section
- Formats analysis sections
- Compatible with static site generators

**Example:**
```typescript
const markdown = generateMarkdownReport(exportData, 'en');
downloadTextFile(
  markdown,
  `frankenstein-${sanitizedName}-${Date.now()}.md`,
  'text/markdown'
);
```

### generateJSONReport

Generates a JSON export of the Frankenstein idea.

**Signature:**
```typescript
function generateJSONReport(
  data: ExportData
): string
```

**Parameters:**
- `data`: Export data including technologies and analysis

**Returns:**
- Formatted JSON string (pretty printed)

**Behavior:**
- Structures data with metadata
- Includes technologies and analysis
- Pretty printed with 2-space indentation

**Example:**
```typescript
const json = generateJSONReport(exportData);
downloadTextFile(
  json,
  `frankenstein-${sanitizedName}-${Date.now()}.json`,
  'application/json'
);
```

### downloadTextFile

Triggers browser download of a text file.

**Signature:**
```typescript
function downloadTextFile(
  content: string,
  filename: string,
  mimeType: string = 'text/plain'
): void
```

**Parameters:**
- `content`: File content as string
- `filename`: Name for downloaded file
- `mimeType`: MIME type (default: 'text/plain')

**Behavior:**
- Creates Blob from content
- Creates temporary download link
- Triggers download
- Cleans up resources

## Database Operations

### Insert Idea
```sql
INSERT INTO saved_frankenstein_ideas (
  user_id, mode, tech1_name, tech1_description, tech1_category,
  tech2_name, tech2_description, tech2_category, analysis
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING *;
```

### Select Idea by ID
```sql
SELECT * FROM saved_frankenstein_ideas
WHERE id = $1;
```

### Select User's Ideas
```sql
SELECT * FROM saved_frankenstein_ideas
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT 10;
```

### Delete Idea
```sql
DELETE FROM saved_frankenstein_ideas
WHERE id = $1 AND user_id = $2;
```

## Error Codes

### Save Errors
- `"User not authenticated"`: User must login
- `"Failed to save your idea. Please try again."`: Database error
- `"Technology items not found"`: Invalid tech selection

### Load Errors
- `"Idea not found"`: Invalid or deleted ID
- `"Failed to load idea from local storage"`: localStorage error
- `"Unable to load the saved idea"`: Database error

### Export Errors
- `"Export failed"`: General export error
- Browser console will show specific jsPDF errors

## Constants

### Slot Count
```typescript
const slotCount = 4; // Number of technologies to combine
```

### Storage Keys
```typescript
const STORAGE_KEYS = {
  FRANKENSTEIN_IDEAS: 'nvnc-local-frankenstein-ideas'
};
```

### Feature Flags
```typescript
FF_LOCAL_DEV_MODE: boolean // Enable localStorage mode
```
