# Design Document

## Overview

Doctor Frankenstein is a feature-based module within the No Vibe No Code platform that generates innovative startup ideas by combining random technologies. The system uses a slot machine metaphor to create an engaging user experience, followed by AI-powered analysis to generate detailed business concepts.

The feature is built using Next.js 14 with React 18, TypeScript, and Tailwind CSS, following the project's feature-based architecture pattern. It integrates with Google Gemini AI for idea generation and supports English and Spanish through the existing locale system.

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
│  - State Management (dual mode)                              │
│  - Language Detection & Regeneration                         │
│  - Loading & Error Handling                                  │
└──────┬──────────────────────┬──────────────────────┬────────┘
       │                      │                      │
       ▼                      ▼                      ▼
┌─────────────┐    ┌──────────────────┐    ┌────────────────┐
│ Slot        │    │ Frankenstein     │    │ Analysis       │
│ Machine     │    │ Diagram          │    │ Display        │
│ Component   │    │ Component        │    │ Component      │
└──────┬──────┘    └────────┬─────────┘    └────────┬───────┘
       │                    │                        │
       ▼                    ▼                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data & API Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Data Parser  │  │ API Route    │  │ Gemini AI    │      │
│  │ (markdown)   │  │ (generate)   │  │ Integration  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
DoctorFrankensteinView
├── Mode Toggle (Tech Companies / AWS Services)
├── FrankensteinSlotMachine
│   ├── SlotMachine (Technology 1)
│   └── SlotMachine (Technology 2)
├── Spin Button
├── Loading State (with animated messages)
├── Error Display
├── FrankensteinDiagram (when analysis exists)
│   ├── Technology Node 1 (with tooltip)
│   ├── Fusion Center
│   └── Technology Node 2 (with tooltip)
└── Analysis Display
    ├── Idea Name
    ├── Description
    ├── Key Features
    ├── Target Market
    └── Unique Value Proposition
```

## Components and Interfaces

### 1. DoctorFrankensteinView (Main Container)

**Purpose:** Orchestrates the entire Doctor Frankenstein experience, managing state for both modes independently.

**Key Responsibilities:**
- Dual mode state management (Tech Companies vs AWS Services)
- Data loading and parsing from markdown files
- Spin animation coordination
- API communication for AI analysis
- Language mismatch detection and regeneration
- Error handling and loading states

**State Structure:**
```typescript
interface ModeState {
  selectedTechnologies: TechItem[];
  analysis: FrankensteinAnalysis | null;
  isSpinning: boolean;
  isAnalyzing: boolean;
  error: string | null;
}

// Separate state for each mode
const [companiesState, setCompaniesState] = useState<ModeState>(initialState);
const [awsState, setAwsState] = useState<ModeState>(initialState);
```

**Props:** None (root component)

### 2. FrankensteinSlotMachine Component

**Purpose:** Provides animated slot machine visualization for technology selection.

**Props:**
```typescript
interface FrankensteinSlotMachineProps {
  allItems: string[];        // All available technology names
  selectedItems: string[];   // Final selected technologies
  isSpinning: boolean;       // Animation state
  slotCount: number;         // Number of slots (always 2)
}
```

**Features:**
- 3-second animation duration
- Random item cycling at 100ms intervals
- Visual feedback (border colors, pulse effects)
- Slot numbering (#1, #2)
- Lightning effects during spinning
- Responsive grid layout (1 column mobile, 2 columns desktop)

### 3. SlotMachine (Individual Slot)

**Purpose:** Single animated slot within the machine.

**Props:**
```typescript
interface SlotMachineProps {
  items: string[];           // Available items to cycle through
  isSpinning: boolean;       // Animation state
  finalItem?: string;        // Final selected item
  slotIndex: number;         // Slot position (0 or 1)
}
```

**Animation Logic:**
- Uses `setInterval` with 100ms delay during spinning
- Displays random items from the pool
- Shows final item when spinning stops
- Staggered animation start based on `slotIndex`

### 4. FrankensteinDiagram Component

**Purpose:** Visual representation of technology fusion.

**Props:**
```typescript
interface FrankensteinDiagramProps {
  tech1: TechItem;
  tech2: TechItem;
}

