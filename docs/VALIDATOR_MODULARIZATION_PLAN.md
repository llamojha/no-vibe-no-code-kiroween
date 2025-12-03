# Validator Modularization Plan

## Executive Summary

Create a modular, reusable validator system that allows generating new validator pages with minimal code duplication. The system will abstract common patterns from the existing Classic Analyzer and Kiroween Analyzer into reusable components and configuration.

---

## Current State Analysis

### Existing Validators

**1. Classic Analyzer (`/analyzer`)**

- Purpose: Startup idea validation
- Prompt: `lib/prompts/startupIdea.ts`
- API: `/api/v2/analyze`
- View: `features/analyzer/components/AnalyzerView.tsx`
- Page: `app/analyzer/page.tsx`

**2. Kiroween Analyzer (`/kiroween-analyzer`)**

- Purpose: Hackathon project evaluation
- Prompt: `lib/prompts/hackathonProject.ts`
- API: `/api/v2/hackathon/analyze`
- View: `features/kiroween-analyzer/components/KiroweenAnalyzerView.tsx`
- Page: `app/kiroween-analyzer/page.tsx`

### Common Patterns Identified

Both validators share ~90% of the same logic:

**Shared Functionality:**

- Authentication & authorization flow
- Credit management and display
- Loading states with rotating messages
- Error handling and display
- Save/load analysis from database
- Audio generation and persistence
- URL parameter handling (savedId, mode, idea, source, frankensteinId)
- Doctor Frankenstein integration
- Language switching
- Refine suggestion workflow
- "Start new analysis" functionality
- Auto-save after analysis
- Retry save on failure

**Differences:**

- Input form structure (simple textarea vs. complex form with materials)
- Analysis result type and display
- API endpoint called
- Prompt used
- Theme/styling (classic vs. spooky)
- Loading messages

---

## Proposed Architecture

### 1. Core Abstraction: Generic Validator Framework

Create a generic validator system that can be configured for different use cases.

```
src/
├── domain/
│   └── validators/
│       ├── ValidatorConfig.ts          # Configuration interface
│       └── ValidatorTypes.ts           # Shared types
├── application/
│   └── validators/
│       ├── ValidatorOrchestrator.ts    # Core validation logic
│       └── ValidatorFactory.ts         # Create configured validators
└── infrastructure/
    └── validators/
        ├── ValidatorRegistry.ts        # Register all validators
        └── configs/
            ├── classicAnalyzer.ts      # Classic Analyzer config
            ├── kiroweenAnalyzer.ts     # Kiroween config
            └── [newValidator].ts       # Future validators
```

### 2. Validator Configuration Interface

```typescript
// src/domain/validators/ValidatorConfig.ts

export interface ValidatorConfig<TInput, TAnalysis> {
  // Identity
  id: string; // 'classic-analyzer', 'kiroween-analyzer'
  name: string; // Display name
  slug: string; // URL slug

  // Behavior
  apiEndpoint: string; // '/api/v2/analyze'
  promptGenerator: (input: TInput, locale: Locale) => string;

  // UI Configuration
  theme: ValidatorTheme;
  loadingMessages: (locale: Locale) => string[];
  inputComponent: React.ComponentType<InputComponentProps<TInput>>;
  displayComponent: React.ComponentType<DisplayComponentProps<TAnalysis>>;

  // Data Handling
  inputSchema: z.ZodSchema<TInput>;
  analysisSchema: z.ZodSchema<TAnalysis>;

  // Storage
  storageKey: string; // For localStorage in dev mode
  databaseTable: "saved_analyses" | "saved_hackathon_analyses";

  // Integration
  supportsFrankenstein: boolean;
  supportsAudio: boolean;
  supportsRefinement: boolean;

  // Scoring
  scoreExtractor: (analysis: TAnalysis) => number;

  // Optional Customization
  customHooks?: {
    beforeAnalyze?: (input: TInput) => Promise<void>;
    afterAnalyze?: (analysis: TAnalysis) => Promise<void>;
    beforeSave?: (input: TInput, analysis: TAnalysis) => Promise<void>;
    afterSave?: (savedId: string) => Promise<void>;
  };
}

export interface ValidatorTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  gradientFrom: string;
  gradientTo: string;
  borderColor: string;
  accentColor: string;
}
```

