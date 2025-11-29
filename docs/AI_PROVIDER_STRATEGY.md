# AI Provider Strategy: Multi-Provider Support

## Overview

This document outlines the strategy for adding OpenAI support alongside the existing Google Gemini integration. The goal is to enable provider flexibility, resilience through fallback, and future extensibility—all while maximizing reuse of existing components.

## Current Architecture

### What We Have

```
src/
├── application/services/
│   ├── IAIAnalysisService.ts          # Port interface (contract)
│   └── GoogleAIAnalysisService.ts     # Application service (orchestration)
├── infrastructure/external/ai/
│   └── GoogleAIAdapter.ts             # Gemini adapter (implementation)
└── lib/prompts/
    ├── startupIdea.ts                 # Startup analysis prompts
    └── hackathonProject.ts            # Hackathon analysis prompts
```

### Key Components to Reuse

| Component            | Location                                            | Reuse Strategy                     |
| -------------------- | --------------------------------------------------- | ---------------------------------- |
| `IAIAnalysisService` | `src/application/services/`                         | Keep as-is (port interface)        |
| `AIAnalysisResult`   | `src/infrastructure/external/ai/GoogleAIAdapter.ts` | Extract to shared types            |
| `AIServiceError`     | `src/infrastructure/external/ai/GoogleAIAdapter.ts` | Extract to shared errors           |
| Prompt generators    | `lib/prompts/`                                      | Reuse directly (provider-agnostic) |
| Retry logic          | `GoogleAIAdapter.withRetry()`                       | Extract to shared utility          |
| Response parsing     | `GoogleAIAdapter.parseAnalysisResponse()`           | Extract to shared parser           |

---

## Proposed Architecture

### Target Structure

```
src/
├── application/services/
│   ├── IAIAnalysisService.ts              # Unchanged - port interface
│   └── GoogleAIAnalysisService.ts         # Unchanged - application service
├── infrastructure/external/ai/
│   ├── types/
│   │   ├── AIAnalysisResult.ts            # NEW: Extracted shared result type
│   │   └── AIServiceError.ts              # NEW: Extracted shared error class
│   ├── utils/
│   │   ├── retryWithBackoff.ts            # NEW: Extracted retry logic
│   │   └── parseAnalysisResponse.ts       # NEW: Extracted JSON parser
│   ├── GoogleAIAdapter.ts                 # REFACTOR: Use shared utils
│   ├── OpenAIAdapter.ts                   # NEW: OpenAI implementation
│   └── AIAdapterFactory.ts                # NEW: Factory for provider selection
├── infrastructure/config/
│   └── ai.ts                              # UPDATE: Add OpenAI config
└── lib/prompts/
    ├── startupIdea.ts                     # Unchanged - provider-agnostic
    └── hackathonProject.ts                # Unchanged - provider-agnostic
```

---

## Implementation Plan

### Phase 1: Extract Shared Components

**Goal:** Prepare reusable utilities without changing existing behavior.

#### 1.1 Extract Types

Create `src/infrastructure/external/ai/types/AIAnalysisResult.ts`:

```typescript
export interface AIAnalysisResult {
  score: number;
  detailedSummary: string;
  criteria: Array<{
    name: string;
    score: number;
    justification: string;
  }>;
  suggestions: string[];
  // Optional extended fields (preserved from AI response)
  [key: string]: unknown;
}
```

Create `src/infrastructure/external/ai/types/AIServiceError.ts`:

```typescript
export class AIServiceError extends Error {
  constructor(
    message: string,
    public readonly code: AIErrorCode,
    public readonly originalError?: unknown,
    public readonly operation?: string
  ) {
    super(message);
    this.name = "AIServiceError";
  }
}

export type AIErrorCode =
  | "EMPTY_RESPONSE"
  | "PARSE_ERROR"
  | "INVALID_FORMAT"
  | "RATE_LIMIT"
  | "TIMEOUT"
  | "AUTH_ERROR"
  | "UNKNOWN_ERROR";
```

#### 1.2 Extract Utilities

Create `src/infrastructure/external/ai/utils/retryWithBackoff.ts`:

```typescript
import { Result } from "@/shared/types/common";
import { AIServiceError } from "../types/AIServiceError";

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  retryableCodes: string[];
}

export async function retryWithBackoff<T>(
  operation: () => Promise<Result<T, Error>>,
  config: RetryConfig
): Promise<Result<T, Error>> {
  // Extract existing logic from GoogleAIAdapter.withRetry()
}
```

Create `src/infrastructure/external/ai/utils/parseAnalysisResponse.ts`:

```typescript
import { AIAnalysisResult } from "../types/AIAnalysisResult";

export function parseAnalysisResponse(rawText: string): AIAnalysisResult {
  // Extract existing logic from GoogleAIAdapter.parseAnalysisResponse()
  // This parser works for both Gemini and OpenAI JSON responses
}
```

#### 1.3 Refactor GoogleAIAdapter

Update to use extracted utilities:

```typescript
import { retryWithBackoff } from "./utils/retryWithBackoff";
import { parseAnalysisResponse } from "./utils/parseAnalysisResponse";
import { AIAnalysisResult } from "./types/AIAnalysisResult";
import { AIServiceError } from "./types/AIServiceError";

export class GoogleAIAdapter {
  // Use shared utilities instead of private methods
}
```

---

### Phase 2: Create OpenAI Adapter

**Goal:** Implement OpenAI adapter with same interface.

#### 2.1 OpenAI Adapter

Create `src/infrastructure/external/ai/OpenAIAdapter.ts`:

```typescript
import OpenAI from "openai";
import { Locale } from "@/domain/value-objects";
import { Result, success, failure } from "@/shared/types/common";
import { AIAnalysisResult } from "./types/AIAnalysisResult";
import { AIServiceError } from "./types/AIServiceError";
import { retryWithBackoff } from "./utils/retryWithBackoff";
import { parseAnalysisResponse } from "./utils/parseAnalysisResponse";
import {
  generateStartupIdeaPrompt,
  generateHackathonProjectPrompt,
} from "@/lib/prompts";

export interface OpenAIConfig {
  apiKey: string;
  model?: string; // Default: 'gpt-4o-mini'
  timeout?: number;
  maxRetries?: number;
}

export class OpenAIAdapter {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly config: OpenAIConfig;

  constructor(config: OpenAIConfig) {
    this.config = config;
    this.model = config.model || "gpt-4o-mini";
    this.client = new OpenAI({ apiKey: config.apiKey });
  }

  async analyzeIdea(
    idea: string,
    locale: Locale
  ): Promise<Result<AIAnalysisResult, Error>> {
    return retryWithBackoff(async () => {
      try {
        const prompt = generateStartupIdeaPrompt(idea, locale.value);

        const response = await this.client.chat.completions.create({
          model: this.model,
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.3,
        });

        const rawText = response.choices[0]?.message?.content?.trim();
        if (!rawText) {
          return failure(
            new AIServiceError("Empty response", "EMPTY_RESPONSE")
          );
        }

        const result = parseAnalysisResponse(rawText);
        return success(result);
      } catch (error) {
        return this.handleError(error, "analyzeIdea");
      }
    }, this.getRetryConfig());
  }

  async analyzeHackathonProject(
    projectDescription: string,
    category: string,
    locale: Locale
  ): Promise<Result<AIAnalysisResult, Error>> {
    // Similar implementation using generateHackathonProjectPrompt
  }

  async generateSpeech(
    text: string,
    locale: Locale
  ): Promise<Result<string, Error>> {
    // Use OpenAI TTS API
  }

  async transcribeAudio(
    base64Audio: string,
    mimeType: string,
    locale: Locale
  ): Promise<Result<string, Error>> {
    // Use OpenAI Whisper API
  }

  private handleError(
    error: unknown,
    operation: string
  ): Result<never, AIServiceError> {
    // Map OpenAI errors to AIServiceError codes
  }

  private getRetryConfig(): RetryConfig {
    return {
      maxRetries: this.config.maxRetries || 3,
      baseDelayMs: 1000,
      retryableCodes: ["TIMEOUT", "RATE_LIMIT", "UNKNOWN_ERROR"],
    };
  }

  static create(apiKey?: string, model?: string): OpenAIAdapter {
    const key = apiKey || process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error("OPENAI_API_KEY environment variable not set");
    }
    return new OpenAIAdapter({ apiKey: key, model });
  }
}
```