interface TechItem {
  name: string;
  description: string;
  category: string;
}
```

**Layout:**
```
┌─────────────┐         ┌─────────────┐
│ Technology  │         │ Technology  │
│     #1      │ ──────► │     #2      │
│  (tooltip)  │    ⚡    │  (tooltip)  │
└─────────────┘         └─────────────┘
```

**Tooltip Behavior:**
- Appears on hover
- Dynamic positioning (left/right based on element position)
- Prevents overflow on small screens
- Shows technology description or category-based fallback

### 5. Analysis Display Component

**Purpose:** Presents the AI-generated startup idea.

**Structure:**
```typescript
interface FrankensteinAnalysis {
  ideaName: string;
  description: string;
  keyFeatures: string[];
  targetMarket: string;
  uniqueValueProposition: string;
  language: 'en' | 'es';
}
```

**Display Sections:**
- Idea Name (large heading)
- Description (paragraph)
- Key Features (bulleted list)
- Target Market (paragraph)
- Unique Value Proposition (highlighted box)

## Data Models

### Technology Data Sources

**Tech Companies Catalog:**
- Source: `/public/doctor-frankenstein/well_known_unique_tech_companies_300_400_frankenstein_mashups_catalog.md`
- Format: Markdown with categories and numbered entries
- Structure: `number. **Name** — description`
- Count: 356 companies
- Categories: Cloud, AI/ML, Developer Tools, Mobile, Gaming, E-commerce, etc.

**AWS Services Catalog:**
- Source: `/public/doctor-frankenstein/aws_services_products_full_list_as_of_nov_5_2025.md`
- Format: Markdown with categories and bulleted entries
- Structure: `- Service Name (description)` or `- Service Name`
- Count: 223 services
- Categories: Compute, Storage, Database, Networking, Security, etc.

### Data Parser

**Tech Companies Parser:**
```typescript
function parseTechCompanies(markdown: string): TechCompany[] {
  // 1. Split by lines
  // 2. Detect category headers (## Category)
  // 3. Parse entries with regex: /^\d+\.\s+\*\*(.+?)\*\*\s+[—]\s+(.+)$/
  // 4. Handle Windows line endings (\r\n)
  // 5. Remove emoji characters from categories
  // 6. Return array of TechCompany objects
}
```

**AWS Services Parser:**
```typescript
function parseAWSServices(markdown: string): AWSService[] {
  // 1. Split by lines
  // 2. Detect category headers (## Category)
  // 3. Parse entries with regex: /^-\s+(.+?)\s+\((.+)\)$/ or /^-\s+(.+?)$/
  // 4. Extract name and optional description
  // 5. Assign category-based fallback if no description
  // 6. Return array of AWSService objects
}
```

**Fallback Descriptions:**
When AWS services lack descriptions, use category-based defaults:
- Compute → "Scalable computing capacity"
- Storage → "Secure and durable storage"
- Database → "Managed database service"
- Networking → "Network infrastructure service"
- Security → "Security and compliance service"
- etc.

## Error Handling

### Error Types and Responses

1. **Data Loading Errors**
   - Scenario: Markdown files fail to load
   - Response: Display error message, disable spin button
   - User Action: Refresh page

2. **Parsing Errors**
   - Scenario: Invalid markdown format
   - Response: Log error, use empty array
   - User Action: None (graceful degradation)

3. **API Errors**
   - Scenario: AI generation fails
   - Response: Display error message with retry option
   - User Action: Click spin again

4. **Language Mismatch**
   - Scenario: Analysis language ≠ UI language
   - Response: Show warning banner with regenerate button
   - User Action: Click regenerate

5. **Network Errors**
   - Scenario: Request timeout or connection failure
   - Response: Display generic error message
   - User Action: Check connection, retry

### Error Display Component

```typescript
interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}
```

Visual style: Red border, warning icon, error message, optional retry button

## Testing Strategy

### Unit Tests

**Data Parser Tests:**
- Parse valid tech companies markdown
- Parse valid AWS services markdown
- Handle Windows line endings (\r\n)
- Handle UTF-8 characters and emojis
- Handle missing descriptions
- Handle malformed entries

**Component Tests:**
- SlotMachine animation behavior
- Tooltip positioning logic
- Mode switching preserves state
- Language mismatch detection

### Integration Tests

**API Route Tests:**
- Valid request returns analysis
- Invalid mode returns 400 error
- Missing elements returns 400 error
- AI service failure returns 500 error
- Language parameter is respected

**End-to-End Tests:**
- Complete spin → analyze → display flow
- Mode switching maintains independent state
- Language regeneration works correctly
- Error recovery and retry functionality

### Manual Testing Checklist

- [ ] Spin animation runs for 3 seconds
- [ ] Two different technologies are always selected
- [ ] Mode toggle switches correctly
- [ ] Previous mode state is preserved
- [ ] AI analysis generates valid content
- [ ] Diagram tooltips appear on hover
- [ ] Tooltips don't overflow screen edges
- [ ] Language mismatch warning appears when needed
- [ ] Regeneration updates analysis in correct language
- [ ] Responsive layout works on mobile/tablet/desktop
- [ ] Loading states display correctly
- [ ] Error messages are clear and actionable

## Performance Considerations

### Data Loading
- Markdown files loaded once on component mount
- Parsed data cached in component state
- No re-parsing on mode switch

### Animation Performance
- CSS animations for smooth transitions
- `setInterval` cleanup on unmount
- Debounced spin button to prevent rapid clicks

### API Optimization
- Single API call per spin
- No polling or real-time updates
- Timeout handling for slow responses

### Bundle Size
- Markdown files served from `/public` (not bundled)
- Lazy loading not needed (single page feature)
- Minimal external dependencies

## Accessibility

### Keyboard Navigation
- All interactive elements keyboard accessible
- Tab order follows visual flow
- Enter/Space activates buttons

### Screen Readers
- Semantic HTML structure
- ARIA labels for icon buttons
- Status announcements for loading/error states

### Visual Accessibility
- High contrast colors (purple, orange on black)
- Large touch targets (min 44x44px)
- Clear focus indicators
- Readable font sizes (min 16px)

### Motion Sensitivity
- Respects `prefers-reduced-motion` media query
- Provides instant results option (future enhancement)

## Internationalization

### Supported Languages
- English (en)
- Spanish (es)

### Translation Keys

**UI Elements:**
- `doctorFrankensteinTitle`: "Doctor Frankenstein"
- `doctorFrankensteinSubtitle`: "Combine technologies to create innovative ideas"
- `techCompaniesMode`: "Tech Companies"
- `awsServicesMode`: "AWS Services"
- `spinButton`: "Spin the Machine!"
- `analyzing`: "Analyzing combination..."
- `languageMismatch`: "Analysis is in {language}. Regenerate in {currentLanguage}?"
- `regenerateButton`: "Regenerate"

**Loading Messages:**
- `frankensteinLoading1`: "Mixing technologies..."
- `frankensteinLoading2`: "Consulting the AI oracle..."
- `frankensteinLoading3`: "Generating brilliant ideas..."
- `frankensteinLoading4`: "Almost there..."

**Error Messages:**
- `frankensteinError`: "Failed to generate idea. Please try again."
- `dataLoadError`: "Failed to load technology data."

### Language Detection Logic

```typescript
function detectLanguageMismatch(
  analysisLanguage: string,
  currentLocale: string
): boolean {
  return analysisLanguage !== currentLocale;
}
```

When mismatch detected:
1. Display warning banner
2. Offer regenerate button
3. On click, call API with current locale
4. Replace analysis with new result

## Future Enhancements

### Phase 2 Considerations
- Save/share functionality (covered in separate spec)
- Export to PDF/Markdown
- History of generated ideas
- Favorite/bookmark ideas
- Social sharing
- GitHub issue creation

### Technical Debt
- Add comprehensive error logging
- Implement retry logic with exponential backoff
- Add analytics tracking for spin events
- Optimize markdown parsing performance
- Add unit tests for all components
- Implement E2E tests with Playwright

## Dependencies

### External Libraries
- `@google/generative-ai`: AI analysis generation
- `next`: Framework and routing
- `react`: UI components
- `tailwindcss`: Styling

### Internal Dependencies
- `@/features/locale`: Internationalization
- `@/features/analytics`: Event tracking (future)
- `@/lib/types`: Shared TypeScript types

### Data Files
- `/public/doctor-frankenstein/well_known_unique_tech_companies_300_400_frankenstein_mashups_catalog.md`
- `/public/doctor-frankenstein/aws_services_products_full_list_as_of_nov_5_2025.md`

## Deployment Notes

### Environment Variables
- `GEMINI_API_KEY`: Required for AI generation
- No additional configuration needed

### Build Considerations
- Markdown files must be in `/public` directory
- API route uses Node.js runtime
- No static generation (dynamic route)

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2022 features used
- No IE11 support needed
