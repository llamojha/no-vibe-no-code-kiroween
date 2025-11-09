# Design Document

## Overview

This design adds save, share, and export capabilities to the Doctor Frankenstein feature, bringing it to feature parity with the existing Analyzer and Kiroween Analyzer features. The implementation will follow the same patterns and architecture used in those features to ensure consistency across the platform.

The feature will integrate with the existing Supabase database, authentication system, and export utilities while maintaining the unique characteristics of Doctor Frankenstein (dual-mode technology selection and fusion-based idea generation).

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Doctor Frankenstein Page                  │
│                   (app/doctor-frankenstein)                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              DoctorFrankensteinView Component                │
│  - State Management (dual mode + saved state)                │
│  - Save/Load Operations                                      │
│  - URL Parameter Handling (savedId)                          │
└──────┬──────────────────────┬──────────────────────┬────────┘
       │                      │                      │
       ▼                      ▼                      ▼
┌─────────────┐    ┌──────────────────┐    ┌────────────────┐
│ Save/Share  │    │ Export           │    │ Dashboard      │
│ Controls    │    │ Control          │    │ Integration    │
└──────┬──────┘    └────────┬─────────┘    └────────┬───────┘
       │                    │                        │
       ▼                    ▼                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data & API Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Supabase DB  │  │ Save/Load    │  │ Export       │      │
│  │ (new table)  │  │ API          │  │ Utilities    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Save Flow:**
```
User clicks "Save" 
  → Validate user is logged in
  → Call saveFrankensteinIdea API
  → Insert record to saved_frankenstein_ideas table
  → Update URL with savedId parameter
  → Update UI to show "Saved" state
  → Enable "Share" button
```

**Load Flow:**
```
Page loads with savedId parameter
  → Call loadFrankensteinIdea API
  → Fetch record from database
  → Restore technology selections and mode
  → Display saved analysis
  → Show "Go to Dashboard" button
```

**Share Flow:**
```
User clicks "Share"
  → Generate shareable URL with savedId
  → Copy to clipboard
  → Show "Link Copied" confirmation
```

**Export Flow:**
```
User clicks "Export" dropdown
  → Select format (PDF/Markdown/JSON)
  → Generate formatted content
  → Trigger browser download
```

## Components and Interfaces

### 1. Database Schema

**New Table: `saved_frankenstein_ideas`**

```sql
CREATE TABLE saved_frankenstein_ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode VARCHAR(20) NOT NULL CHECK (mode IN ('companies', 'aws')),
  tech1_name TEXT NOT NULL,
  tech1_description TEXT NOT NULL,
  tech1_category TEXT NOT NULL,
  tech2_name TEXT NOT NULL,
  tech2_description TEXT NOT NULL,
  tech2_category TEXT NOT NULL,
  analysis JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_saved_frankenstein_ideas_user_id 
  ON saved_frankenstein_ideas(user_id);
CREATE INDEX idx_saved_frankenstein_ideas_created_at 
  ON saved_frankenstein_ideas(created_at DESC);
```

**TypeScript Types:**

```typescript
export interface SavedFrankensteinIdea {
  id: string;
  userId: string;
  mode: 'companies' | 'aws';
  tech1: TechItem;
  tech2: TechItem;
  analysis: FrankensteinAnalysis;
  createdAt: string;
}

export interface TechItem {
  name: string;
  description: string;
  category: string;
}

export interface FrankensteinAnalysis {
  ideaName: string;
  description: string;
  keyFeatures: string[];
  targetMarket: string;
  uniqueValueProposition: string;
  language: 'en' | 'es';
}

// Database row types
export type SavedFrankensteinIdeasRow = {
  id: string;
  user_id: string;
  mode: 'companies' | 'aws';
  tech1_name: string;
  tech1_description: string;
  tech1_category: string;
  tech2_name: string;
  tech2_description: string;
  tech2_category: string;
  analysis: Json;
  created_at: string | null;
};

export type SavedFrankensteinIdeasInsert = {
  id?: string;
  user_id: string;
  mode: 'companies' | 'aws';
  tech1_name: string;
  tech1_description: string;
  tech1_category: string;
  tech2_name: string;
  tech2_description: string;
  tech2_category: string;
  analysis: Json;
  created_at?: string | null;
};
```

