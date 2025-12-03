# Validator Modularization - Detailed Implementation Spec

## Goal

Transform the validator system from duplicated code to a configuration-driven architecture where creating a new validator requires only:

1. **Create a configuration file** (~20 min)
2. **Register theator** (~5 min)
3. **Create a prompt** (~5 min)

**Total: ~30 minutes** instead of 2 days of copying/modifying 2000+ lines of code.

---

## Implementation Strategy

**Build new system in parallel → Test thoroughly → Switch atomically → Clean up later**

This ensures zero breaking changes and easy rollback.

---

## Detailed File-by-File Implementation

### Part 1: Type System & Interfaces

#### File: `src/domain/validators/ValidatorConfig.ts`

**Purpose:** Define the configuration interface that describes a validator

**Full Implementation:**

```typescript
import { z } from "zod";
import { Locale } from "@/lib/prompts/constants";
import React from "react";

/**
 * Configuration for a validator
 * This is the single source of truth for how a validator behaves
 */
export interface ValidatorConfig<TInput, TAnalysis> {
  // ===== IDENTITY =====
  /** Unique identifier (e.g., 'classic-analyzer') */
  id: string;

  /** Display name (e.g., 'Startup Idea Analyzer') */
  name: string;

  /** URL slug (e.g., 'analyzer' for /validators/analyzer) */
  slug: string;

  // ===== BEHAVIOR =====
  /** API endpoint to call for analysis (e.g., '/api/v2/analyze') */
  apiEndpoint: string;

  /** Function that generates the AI prompt */
  promptGenerator: (input: TInput, locale: Locale) => string;

  // ===== UI CONFIGURATION =====
  /** Theme colors and styling */
  theme: ValidatorTheme;

  /** Loading messages that rotate during analysis */
  loadingMessages: (locale: Locale) => string[];

  /** Component for input form */
  inputComponent: React.ComponentType<InputComponentProps<TInput>>;

  /** Component for displaying results */
  displayComponent: React.ComponentType<DisplayComponentProps<TAnalysis>>;

  // ===== DATA VALIDATION =====
  /** Zod schema for validating input */
  inputSchema: z.ZodSchema<TInput>;

  /** Zod schema for validating AI response */
  analysisSchema: z.ZodSchema<TAnalysis>;

  // ===== STORAGE =====
  /** LocalStorage key for dev mode */
  storageKey: string;

  /** Database table name */
  databaseTable: "saved_analyses" | "saved_hackathon_analyses";

  // ===== FEATURE FLAGS =====
  /** Can this validator be used from Doctor Frankenstein? */
  supportsFrankenstein: boolean;

  /** Can this validator generate audio summaries? */
  supportsAudio: boolean;

  /** Can users refine input with AI suggestions? */
  supportsRefinement: boolean;

  // ===== SCORING =====
  /** Extract numeric score from analysis (for Frankenstein integration) */
  scoreExtractor: (analysis: TAnalysis) => number;

  // ===== OPTIONAL HOOKS =====
  /** Custom lifecycle hooks for special behavior */
  customHooks?: {
    beforeAnalyze?: (input: TInput) => Promise<void>;
    afterAnalyze?: (analysis: TAnalysis) => Promise<void>;
    beforeSave?: (input: TInput, analysis: TAnalysis) => Promise<void>;
    afterSave?: (savedId: string) => Promise<void>;
  };
}

/**
 * Theme configuration for a validator
 */
export interface ValidatorTheme {
  primaryColor: string; // e.g., 'accent', 'blue-500'
  secondaryColor: string; // e.g., 'secondary', 'purple-500'
  backgroundColor: string; // e.g., 'bg-black', 'bg-gray-900'
  gradientFrom: string; // e.g., 'from-accent', 'from-blue-500'
  gradientTo: string; // e.g., 'to-secondary', 'to-purple-500'
  borderColor: string; // e.g., 'border-accent', 'border-blue-500'
  accentColor: string; // e.g., 'text-accent', 'text-blue-400'
}

/**
 * Props for input components
 * All input components must accept these props
 */
export interface InputComponentProps<TInput> {
  input: TInput;
  onInputChange: (input: TInput) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  analysisType?: string; // Optional, for backwards compatibility
}

/**
 * Props for display components
 * All display components must accept these props
 */
export interface DisplayComponentProps<TAnalysis> {
  analysis: TAnalysis;
  onSave: () => void;
  isSaved: boolean;
  savedAnalysisId?: string;
  savedAudioBase64: string | null;
  onAudioGenerated: (audioBase64: string) => void;
  onGoToDashboard: () => void;
  onRefineSuggestion?: (text: string, title: string, index: number) => void;
  addedSuggestions?: number[];
}
```