### 3. Generic Validator View Component

```typescript
// features/validators/components/GenericValidatorView.tsx

interface GenericValidatorViewProps<TInput, TAnalysis> {
  config: ValidatorConfig<TInput, TAnalysis>;
  initialCredits: number;
  userTier: UserTier;
}

export function GenericValidatorView<TInput, TAnalysis>({
  config,
  initialCredits,
  userTier,
}: GenericValidatorViewProps<TInput, TAnalysis>) {
  // All the shared logic from AnalyzerView and KiroweenAnalyzerView
  // - State management
  // - URL parameter handling
  // - Authentication checks
  // - Credit management
  // - Analysis flow
  // - Save/load logic
  // - Frankenstein integration
  // - Audio handling
  // - Error handling

  // Render using config-provided components
  return (
    <div className={config.theme.backgroundColor}>
      <Header config={config} />
      <CreditCounter credits={credits} tier={userTier} />

      {showInputForm && (
        <config.inputComponent
          input={input}
          onInputChange={setInput}
          onAnalyze={handleAnalyze}
          isLoading={isLoading}
        />
      )}

      {analysisToDisplay && (
        <config.displayComponent
          analysis={analysisToDisplay}
          onSave={handleSaveReport}
          isSaved={isReportSaved}
          // ... other props
        />
      )}
    </div>
  );
}
```

### 4. Validator Page Template

```typescript
// app/validators/[slug]/page.tsx

import { getValidatorConfig } from "@/src/infrastructure/validators/ValidatorRegistry";
import { GenericValidatorView } from "@/features/validators/components/GenericValidatorView";

export async function generateStaticParams() {
  return [
    { slug: "analyzer" },
    { slug: "kiroween-analyzer" },
    // Future validators automatically included
  ];
}

export default async function ValidatorPage({
  params,
}: {
  params: { slug: string };
}) {
  const config = getValidatorConfig(params.slug);

  if (!config) {
    notFound();
  }

  // Standard auth and credit checks
  const isDevelopment = process.env.NODE_ENV === "development";

  if (isDevelopment) {
    return (
      <Suspense fallback={<Loader message="Loading validator..." />}>
        <GenericValidatorView
          config={config}
          initialCredits={3}
          userTier="free"
        />
      </Suspense>
    );
  }

  // Production auth flow
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    redirect("/login");
  }

  const hasPaidAccess = await isCurrentUserPaid();
  if (!hasPaidAccess) {
    redirect("/dashboard");
  }

  const user = await getCurrentUser();
  const credits = user?.credits ?? 3;
  const tier = sessionContext.tier ?? "free";

  return (
    <Suspense fallback={<Loader message={`Loonfig.name}...`} />}>
      <GenericValidatorView
        config={config}
        initialCredits={credits}
        userTier={tier}
      />
    </Suspense>
  );
}
```

### 5. Validator Registry

```typescript
// src/infrastructure/validators/ValidatorRegistry.ts

import { classicAnalyzerConfig } from "./configs/classicAnalyzer";
import { kiroweenAnalyzerConfig } from "./configs/kiroweenAnalyzer";

const validators = new Map<string, ValidatorConfig<any, any>>();

// Register validators
validators.set("analyzer", classicAnalyzerConfig);
validators.set("kiroween-analyzer", kiroweenAnalyzerConfig);

export function getValidatorConfig(
  slug: string
): ValidatorConfig<any, any> | null {
  return validators.get(slug) || null;
}

export function getAllValidators(): ValidatorConfig<any, any>[] {
  return Array.from(validators.values());
}

export function registerValidator(config: ValidatorConfig<any, any>): void {
  validators.set(config.slug, config);
}
```

### 6. Example Validator Configuration