---

### Phase 3: Create Factory & Configuration

**Goal:** Enable runtime provider selection.

#### 3.1 AI Adapter Factory

Create `src/infrastructure/external/ai/AIAdapterFactory.ts`:

```typescript
import { GoogleAIAdapter } from "./GoogleAIAdapter";
import { OpenAIAdapter } from "./OpenAIAdapter";

export type AIProvider = "gemini" | "openai";

export interface AIAdapterConfig {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
}

export type AIAdapter = GoogleAIAdapter | OpenAIAdapter;

export class AIAdapterFactory {
  static create(config?: Partial<AIAdapterConfig>): AIAdapter {
    const provider = config?.provider || this.getDefaultProvider();

    switch (provider) {
      case "openai":
        return OpenAIAdapter.create(config?.apiKey, config?.model);
      case "gemini":
      default:
        return GoogleAIAdapter.create(config?.apiKey, config?.model);
    }
  }

  private static getDefaultProvider(): AIProvider {
    const envProvider = process.env.AI_PROVIDER?.toLowerCase();
    if (envProvider === "openai") return "openai";
    return "gemini"; // Default to Gemini for backward compatibility
  }

  static createWithFallback(
    primary: AIProvider = "gemini",
    fallback: AIProvider = "openai"
  ): ResilientAIAdapter {
    return new ResilientAIAdapter(
      this.create({ provider: primary }),
      this.create({ provider: fallback })
    );
  }
}
```

#### 3.2 Resilient Adapter (Optional)

Create `src/infrastructure/external/ai/ResilientAIAdapter.ts`:

```typescript
import { Locale } from "@/domain/value-objects";
import { Result } from "@/shared/types/common";
import { AIAnalysisResult } from "./types/AIAnalysisResult";
import { AIServiceError } from "./types/AIServiceError";
import { AIAdapter } from "./AIAdapterFactory";
import { logger, LogCategory } from "@/lib/logger";

export class ResilientAIAdapter {
  constructor(
    private readonly primary: AIAdapter,
    private readonly fallback: AIAdapter
  ) {}

  async analyzeIdea(
    idea: string,
    locale: Locale
  ): Promise<Result<AIAnalysisResult, Error>> {
    const result = await this.primary.analyzeIdea(idea, locale);

    if (!result.success && this.shouldFallback(result.error)) {
      logger.warn(LogCategory.AI, "Primary AI failed, using fallback", {
        error: result.error.message,
      });
      return this.fallback.analyzeIdea(idea, locale);
    }

    return result;
  }

  private shouldFallback(error: Error): boolean {
    if (error instanceof AIServiceError) {
      return ["RATE_LIMIT", "TIMEOUT", "AUTH_ERROR"].includes(error.code);
    }
    return true;
  }
}
```

#### 3.3 Environment Configuration

Update `.env.example`:

```bash
# AI Provider Configuration
# Options: 'gemini' (default) | 'openai'
AI_PROVIDER=gemini

# Google Gemini (required if AI_PROVIDER=gemini)
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash-lite

# OpenAI (required if AI_PROVIDER=openai)
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
```

Update `src/infrastructure/config/ai.ts`:

```typescript
export interface AIConfig {
  provider: "gemini" | "openai";
  gemini: {
    apiKey: string;
    model: string;
  };
  openai: {
    apiKey: string;
    model: string;
  };
  enableFallback: boolean;
}

export function getAIConfig(): AIConfig {
  return {
    provider: (process.env.AI_PROVIDER as "gemini" | "openai") || "gemini",
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || "",
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY || "",
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    },
    enableFallback: process.env.AI_ENABLE_FALLBACK === "true",
  };
}
```

---

### Phase 4: Integration

**Goal:** Wire up the factory in existing code paths.

#### 4.1 Update Service Factory

Update `src/infrastructure/factories/ServiceFactory.ts`:

```typescript
import { AIAdapterFactory } from "../external/ai/AIAdapterFactory";
import { getAIConfig } from "../config/ai";

export class ServiceFactory {
  createAIAdapter() {
    const config = getAIConfig();

    if (config.enableFallback) {
      return AIAdapterFactory.createWithFallback(
        config.provider,
        config.provider === "gemini" ? "openai" : "gemini"
      );
    }

    return AIAdapterFactory.create({ provider: config.provider });
  }
}
```

#### 4.2 Update API Routes

No changes needed if routes already use `ServiceFactory`. The factory handles provider selection.

---

## Feature Flag Integration

For gradual rollout, use existing feature flag system:

```typescript
// lib/featureFlags.config.ts
export const featureFlags = {
  // ... existing flags
  USE_OPENAI: {
    description: "Use OpenAI instead of Gemini for AI analysis",
    defaultValue: false,
  },
  AI_FALLBACK_ENABLED: {
    description: "Enable fallback to secondary AI provider",
    defaultValue: false,
  },
};
```

Usage in factory:

```typescript
import { isFeatureEnabled } from "@/lib/featureFlags";

export class AIAdapterFactory {
  static create(): AIAdapter {
    if (isFeatureEnabled("USE_OPENAI")) {
      return OpenAIAdapter.create();
    }
    return GoogleAIAdapter.create();
  }
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// src/infrastructure/external/ai/__tests__/OpenAIAdapter.test.ts
describe("OpenAIAdapter", () => {
  describe("analyzeIdea", () => {
    it("should return analysis result for valid idea", async () => {
      // Mock OpenAI client
    });

    it("should handle rate limit errors", async () => {
      // Verify AIServiceError with RATE_LIMIT code
    });

    it("should retry on transient failures", async () => {
      // Verify retry logic
    });
  });
});
```

### Integration Tests

```typescript
// tests/integration/ai-providers.test.ts
describe("AI Provider Parity", () => {
  it("should return similar structure from both providers", async () => {
    const geminiResult = await geminiAdapter.analyzeIdea(testIdea, locale);
    const openaiResult = await openaiAdapter.analyzeIdea(testIdea, locale);

    // Verify both have required fields
    expect(geminiResult.data).toHaveProperty("score");
    expect(openaiResult.data).toHaveProperty("score");
  });
});
```

---

## Migration Path

### Step 1: Deploy with Gemini (default)

- Add OpenAI code but keep `AI_PROVIDER=gemini`
- No behavior change

### Step 2: Internal Testing

- Set `AI_PROVIDER=openai` in staging
- Compare quality and latency

### Step 3: Gradual Rollout

- Enable `USE_OPENAI` feature flag for 10% of users
- Monitor metrics

### Step 4: Full Migration (if desired)

- Change default to `openai`
- Keep Gemini as fallback

---

## Cost Comparison

| Provider | Model                 | Input (1M tokens) | Output (1M tokens) |
| -------- | --------------------- | ----------------- | ------------------ |
| Gemini   | gemini-2.5-flash-lite | ~$0.075           | ~$0.30             |
| OpenAI   | gpt-4o-mini           | $0.15             | $0.60              |
| OpenAI   | gpt-4o                | $2.50             | $10.00             |

**Recommendation:** Use `gpt-4o-mini` for cost parity with Gemini, or `gpt-4o` for premium quality.

---

## Open Questions

1. **TTS/Transcription:** Should OpenAI Whisper/TTS replace Gemini's, or keep separate?
2. **Model Selection:** Allow per-request model override for power users?
3. **Metrics:** Add provider-specific latency/quality tracking to PostHog?
4. **Mock Mode:** Should mock mode simulate both providers?

---

## Summary

This strategy enables OpenAI support with:

- **Minimal code changes** - Reuses prompts, parsing, retry logic
- **Backward compatibility** - Gemini remains default
- **Flexibility** - Environment variable or feature flag control
- **Resilience** - Optional fallback between providers
- **Testability** - Same interface enables easy testing

The implementation follows hexagonal architecture principles, keeping the domain layer unchanged and adding infrastructure adapters.