#### File: `src/domain/validators/ValidatorTypes.ts`

**Purpose:** Shared types for validator state and actions

**Full Implementation:**

```typescript
/**
 * State managed by a validator
 */
export interface ValidatorState<TInput, TAnalysis> {
  // Input
  input: TInput;

  // Analysis results
  newAnalysis: TAnalysis | null;
  savedAnalysisRecord: any | null;

  // Loading states
  isLoading: boolean;
  isFetchingSaved: boolean;
  isSaving: boolean;
  loadingMessage: string;

  // Errors
  error: string | null;
  saveError: string | null;

  // Status
  isReportSaved: boolean;

  // Audio
  generatedAudio: string | null;

  // Refinement
  addedSuggestions: number[];

  // Credits
  credits: number;
}

/**
 * Actions available to a validator
 */
export interface ValidatorActions<TInput, TAnalysis> {
  setInput: (input: TInput) => void;
  handleAnalyze: () => Promise<void>;
  handleSaveReport: () => Promise<void>;
  handleRetrySave: () => Promise<void>;
  handleStartNewAnalysis: () => void;
  handleAudioGenerated: (audioBase64: string) => Promise<void>;
  handleRefineSuggestion: (text: string, title: string, index: number) => void;
  refreshCredits: () => Promise<void>;
}
```

#### File: `src/domain/validators/index.ts`

**Purpose:** Barrel export for clean imports

```typescript
export * from "./ValidatorConfig";
export * from "./ValidatorTypes";
```

---

### Part 2: Validator Registry

#### File: `src/infrastructure/validators/ValidatorRegistry.ts`

**Purpose:** Central registry for all validators

**Full Implementation:**

```typescript
import { ValidatorConfig } from "@/src/domain/validators/ValidatorConfig";

/**
 * Global registry of all validators
 * Maps slug → config
 */
const validators = new Map<string, ValidatorConfig<any, any>>();

/**
 * Register a validator configuration
 * Called during app initialization
 */
export function registerValidator(config: ValidatorConfig<any, any>): void {
  if (validators.has(config.slug)) {
    console.warn(
      `Validator with slug "${config.slug}" is already registered. Overwriting.`
    );
  }

  validators.set(config.slug, config);
  console.log(`✓ Registered validator: ${config.name} (/${config.slug})`);
}

/**
 * Get a validator configuration by slug
 * Returns null if not found
 */
export function getValidatorConfig(
  slug: string
): ValidatorConfig<any, any> | null {
  return validators.get(slug) || null;
}

/**
 * Get all registered validators
 * Useful for generating navigation, sitemaps, etc.
 */
export function getAllValidators(): ValidatorConfig<any, any>[] {
  return Array.from(validators.values());
}

/**
 * Check if a validator exists
 */
export function hasValidator(slug: string): boolean {
  return validators.has(slug);
}
```

---

### Part 3: Validator Configurations

#### File: `src/infrastructure/validators/configs/classicAnalyzer.ts`

**Purpose:** Configuration for the Classic Analyzer

**Full Implementation:**