### 2. API Layer

**File: `features/doctor-frankenstein/api/saveFrankensteinIdea.ts`**

```typescript
export interface SaveFrankensteinIdeaParams {
  mode: 'companies' | 'aws';
  tech1: TechItem;
  tech2: TechItem;
  analysis: FrankensteinAnalysis;
}

export async function saveFrankensteinIdea(
  params: SaveFrankensteinIdeaParams
): Promise<{ data: SavedFrankensteinIdea | null; error: string | null }> {
  // Check if we're in local dev mode
  const isLocalDevMode = isEnabled("LOCAL_DEV_MODE");

  if (isLocalDevMode) {
    // Use local storage for development
    const mockUser = generateMockUser();
    const record: SavedFrankensteinIdea = {
      id: crypto.randomUUID(),
      userId: mockUser.id,
      mode: params.mode,
      tech1: params.tech1,
      tech2: params.tech2,
      analysis: params.analysis,
      createdAt: new Date().toISOString(),
    };
    await localStorageService.saveFrankensteinIdea(record);
    return { data: record, error: null };
  }

  // Production: use Supabase
  const supabase = browserSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "User not authenticated" };
  }

  const insert: SavedFrankensteinIdeasInsert = {
    user_id: user.id,
    mode: params.mode,
    tech1_name: params.tech1.name,
    tech1_description: params.tech1.description,
    tech1_category: params.tech1.category,
    tech2_name: params.tech2.name,
    tech2_description: params.tech2.description,
    tech2_category: params.tech2.category,
    analysis: params.analysis as Json,
  };

  const { data, error } = await supabase
    .from('saved_frankenstein_ideas')
    .insert(insert)
    .select()
    .single();

  if (error || !data) {
    return { data: null, error: error?.message || "Failed to save" };
  }

  return { data: mapSavedFrankensteinIdea(data), error: null };
}

export async function loadFrankensteinIdea(
  ideaId: string
): Promise<{ data: SavedFrankensteinIdea | null; error: string | null }> {
  // Check if we're in local dev mode
  const isLocalDevMode = isEnabled("LOCAL_DEV_MODE");

  if (isLocalDevMode) {
    const idea = await localStorageService.getFrankensteinIdea(ideaId);
    if (!idea) {
      return { data: null, error: "Idea not found" };
    }
    return { data: idea, error: null };
  }

  // Production: use Supabase
  const supabase = browserSupabase();
  const { data, error } = await supabase
    .from('saved_frankenstein_ideas')
    .select('*')
    .eq('id', ideaId)
    .single();

  if (error || !data) {
    return { data: null, error: error?.message || "Idea not found" };
  }

  return { data: mapSavedFrankensteinIdea(data), error: null };
}
```

**Mapper Function:**

```typescript
export function mapSavedFrankensteinIdea(
  row: SavedFrankensteinIdeasRow
): SavedFrankensteinIdea {
  return {
    id: row.id,
    userId: row.user_id,
    mode: row.mode,
    tech1: {
      name: row.tech1_name,
      description: row.tech1_description,
      category: row.tech1_category,
    },
    tech2: {
      name: row.tech2_name,
      description: row.tech2_description,
      category: row.tech2_category,
    },
    analysis: row.analysis as FrankensteinAnalysis,
    createdAt: row.created_at || new Date().toISOString(),
  };
}
```

### 3. Export Control Component

**File: `features/doctor-frankenstein/components/FrankensteinExportControl.tsx`**

```typescript
interface FrankensteinExportControlProps {
  mode: 'companies' | 'aws';
  tech1: TechItem;
  tech2: TechItem;
  analysis: FrankensteinAnalysis;
}

const FrankensteinExportControl: React.FC<FrankensteinExportControlProps> = ({
  mode,
  tech1,
  tech2,
  analysis,
}) => {
  const { t, locale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = (format: 'pdf' | 'md' | 'json') => {
    switch (format) {
      case 'pdf':
        exportAsPDF();
        break;
      case 'md':
        exportAsMarkdown();
        break;
      case 'json':
        exportAsJSON();
        break;
    }
    setIsOpen(false);
  };

  // Export implementations...
};
```