```typescript
// src/infrastructure/validators/configs/classicAnalyzer.ts

import { ValidatorConfig } from "@/src/domain/validators/ValidatorConfig";
import { generateStartupIdeaPrompt } from "@/lib/prompts/startupIdea";
import IdeaInputForm from "@/features/analyzer/components/IdeaInputForm";
import AnalysisDisplay from "@/features/analyzer/components/AnalysisDisplay";

export const classicAnalyzerConfig: ValidatorConfig<string, Analysis> = {
  id: "classic-analyzer",
  name: "Startup Idea Analyzer",
  slug: "analyzer",

  apiEndpoint: "/api/v2/analyze",
  promptGenerator: generateStartupIdeaPrompt,

  theme: {
    primaryColor: "accent",
    secondaryColor: "secondary",
    backgroundColor: "bg-black",
    gradientFrom: "from-accent",
    gradientTo: "to-secondary",
    borderColor: "border-accent",
    accentColor: "text-accent",
  },

  loadingMessages: (locale) => [
    locale === "es" ? "Analizando tu idea..." : "Analyzing your idea...",
    locale === "es"
      ? "Investigando el mercado..."
      : "Researching the market...",
    // ... more messages
  ],

  inputComponent: IdeaInputForm,
  displayComponent: AnalysisDisplay,

  inputSchema: z.string().min(10),
  analysisSchema: AnalysisSchema,

  storageKey: "nvnc_saved_analyses",
  databaseTable: "saved_analyses",

  supportsFrankenstein: true,
  supportsAudio: true,
  supportsRefinement: true,

  scoreExtractor: (analysis) => analysis.finalScore,
};
```

---

## Implementation Phases

### Phase 1: Extract Common Logic (Week 1)

**Goal:** Create the generic validator framework without breaking existing validators

**Tasks:**

1. Create `ValidatorConfig` interface and types
2. Create `GenericValidatorView` component
3. Extract shared hooks:
   - `useValidatorState` - State management
   - `useValidatorAuth` - Authentication logic
   - `useValidatorAnalysis` - Analysis flow
   - `useValidatorStorage` - Save/load logic
   - `useValidatorFrankenstein` - Frankenstein integration
4. Create `ValidatorRegistry`
5. Write unit tests for generic components

**Deliverables:**

- `src/domain/validators/` - Type definitions
- `features/validators/components/GenericValidatorView.tsx`
- `features/validators/hooks/` - Shared hooks
- `src/infrastructure/validators/ValidatorRegistry.ts`
- Tests for all new components

**Success Criteria:**

- All tests pass
- No changes to existing validator pages yet
- Generic components are fully typed and documented

### Phase 2: Create Validator Configurations (Week 2)

**Goal:** Configure existing validators using the new system

**Tasks:**

1. Create `classicAnalyzerConfig.ts`
2. Create `kiroweenAnalyzerConfig.ts`
3. Adapt existing input/display components to work with generic system
4. Create theme configurations
5. Test configurations with generic view

**Deliverables:**

- `src/infrastructure/validators/configs/classicAnalyzer.ts`
- `src/infrastructure/validators/configs/kiroweenAnalyzer.ts`
- Updated input/display components with proper interfaces
- Configuration validation tests

**Success Criteria:**

- Both validators work with generic system
- All existing features preserved
- No regression in functionality

### Phase 3: Migrate Existing Validators (Week 3)

**Goal:** Replace existing validator implementations with generic system

**Tasks:**

1. Create new route structure: `app/validators/[slug]/page.tsx`
2. Set up redirects from old routes to new routes
3. Update all internal links
4. Migrate database queries to use generic system
5. Update API routes to work with generic system
6. Comprehensive testing

**Deliverables:**

- `app/validators/[slug]/page.tsx` - Generic validator page
- Redirects from `/analyzer` → `/validators/analyzer`
- Redirects from `/kiroween-analyzer` → `/validators/kiroween-analyzer`
- Updated navigation and links
- Migration guide documentation

**Success Criteria:**

- All existing functionality works
- No broken links
- All tests pass
- Performance is equal or better

### Phase 4: Clean Up & Documentation (Week 4)

**Goal:** Remove old code and document the new system

**Tasks:**

1. Remove old validator pages and components
2. Remove duplicate code
3. Write comprehensive documentation
4. Create validator creation guide
5. Add examples for creating new validators
6. Update steering rules