```typescript
import { ValidatorConfig } from "@/src/domain/validators/ValidatorConfig";
import { generateStartupIdeaPrompt } from "@/lib/prompts/startupIdea";
import {
  ClassicAnalyzerInputAdapter,
  ClassicAnalyzerDisplayAdapter,
} from "@/features/validators/adapters/ClassicAnalyzerAdapter";
import { z } from "zod";

/**
 * Classic Analyzer Configuration
 * Validates startup ideas with comprehensive analysis
 */
export const classicAnalyzerConfig: ValidatorConfig<string, any> = {
  // Identity
  id: "classic-analyzer",
  name: "Startup Idea Analyzer",
  slug: "analyzer",

  // Behavior
  apiEndpoint: "/api/v2/analyze",
  promptGenerator: generateStartupIdeaPrompt,

  // Theme (classic black/accent theme)
  theme: {
    primaryColor: "accent",
    secondaryColor: "secondary",
    backgroundColor: "bg-black",
    gradientFrom: "from-accent",
    gradientTo: "to-secondary",
    borderColor: "border-accent",
    accentColor: "text-accent",
  },

  // Loading messages
  loadingMessages: (locale) => [
    locale === "es" ? "Analizando tu idea..." : "Analyzing your idea...",
    locale === "es"
      ? "Investigando el mercado..."
      : "Researching the market...",
    locale === "es" ? "Evaluando competidores..." : "Evaluating competitors...",
    locale === "es" ? "Calculando puntuaciones..." : "Calculating scores...",
    locale === "es"
      ? "Generando recomendaciones..."
      : "Generating recommendations...",
    locale === "es" ? "Finalizando análisis..." : "Finalizing analysis...",
  ],

  // Components (wrapped existing components)
  inputComponent: ClassicAnalyzerInputAdapter,
  displayComponent: ClassicAnalyzerDisplayAdapter,

  // Validation
  inputSchema: z.string().min(10, "Idea must be at least 10 characters"),
  analysisSchema: z.any(), // Use existing Analysis type schema

  // Storage
  storageKey: "nvnc_saved_analyses",
  databaseTable: "saved_analyses",

  // Features
  supportsFrankenstein: true,
  supportsAudio: true,
  supportsRefinement: true,

  // Scoring
  scoreExtractor: (analysis) => analysis.finalScore || 0,
};
```

#### File: `src/infrastructure/validators/configs/kiroweenAnalyzer.ts`

**Purpose:** Configuration for the Kiroween Hackathon Analyzer

**Full Implementation:**

```typescript
import { ValidatorConfig } from "@/src/domain/validators/ValidatorConfig";
import { generateHackathonProjectPrompt } from "@/lib/prompts/hackathonProject";
import {
  KiroweenAnalyzerInputAdapter,
  KiroweenAnalyzerDisplayAdapter,
} from "@/features/validators/adapters/KiroweenAnalyzerAdapter";
import { z } from "zod";

/**
 * Kiroween Analyzer Configuration
 * Evaluates hackathon projects with spooky theme
 */
export const kiroweenAnalyzerConfig: ValidatorConfig<any, any> = {
  // Identity
  id: "kiroween-analyzer",
  name: "Kiroween Hackathon Analyzer",
  slug: "kiroween-analyzer",

  // Behavior
  apiEndpoint: "/api/v2/hackathon/analyze",
  promptGenerator: (input, locale) => {
    // Extract description and category from input
    const description = typeof input === "string" ? input : input.description;
    const category = typeof input === "object" ? input.category : undefined;
    return generateHackathonProjectPrompt(description, category, locale);
  },

  // Theme (spooky Halloween theme)
  theme: {
    primaryColor: "orange-400",
    secondaryColor: "purple-400",
    backgroundColor:
      "bg-gradient-to-br from-black via-purple-950/30 to-orange-950/30",
    gradientFrom: "from-orange-400",
    gradientTo: "to-purple-400",
    borderColor: "border-orange-400",
    accentColor: "text-orange-400",
  },

  // Loading messages (spooky themed)
  loadingMessages: (locale) => [
    locale === "es"
      ? "🎃 Invocando espíritus del código..."
      : "🎃 Summoning code spirits...",
    locale === "es"
      ? "👻 Analizando tu proyecto..."
      : "👻 Analyzing your project...",
    locale === "es"
      ? "🦇 Evaluando creatividad..."
      : "🦇 Evaluating creativity...",
    locale === "es"
      ? "🕷️ Calculando puntuaciones..."
      : "🕷️ Calculating scores...",
    locale === "es" ? "🕸️ Generando feedback..." : "🕸️ Generating feedback...",
    locale === "es"
      ? "💀 Finalizando análisis..."
      : "💀 Finalizing analysis...",
  ],

  // Components (wrapped existing components)
  inputComponent: KiroweenAnalyzerInputAdapter,
  displayComponent: KiroweenAnalyzerDisplayAdapter,

  // Validation
  inputSchema: z.object({
    description: z
      .string()
      .min(10, "Project description must be at least 10 characters"),
    supportingMaterials: z.record(z.string()).optional(),
    category: z.string().optional(),
  }),
  analysisSchema: z.any(), // Use existing HackathonAnalysis type schema

  // Storage
  storageKey: "nvnc_saved_hackathon_analyses",
  databaseTable: "saved_hackathon_analyses",

  // Features
  supportsFrankenstein: true,
  supportsAudio: true,
  supportsRefinement: true,

  // Scoring
  scoreExtractor: (analysis) => analysis.finalScore || 0,
};
```