### 4. Export Utilities

**File: `features/doctor-frankenstein/utils/exportFrankensteinIdea.ts`**

**Markdown Export:**
```typescript
export function generateMarkdownReport(
  mode: string,
  tech1: TechItem,
  tech2: TechItem,
  analysis: FrankensteinAnalysis,
  locale: string
): string {
  return `---
title: ${analysis.ideaName}
mode: ${mode}
tech1: ${tech1.name}
tech2: ${tech2.name}
date: ${new Date().toISOString()}
language: ${locale}
---

# ${analysis.ideaName}

## Technology Fusion

**Technology 1:** ${tech1.name}
- Category: ${tech1.category}
- Description: ${tech1.description}

**Technology 2:** ${tech2.name}
- Category: ${tech2.category}
- Description: ${tech2.description}

## Description

${analysis.description}

## Key Features

${analysis.keyFeatures.map(f => `- ${f}`).join('\n')}

## Target Market

${analysis.targetMarket}

## Unique Value Proposition

${analysis.uniqueValueProposition}

---
Generated by Doctor Frankenstein on ${new Date().toLocaleDateString()}
`;
}
```

**JSON Export:**
```typescript
export function generateJSONReport(
  mode: string,
  tech1: TechItem,
  tech2: TechItem,
  analysis: FrankensteinAnalysis
): string {
  const data = {
    metadata: {
      generatedAt: new Date().toISOString(),
      mode: mode,
      version: '1.0',
    },
    technologies: {
      tech1: tech1,
      tech2: tech2,
    },
    analysis: analysis,
  };
  return JSON.stringify(data, null, 2);
}
```

**PDF Export:**
```typescript
// Using jsPDF library
export async function generatePDFReport(
  mode: string,
  tech1: TechItem,
  tech2: TechItem,
  analysis: FrankensteinAnalysis
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text(analysis.ideaName, 20, 20);
  
  // Mode and date
  doc.setFontSize(10);
  doc.text(`Mode: ${mode} | Generated: ${new Date().toLocaleDateString()}`, 20, 30);
  
  // Technologies section
  doc.setFontSize(14);
  doc.text('Technology Fusion', 20, 45);
  doc.setFontSize(10);
  doc.text(`Tech 1: ${tech1.name} (${tech1.category})`, 20, 55);
  doc.text(`Tech 2: ${tech2.name} (${tech2.category})`, 20, 65);
  
  // Description
  doc.setFontSize(14);
  doc.text('Description', 20, 80);
  doc.setFontSize(10);
  const descLines = doc.splitTextToSize(analysis.description, 170);
  doc.text(descLines, 20, 90);
  
  // Key Features
  let yPos = 90 + (descLines.length * 7) + 10;
  doc.setFontSize(14);
  doc.text('Key Features', 20, yPos);
  yPos += 10;
  doc.setFontSize(10);
  analysis.keyFeatures.forEach((feature, index) => {
    doc.text(`• ${feature}`, 25, yPos);
    yPos += 7;
  });
  
  // Target Market
  yPos += 10;
  doc.setFontSize(14);
  doc.text('Target Market', 20, yPos);
  yPos += 10;
  doc.setFontSize(10);
  const marketLines = doc.splitTextToSize(analysis.targetMarket, 170);
  doc.text(marketLines, 20, yPos);
  
  // Value Proposition
  yPos += (marketLines.length * 7) + 10;
  doc.setFontSize(14);
  doc.text('Unique Value Proposition', 20, yPos);
  yPos += 10;
  doc.setFontSize(10);
  const valueLines = doc.splitTextToSize(analysis.uniqueValueProposition, 170);
  doc.text(valueLines, 20, yPos);
  
  doc.save(`frankenstein-idea-${Date.now()}.pdf`);
}
```

### 5. Dashboard Integration

**Update Dashboard to show Frankenstein ideas:**

