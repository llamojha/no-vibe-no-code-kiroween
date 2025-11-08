# Doctor Frankenstein - Developer Guide

## Setup

```bash
# Install dependencies
npm install

# Install jsPDF for PDF export
npm install jspdf

# Start development server
npm run dev
```

## Environment Variables

### Development (.env.local)
```bash
FF_LOCAL_DEV_MODE=true
GEMINI_API_KEY=your_api_key
NEXT_PUBLIC_SUPABASE_URL=dummy_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy_key
```

### Production
```bash
FF_LOCAL_DEV_MODE=false
GEMINI_API_KEY=your_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

## Architecture

### File Structure

```
features/doctor-frankenstein/
├── components/
│   ├── DoctorFrankensteinView.tsx      # Main component
│   ├── FrankensteinSlotMachine.tsx     # Slot machine UI
│   ├── FrankensteinDiagram.tsx         # Results diagram
│   └── FrankensteinExportControl.tsx   # Export dropdown
├── api/
│   ├── generateFrankensteinIdea.ts     # AI generation
│   └── saveFrankensteinIdea.ts         # Save/load API
└── utils/
    ├── dataParser.ts                    # Parse tech data
    └── exportFrankensteinIdea.ts        # Export utilities
```

## Key Components

### DoctorFrankensteinView
Main component managing state and orchestrating all functionality.

**State:**
- `mode`: 'companies' | 'aws'
- `selectedItems`: string[]
- `frankensteinIdea`: FrankensteinIdeaResult | null
- `savedIdeaRecord`: SavedFrankensteinIdea | null
- `isReportSaved`: boolean

**Key Functions:**
- `handleCreateFrankenstein()`: Spin slot machine
- `handleAcceptCombination()`: Generate idea
- `handleSaveReport()`: Save to database
- `handleShare()`: Copy link to clipboard

### FrankensteinSlotMachine
Animated slot machine showing selected technologies.

**Props:**
- `allItems`: string[] - All available items
- `selectedItems`: string[] - Currently selected
- `isSpinning`: boolean - Animation state
- `slotCount`: number - Number of slots (4)
- `itemsWithDetails`: ItemWithDetails[] - Full item data

### FrankensteinDiagram
Visual representation of technology combination.

**Props:**
- `elements`: ElementWithDescription[] - Technologies
- `ideaTitle`: string - Generated idea name

**Features:**
- Tooltips on hover
- Animated connections
- Responsive layout

### FrankensteinExportControl
Dropdown menu for export options.

**Features:**
- PDF/Markdown/JSON export
- Keyboard navigation
- Accessible ARIA labels
- Click outside to close

## API Functions

### saveFrankensteinIdea

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

**Behavior:**
- Checks authentication
- Uses localStorage in dev mode
- Uses Supabase in production
- Returns saved idea with ID

### loadFrankensteinIdea

```typescript
async function loadFrankensteinIdea(
  ideaId: string
): Promise<{
  data: SavedFrankensteinIdea | null;
  error: string | null;
}>
```

**Behavior:**
- Works without authentication
- Uses localStorage in dev mode
- Uses Supabase in production
- Returns idea or error

## Export Utilities

### generatePDFReport

```typescript
async function generatePDFReport(
  data: ExportData,
  locale: string
): Promise<void>
```

**Features:**
- Uses jsPDF library
- Includes all technologies
- Handles page breaks
- Filename includes idea name

### generateMarkdownReport

```typescript
function generateMarkdownReport(
  data: ExportData,
  locale: string
): string
```

**Features:**
- Frontmatter with metadata
- Structured sections
- Compatible with static sites

### generateJSONReport

```typescript
function generateJSONReport(
  data: ExportData
): string
```

**Features:**
- Structured data
- Metadata included
- Pretty printed

## Adding Translations

### English (locales/en.json)
```json
{
  "frankensteinLaboratory": "Frankenstein Laboratory",
  "combiningTechnologies": "Combining technologies...",
  "combinationReady": "Combination ready!"
}
```

### Spanish (locales/es.json)
```json
{
  "frankensteinLaboratory": "Laboratorio Frankenstein",
  "combiningTechnologies": "Combinando tecnologías...",
  "combinationReady": "¡Combinación lista!"
}
```

## Database Schema

```sql
CREATE TABLE saved_frankenstein_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  mode TEXT NOT NULL CHECK (mode IN ('companies', 'aws')),
  tech1_name TEXT NOT NULL,
  tech1_description TEXT NOT NULL,
  tech1_category TEXT NOT NULL,
  tech2_name TEXT NOT NULL,
  tech2_description TEXT NOT NULL,
  tech2_category TEXT NOT NULL,
  analysis JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Testing

### Manual Testing Checklist
- [ ] Generate idea works
- [ ] Save requires auth
- [ ] Load from URL works
- [ ] Share link works without auth
- [ ] PDF export downloads
- [ ] Markdown export downloads
- [ ] JSON export downloads
- [ ] Dashboard shows ideas
- [ ] Delete works
- [ ] Language switching works

## Common Issues

### Issue: Can't save ideas
**Solution:** Check authentication and RLS policies

### Issue: Export fails
**Solution:** Verify jsPDF is installed

### Issue: Shared links don't work
**Solution:** Check RLS SELECT policy allows public access