#### File: `src/infrastructure/validators/configs/index.ts`

**Purpose:** Register all validators and export configs

**Full Implementation:**

```typescript
import { registerValidator } from "../ValidatorRegistry";
import { classicAnalyzerConfig } from "./classicAnalyzer";
import { kiroweenAnalyzerConfig } from "./kiroweenAnalyzer";

// Register all validators
// This runs when the module is imported
registerValidator(classicAnalyzerConfig);
registerValidator(kiroweenAnalyzerConfig);

// Export for direct access if needed
export { classicAnalyzerConfig, kiroweenAnalyzerConfig };
```

---

### Part 4: Adapter Components

**Purpose:** Wrap existing components to match the generic interface

#### File: `features/validators/adapters/ClassicAnalyzerAdapter.tsx`

**Full Implementation:**

```typescript
import React from "react";
import IdeaInputForm from "@/features/analyzer/components/IdeaInputForm";
import AnalysisDisplay from "@/features/analyzer/components/AnalysisDisplay";
import {
  InputComponentProps,
  DisplayComponentProps,
} from "@/src/domain/validators/ValidatorConfig";

/**
 * Adapter for Classic Analyzer input form
 * Wraps IdeaInputForm to match InputComponentProps interface
 */
export function ClassicAnalyzerInputAdapter({
  input,
  onInputChange,
  onAnalyze,
  isLoading,
}: InputComponentProps<string>) {
  return (
    <IdeaInputForm
      idea={input}
      onIdeaChange={onInputChange}
      onAnalyze={onAnalyze}
      isLoading={isLoading}
      analysisType="startup"
    />
  );
}

/**
 * Adapter for Classic Analyzer display
 * Wraps AnalysisDisplay to match DisplayComponentProps interface
 */
export function ClassicAnalyzerDisplayAdapter(
  props: DisplayComponentProps<any>
) {
  return <AnalysisDisplay {...props} />;
}
```

#### File: `features/validators/adapters/KiroweenAnalyzerAdapter.tsx`

**Full Implementation:**