```typescript
// In dashboard component
const [frankensteinIdeas, setFrankensteinIdeas] = useState<SavedFrankensteinIdea[]>([]);

useEffect(() => {
  async function loadFrankensteinIdeas() {
    const supabase = browserSupabase();
    const { data } = await supabase
      .from('saved_frankenstein_ideas')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      setFrankensteinIdeas(data.map(mapSavedFrankensteinIdea));
    }
  }
  loadFrankensteinIdeas();
}, []);

// Render section
<section>
  <h2>Doctor Frankenstein Ideas</h2>
  {frankensteinIdeas.map(idea => (
    <div key={idea.id}>
      <h3>{idea.analysis.ideaName}</h3>
      <p>{idea.tech1.name} + {idea.tech2.name}</p>
      <p>{new Date(idea.createdAt).toLocaleDateString()}</p>
      <Link href={`/doctor-frankenstein?savedId=${idea.id}`}>
        View
      </Link>
    </div>
  ))}
</section>
```

### 6. Share Functionality

**Component: Share Button**

```typescript
const ShareButton: React.FC<{ savedId: string }> = ({ savedId }) => {
  const [copied, setCopied] = useState(false);
  const { t } = useLocale();

  const handleShare = async () => {
    const url = `${window.location.origin}/doctor-frankenstein?savedId=${savedId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link', error);
    }
  };

  return (
    <button onClick={handleShare} className="...">
      <svg>...</svg>
      <span>{copied ? t('linkCopied') : t('share')}</span>
    </button>
  );
};
```

## Data Models

### SavedFrankensteinIdea

Complete data structure for a saved idea:

```typescript
{
  id: "uuid",
  userId: "user-uuid",
  mode: "companies" | "aws",
  tech1: {
    name: "Technology Name",
    description: "Technology description",
    category: "Category"
  },
  tech2: {
    name: "Technology Name",
    description: "Technology description",
    category: "Category"
  },
  analysis: {
    ideaName: "Startup Idea Name",
    description: "Detailed description...",
    keyFeatures: ["Feature 1", "Feature 2", ...],
    targetMarket: "Target market description",
    uniqueValueProposition: "Value proposition",
    language: "en" | "es"
  },
  createdAt: "2025-11-08T12:00:00Z"
}
```

## Error Handling

### Save Errors

1. **User Not Authenticated**
   - Redirect to login page with return URL
   - Show message: "Please log in to save your idea"

2. **Database Error**
   - Show error message: "Failed to save. Please try again."
   - Log error details for debugging
   - Offer retry button

3. **Network Error**
   - Show error message: "Connection error. Check your internet."
   - Offer retry button

### Load Errors

1. **Idea Not Found**
   - Show error message: "This idea no longer exists"
   - Clear savedId from URL
   - Return to fresh state

2. **Permission Error**
   - Show error message: "You don't have access to this idea"
   - Clear savedId from URL

3. **Database Error**
   - Show error message: "Failed to load idea"
   - Offer retry button

### Export Errors

1. **Generation Failed**
   - Show error message: "Export failed. Please try again."
   - Log error details

2. **Browser Compatibility**
   - Check for clipboard API support
   - Fallback to manual copy instructions

## Testing Strategy

### Unit Tests

**Save/Load API Tests:**
- Test successful save operation
- Test save without authentication
- Test load existing idea
- Test load non-existent idea
- Test local dev mode operations

**Export Utility Tests:**
- Test Markdown generation
- Test JSON generation
- Test PDF generation (mock jsPDF)
- Test format validation

**Component Tests:**
- Test save button state changes
- Test share button clipboard interaction
- Test export dropdown behavior

### Integration Tests

**Save Flow:**
- Generate idea → Save → Verify in database
- Save → Reload page → Verify loaded correctly

**Share Flow:**
- Save idea → Copy link → Open in new tab → Verify displays

**Export Flow:**
- Generate idea → Export each format → Verify downloads

### E2E Tests

- Complete user journey: Generate → Save → Dashboard → View
- Share link journey: Save → Share → Open link (logged out)
- Export journey: Generate → Export all formats

## Performance Considerations

### Database Queries

- Index on `user_id` for fast dashboard loading
- Index on `created_at` for sorting
- Limit dashboard queries to recent items (pagination)

### Export Performance

- PDF generation is client-side (no server load)
- Markdown/JSON generation is instant
- No caching needed (generated on-demand)

### Local Storage (Dev Mode)

- Store ideas in IndexedDB for persistence
- Limit to 50 ideas per user
- Clear old ideas automatically

## Accessibility

### Save/Share Controls

- Keyboard accessible buttons
- ARIA labels for all actions
- Screen reader announcements for state changes
- Focus management after save

### Export Dropdown

- Keyboard navigation (arrow keys)
- Escape key closes dropdown
- Focus returns to trigger button

## Internationalization

### New Translation Keys

**Save/Share:**
- `saveReportButton`: "Save Report"
- `reportSavedMessage`: "Report Saved"
- `share`: "Share"
- `linkCopied`: "Link Copied!"
- `goToDashboardButton`: "Go to Dashboard"

**Export:**
- `exportButton`: "Export"
- `exportAsPDF`: "Export as PDF"
- `exportAsMarkdown`: "Export as Markdown"
- `exportAsJSON`: "Export as JSON"

**Errors:**
- `saveError`: "Failed to save. Please try again."
- `loadError`: "Failed to load idea."
- `notFoundError`: "This idea no longer exists."
- `authRequired`: "Please log in to save your idea."

## Security Considerations

### Row Level Security (RLS)

```sql
-- Users can only read their own ideas
CREATE POLICY "Users can view own ideas"
  ON saved_frankenstein_ideas FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own ideas