**Deliverables:**

- Cleaned up codebase
- `docs/VALIDATOR_SYSTEM.md` - System documentation
- `docs/CREATE_NEW_VALIDATOR.md` - Step-by-step guide
- Updated architecture documentation
- Example validator template

**Success Criteria:**

- No dead code remaining
- Documentation is clear and complete
- Team can create new validator in < 2 hours

---

## Creating a New Validator (After Modularization)

### Step 1: Define Your Types

```typescript
// types/myValidator.ts

export interface MyInput {
  field1: string;
  field2: number;
}

export interface MyAnalysis {
  score: number;
  feedback: string;
  recommendations: string[];
}
```

### Step 2: Create Input Component

```typescript
// features/my-validator/components/MyInputForm.tsx

export function MyInputForm({
  input,
  onInputChange,
  onAnalyze,
  isLoading,
}: InputComponentProps<MyInput>) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onAnalyze();
      }}
    >
      <input
        value={input.field1}
        onChange={(e) => onInputChange({ ...input, field1: e.target.value })}
      />
      {/* ... more fields */}
      <button type="submit" disabled={isLoading}>
        Ana{" "}
      </button>
    </form>
  );
}
```

### Step 3: Create Display Component

```typescript
// features/my-validator/components/MyAnalysisDisplay.tsx

export function MyAnalysisDisplay({
  analysis,
  onSave,
  isSaved,
}: DisplayComponentProps<MyAnalysis>) {
  return (
    <div>
      <h2>Score: {analysis.score}</h2>
      <p>{analysis.feedback}</p>
      <ul>
        {analysis.recommendations.map((rec, i) => (
          <li key={i}>{rec}</li>
        ))}
      </ul>
      {!isSaved && <button onClick={onSave}>Save</button>}
    </div>
  );
}
```

### Step 4: Create Prompt

```typescript
// lib/prompts/myValidator.ts

export function generateMyPrompt(input: MyInput, locale: Locale): string {
  return `Analyze this input: ${input.field1}...`;
}
```

### Step 5: Create Configuration

```typescript
// src/infrastructure/validators/configs/myValidator.ts

export const myValidatorConfig: ValidatorConfig<MyInput, MyAnalysis> = {
  id: "my-validator",
  name: "My Validator",
  slug: "my-validator",

  apiEndpoint: "/api/v2/my-validator/analyze",
  promptGenerator: generateMyPrompt,

  theme: {
    primaryColor: "blue-500",
    secondaryColor: "purple-500",
    backgroundColor: "bg-gray-900",
    gradientFrom: "from-blue-500",
    gradientTo: "to-purple-500",
    borderColor: "border-blue-500",
    accentColor: "text-blue-400",
  },

  loadingMessages: (locale) => ["Processing...", "Analyzing..."],

  inputComponent: MyInputForm,
  displayComponent: MyAnalysisDisplay,

  inputSchema: z.object({
    field1: z.string().min(1),
    field2: z.number().positive(),
  }),

  analysisSchema: z.object({
    score: z.number(),
    feedback: z.string(),
    recommendations: z.array(z.string()),
  }),

  storageKey: "my_validator_analyses",
  databaseTable: "saved_analyses", // or create new table

  supportsFrankenstein: false,
  supportsAudio: false,
  supportsRefinement: true,

  scoreExtractor: (analysis) => analysis.score,
};
```

### Step 6: Register Validator

```typescript
// src/infrastructure/validators/ValidatorRegistry.ts

import { myValidatorConfig } from "./configs/myValidator";

validators.set("my-validator", myValidatorConfig);
```

### Step 7: Create API Route

```typescript
// app/api/v2/my-validator/analyze/route.ts

export async function POST(request: Request) {
  const { input, locale } = await request.json();

  // Validate input
  const config = getValidatorConfig("my-validator");
  const validatedInput = config.inputSchema.parse(input);

  // Generate prompt
  const prompt = config.promptGenerator(validatedInput, locale);

  // Call AI
  const analysis = await callAI(prompt);

  // Validate output
  const validatedAnalysis = config.analysisSchema.parse(analysis);

  return Response.json(validatedAnalysis);
}
```