```typescript
import React from "react";
import ProjectSubmissionForm from "@/features/kiroween-analyzer/components/ProjectSubmissionForm";
import HackathonAnalysisDisplay from "@/features/kiroween-analyzer/components/HackathonAnalysisDisplay";
import {
  InputComponentProps,
  DisplayComponentProps,
} from "@/src/domain/validators/ValidatorConfig";

/**
 * Adapter for Kiroween Analyzer input form
 * Wraps ProjectSubmissionForm to match InputComponentProps interface
 */
export function KiroweenAnalyzerInputAdapter({
  input,
  onInputChange,
  onAnalyze,
  isLoading,
}: InputComponentProps<any>) {
  return (
    <ProjectSubmissionForm
      submission={input}
      onSubmissionChange={onInputChange}
      onAnalyze={onAnalyze}
      isLoading={isLoading}
    />
  );
}

/**
 * Adapter for Kiroween Analyzer display
 * Wraps HackathonAnalysisDisplay to match DisplayComponentProps interface
 */
export function KiroweenAnalyzerDisplayAdapter(
  props: DisplayComponentProps<any>
) {
  return <HackathonAnalysisDisplay {...props} />;
}
```

---

### Part 5: Generic Validator Page

#### File: `app/validators/[slug]/page.tsx`

**Purpose:** Dynamic route that works for all validators

**Full Implementation:**

```typescript
import React, { Suspense } from "react";
import { redirect, notFound } from "next/navigation";
import { GenericValidatorView } from "@/features/validators/components/GenericValidatorView";
import Loader from "@/features/analyzer/components/Loader";
import {
  isCurrentUserPaid,
  isAuthenticated,
  getCurrentUser,
  getSessionContext,
} from "@/src/infrastructure/web/helpers/serverAuth";
import { getValidatorConfig } from "@/src/infrastructure/validators/ValidatorRegistry";
import "@/src/infrastructure/validators/configs"; // Import to register validators
import { generateMockUser } from "@/lib/mockData";
import type { UserTier } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Generate static params for all registered validators
 * This enables static generation at build time
 */
export async function generateStaticParams() {
  return [
    { slug: "analyzer" },
    { slug: "kiroween-analyzer" },
    // Future validators will be added automatically
  ];
}

/**
 * Generic validator page
 * Works for any registered validator based on slug
 */
export default async function ValidatorPage({
  params,
}: {
  params: { slug: string };
}) {
  // Get validator configuration
  const config = getValidatorConfig(params.slug);

  // 404 if validator doesn't exist
  if (!config) {
    console.warn(`Validator not found: ${params.slug}`);
    notFound();
  }

  // Development mode: bypass authentication
  const isDevelopment = process.env.NODE_ENV === "development";

  if (isDevelopment) {
    const mockUser = generateMockUser();
    return (
      <Suspense fallback={<Loader message={`Loading ${config.name}...`} />}>
        <GenericValidatorView
          config={config}
          initialCredits={3}
          userTier="free"
        />
      </Suspense>
    );
  }

  // Production: require authentication
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    redirect("/login");
  }

  // Check paid access
  const sessionContext = await getSessionContext();
  console.log(`[${config.name}] Session context:`, {
    isAuthenticated: sessionContext.isAuthenticated,
    isPaid: sessionContext.isPaid,
    isAdmin: sessionContext.isAdmin,
    tier: sessionContext.tier,
    userId: sessionContext.userId?.value,
  });

  const hasPaidAccess = await isCurrentUserPaid();
  if (!hasPaidAccess) {
    console.log(`[${config.name}] Access denied - redirecting to dashboard`);
    redirect("/dashboard");
  }

  // Get user credits and tier
  const user = await getCurrentUser();
  const credits = user?.credits ?? 3;
  const tier: UserTier = sessionContext.tier ?? "free";

  return (
    <Suspense fallback={<Loader message={`Loading ${config.name}...`} />}>
      <GenericValidatorView
        config={config}
        initialCredits={credits}
        userTier={tier}
      />
    </Suspense>
  );
}
```

---

## Creating a New Validator (After Implementation)

### Example: Product-Market Fit Validator

#### Step 1: Create Configuration (~20 min)

**File:** `src/infrastructure/validators/configs/pmfValidator.ts`