CREATE POLICY "Users can insert own ideas"
  ON saved_frankenstein_ideas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own ideas
CREATE POLICY "Users can delete own ideas"
  ON saved_frankenstein_ideas FOR DELETE
  USING (auth.uid() = user_id);
```

### Public Sharing

- Shareable links work without authentication
- Create separate public view endpoint
- No sensitive user data exposed in shared view

## Migration Plan

### Database Migration

```sql
-- Migration file: 20251108_create_saved_frankenstein_ideas.sql

CREATE TABLE IF NOT EXISTS saved_frankenstein_ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode VARCHAR(20) NOT NULL CHECK (mode IN ('companies', 'aws')),
  tech1_name TEXT NOT NULL,
  tech1_description TEXT NOT NULL,
  tech1_category TEXT NOT NULL,
  tech2_name TEXT NOT NULL,
  tech2_description TEXT NOT NULL,
  tech2_category TEXT NOT NULL,
  analysis JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_saved_frankenstein_ideas_user_id 
  ON saved_frankenstein_ideas(user_id);
CREATE INDEX idx_saved_frankenstein_ideas_created_at 
  ON saved_frankenstein_ideas(created_at DESC);

-- Enable RLS
ALTER TABLE saved_frankenstein_ideas ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own ideas"
  ON saved_frankenstein_ideas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ideas"
  ON saved_frankenstein_ideas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ideas"
  ON saved_frankenstein_ideas FOR DELETE
  USING (auth.uid() = user_id);
```

### Code Changes

1. Add new database types to `lib/supabase/types.ts`
2. Create mapper functions in `lib/supabase/mappers.ts`
3. Implement save/load API in `features/doctor-frankenstein/api/`
4. Create export utilities in `features/doctor-frankenstein/utils/`
5. Add export control component
6. Update main view component with save/load logic
7. Update dashboard to display Frankenstein ideas
8. Add translation keys to locale files

## Dependencies

### New Dependencies

- `jspdf`: PDF generation (already in project)
- No additional dependencies needed

### Updated Files

- `lib/supabase/types.ts`: Add new table types
- `lib/supabase/mappers.ts`: Add mapper function
- `lib/localStorage.ts`: Add Frankenstein idea storage methods
- `features/dashboard/components/DashboardView.tsx`: Add Frankenstein section
- `locales/en.json`: Add translation keys
- `locales/es.json`: Add Spanish translations

## Deployment Checklist

- [ ] Run database migration
- [ ] Verify RLS policies are active
- [ ] Test save/load in production
- [ ] Test share links work without auth
- [ ] Test all export formats
- [ ] Verify dashboard integration
- [ ] Test local dev mode
- [ ] Update documentation