### Step 8: Done!

Your validator is now accessible at `/validators/my-validator` with:

- ✅ Authentication
- ✅ Credit management
- ✅ Save/load functionality
- ✅ Error handling
- ✅ Loading states
- ✅ URL parameter handling
- ✅ Language switching
- ✅ Responsive design

**Total time: ~2 hours** (vs. ~2 days copying and modifying existing code)

---

## Benefits of Modularization

### 1. Rapid Validator Creation

- Create new validator in 2 hours instead of 2 days
- No code duplication
- Consistent behavior across all validators

### 2. Easier Maintenance

- Fix bugs once, all validators benefit
- Update features once, all validators get them
- Consistent patterns reduce cognitive load

### 3. Better Testing

- Test generic components once
- Validator-specific tests are minimal
- Higher test coverage with less code

### 4. Improved Consistency

- All validators have same UX patterns
- Consistent error handling
- Consistent authentication flow

### 5. Flexibility

- Easy to add new features to all validators
- Easy to customize specific validators
- Easy to A/B test improvements

### 6. Doctor Frankenstein Integration

- Any validator can be Frankenstein-enabled
- Consistent integration pattern
- Easy to track validation sources

---

## Migration Risks & Mitigation

### Risk 1: Breaking Existing Functionality

**Mitigation:**

- Comprehensive test suite before migration
- Feature flag for new system
- Parallel run old and new systems
- Gradual rollout (one validator at a time)

### Risk 2: Performance Degradation

**Mitigation:**

- Performance benchmarks before/after
- Optimize generic components
- Use React.memo and useMemo appropriately
- Monitor bundle size

### Risk 3: Type Safety Issues

**Mitigation:**

- Strict TypeScript configuration
- Comprehensive type tests
- Use discriminated unions for different validator types
- Runtime validation with Zod

### Risk 4: Database Schema Changes

**Mitigation:**

- Keep existing tables initially
- Create migration scripts
- Test migrations on staging
- Rollback plan ready

### Risk 5: URL Changes Breaking Links

**Mitigation:**

- Permanent redirects (301) from old URLs
- Update all internal links
- Update documentation
- Monitor 404 errors

---

## Success Metrics

### Development Velocity

- **Before:** 2 days to create new validator
- **After:** 2 hours to create new validator
- **Target:** 90% reduction in development time

### Code Quality

- **Before:** ~2000 lines per validator (with duplication)
- **After:** ~200 lines per validator (config + components)
- **Target:** 90% reduction in code per validator

### Maintenance

- **Before:** Fix bug in 2 places
- **After:** Fix bug in 1 place
- **Target:** 50% reduction in bug fix time

### Test Coverage

- **Before:** ~60% coverage (hard to test duplicated code)
- **After:** ~90% coverage (test generic components once)
- **Target:** 30% increase in coverage

### User Experience

- **Before:** Inconsistent behavior between validators
- **After:** Consistent behavior across all validators
- **Target:** 0 UX inconsistencies

---

## Future Enhancements

### Phase 5: Advanced Features (Post-Launch)

1. **Validator Marketplace**

   - Community-contributed validators
   - Validator templates
   - Validator discovery

2. **Validator Composition**

   - Chain multiple validators
   - Combine validator results
   - Multi-stage validation

3. **Validator Analytics**

   - Track validator usage
   - Avalidator configurations
   - Optimize prompts based on feedback

4. **Validator Customization**

   - User-configurable validators
   - Custom prompts
   - Custom scoring criteria

5. **Validator API**
   - Public API for validators
   - Webhook integrations
   - Third-party integrations

---

## Conclusion

Modularizing the validator system will:

- **Reduce development time by 90%** for new validators
- **Reduce code duplication by 90%**
- **Improve maintainability** significantly
- **Enable rapid experimentation** with new validator types
- **Provide consistent UX** across all validators
- **Make Doctor Frankenstein integration** seamless

The investment of 4 weeks will pay off immediately with the first new validator created, and continue to provide value as the system grows.

**Recommended Next Step:** Begin Phase 1 (Extract Common Logic) to create the foundation without disrupting existing functionality.