```typescript
import { ValidatorConfig } from "@/src/domain/validators/ValidatorConfig";
import { generatePMFPrompt } from "@/lib/prompts/pmfValidator";
import IdeaInputForm from "@/features/analyzer/components/IdeaInputForm";
import AnalysisDisplay from "@/features/analyzer/components/AnalysisDisplay";
import { z } from "zod";

export const pmfValidatorConfig: ValidatorConfig<string, any> = {
  id: "pmf-validator",
  name: "Product-Market Fit Analyzer",
  slug: "pmf-analyzer",

  apiEndpoint: "/api/v2/pmf/analyze",
  promptGenerator: generatePMFPrompt,

  theme: {
    primaryColor: "green-500",
    secondaryColor: "teal-500",
    backgroundColor: "bg-gradient-to-br from-black to-green-950/20",
    gradientFrom: "from-green-500",
    gradientTo: "to-teal-500",
    borderColor: "border-green-500",
    accentColor: "text-green-400",
  },

  loadingMessages: (locale) => [
    locale === "es"
      ? "Evaluando ajuste producto-mercado..."
      : "Evaluating product-market fit...",
    locale === "es"
      ? "Analizando señales de mercado..."
      : "Analyzing market signals...",
  ],

  inputComponent: IdeaInputForm, // Reuse existing component
  displayComponent: AnalysisDisplay, // Reuse existing component

  inputSchema: z.string().min(10),
  analysisSchema: z.object({
    pmfScore: z.number(),
    signals: z.array(z.string()),
    recommendations: z.array(z.string()),
  }),

  storageKey: "pmf_analyses",
  databaseTable: "saved_analyses",

  supportsFrankenstein: true,
  supportsAudio: true,
  supportsRefinement: true,

  scoreExtractor: (analysis) => analysis.pmfScore,
};
```

#### Step 2: Register Validator (~5 min)

**File:** `src/infrastructure/validators/configs/index.ts` (ADD)

```typescript
import { pmfValidatorConfig } from "./pmfValidator";

registerValidator(pmfValidatorConfig);

export { pmfValidatorConfig };
```

#### Step 3: Create Prompt (~5 min)

**File:** `lib/prompts/pmfValidator.ts`

```typescript
import { Locale } from "./constants";

export function generatePMFPrompt(input: string, locale: Locale): string {
  const languageInstruction =
    locale === "es"
      ? "MUY IMPORTANTE: Tu respuesta completa debe estar en español."
      : "VERY IMPORTANT: Your entire response must be in English.";

  return `You are a product-market fit expert...

${languageInstruction}

Analyze: "${input}"

Return JSON:
{
  "pmfScore": 7.5,
  "signals": ["signal 1", "signal 2"],
  "recommendations": ["rec 1", "rec 2"]
}`;
}
```

### Done! ✅

Your validator is now live at `/validators/pmf-analyzer` with all features included automatically.

**Total time: ~30 minutes**

---

## Testing Strategy

### Before Atomic Switch

1. **Unit Tests** - Test all new components
2. **E2E Tests** - Test new routes match old behavior
3. **Manual Testing** - Complete checklist
4. **Performance Testing** - Verify no regression

### Testing Checklist

- [ ] `/validators/analyzer` works identically to `/analyzer`
- [ ] `/validators/kiroween-analyzer` works identically to `/kiroween-analyzer`
- [ ] All features work (save, load, audio, Frankenstein, etc.)
- [ ] No console errors
- [ ] Performance is equal or better
- [ ] Mobile responsive
- [ ] Accessibility maintained

---

## Rollback Plan

If issues found after deployment:

```bash
# Immediate rollback (< 5 minutes)
git revert <commit-hash>
git push

# Old system is live again
# Fix issues in new system
# Redeploy when ready
```

---

## Success Metrics

- ✅ 90% reduction in code duplication
- ✅ 30-minute validator creation time (vs. 2 days)
- ✅ Zero breaking changes
- ✅ All existing features preserved
- ✅ Easy to maintain and extend
