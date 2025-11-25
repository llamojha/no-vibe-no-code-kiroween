# Document Generator Analytics Tracking

This module provides comprehensive analytics tracking for the Document Generation feature using PostHog.

## Overview

The Document Generator analytics tracking captures user interactions and behaviors within the document generation workflow, providing insights into how users generate, edit, version, and export documents.

## Tracked Events

### 1. Document Generation Request (`document_generation_requested`)

Tracks when a user initiates document generation.

**Properties:**

- `idea_id`: Unique identifier of the idea
- `document_type`: Type of document being generated (`prd`, `technical_design`, `architecture`, `roadmap`)
- `credit_cost`: Number of credits required for generation
- `user_credits`: User's current credit balance
- `has_existing_documents`: Whether the idea has existing documents
- `existing_document_types`: Comma-separated list of existing document types
- `timestamp`: ISO timestamp of the event

**Usage:**

```typescript
import { trackDocumentGenerationRequest } from "@/features/document-generator/analytics";

trackDocumentGenerationRequest({
  ideaId: "uuid",
  documentType: "prd",
  creditCost: 5,
  userCredits: 20,
  hasExistingDocuments: true,
  existingDocumentTypes: ["startup_analysis"],
});
```

### 2. Document Generation Success (`document_generation_success`)

Tracks when document generation completes successfully.

**Properties:**

- `idea_id`: Unique identifier of the idea
- `document_id`: Unique identifier of the generated document
- `document_type`: Type of document generated
- `credit_cost`: Credits deducted for generation
- `generation_time_ms`: Time taken to generate in milliseconds
- `version`: Version number of the generated document
- `timestamp`: ISO timestamp of the event

**Usage:**

```typescript
import { trackDocumentGenerationSuccess } from "@/features/document-generator/analytics";

trackDocumentGenerationSuccess({
  ideaId: "uuid",
  documentId: "doc-uuid",
  documentType: "prd",
  creditCost: 5,
  generationTimeMs: 15000,
  version: 1,
});
```

### 3. Document Generation Failure (`document_generation_failure`)

Tracks when document generation fails.

**Properties:**

- `idea_id`: Unique identifier of the idea
- `document_type`: Type of document that failed to generate
- `error_type`: Category of error (`insufficient_credits`, `ai_error`, `network_error`, `unknown`)
- `error_message`: Detailed error message
- `credits_refunded`: Whether credits were refunded
- `timestamp`: ISO timestamp of the event

**Usage:**

```typescript
import { trackDocumentGenerationFailure } from "@/features/document-generator/analytics";

trackDocumentGenerationFailure({
  ideaId: "uuid",
  documentType: "prd",
  errorType: "ai_error",
  errorMessage: "AI service unavailable",
  creditsRefunded: true,
});
```

### 4. Document Edit (`document_edited`)

Tracks document editing events.

**Properties:**

- `document_id`: Unique identifier of the document
- `document_type`: Type of document being edited
- `action`: Type of edit action (`start_edit`, `save`, `cancel`, `auto_save`)
- `previous_version`: Version before the edit
- `new_version`: Version after the edit (optional)
- `content_length_change`: Change in content length (optional)
- `timestamp`: ISO timestamp of the event

**Usage:**

```typescript
import { trackDocumentEdit } from "@/features/document-generator/analytics";

trackDocumentEdit({
  documentId: "doc-uuid",
  documentType: "prd",
  action: "save",
  previousVersion: 1,
  newVersion: 2,
  contentLengthChange: 150,
});
```

### 5. Version History Action (`version_history_action`)

Tracks version history interactions.

**Properties:**

- `document_id`: Unique identifier of the document
- `document_type`: Type of document
- `action`: Type of action (`view`, `select_version`, `restore`)
- `total_versions`: Total number of versions available
- `selected_version`: Version number selected (optional)
- `current_version`: Current version number (optional)
- `timestamp`: ISO timestamp of the event

**Usage:**

```typescript
import { trackVersionHistory } from "@/features/document-generator/analytics";

trackVersionHistory({
  documentId: "doc-uuid",
  documentType: "prd",
  action: "restore",
  totalVersions: 5,
  selectedVersion: 3,
  currentVersion: 5,
});
```

### 6. Document Regeneration (`document_regeneration`)

Tracks document regeneration events.

**Properties:**

- `document_id`: Unique identifier of the document
- `document_type`: Type of document being regenerated
- `action`: Stage of regeneration (`request`, `confirm`, `cancel`, `success`, `failure`)
- `credit_cost`: Credits required for regeneration (optional)
- `previous_version`: Version before regeneration (optional)
- `new_version`: Version after regeneration (optional)
- `error_message`: Error message if failed (optional)
- `timestamp`: ISO timestamp of the event

**Usage:**

```typescript
import { trackDocumentRegeneration } from "@/features/document-generator/analytics";

trackDocumentRegeneration({
  documentId: "doc-uuid",
  documentType: "prd",
  action: "success",
  creditCost: 5,
  previousVersion: 2,
  newVersion: 3,
});
```

### 7. Document Export (`document_exported`)

Tracks document export events.

**Properties:**

- `document_id`: Unique identifier of the document
- `document_type`: Type of document being exported
- `format`: Export format (`markdown`, `pdf`)
- `success`: Whether export was successful
- `error_message`: Error message if failed (optional)
- `file_size_bytes`: Size of exported file in bytes (optional)
- `timestamp`: ISO timestamp of the event

**Usage:**

```typescript
import { trackDocumentExport } from "@/features/document-generator/analytics";

trackDocumentExport({
  documentId: "doc-uuid",
  documentType: "prd",
  format: "pdf",
  success: true,
  fileSizeBytes: 125000,
});
```

### 8. Feature Flag Check (`feature_flag_checked`)

Tracks feature flag status checks.

**Properties:**

- `flag_name`: Name of the feature flag
- `flag_value`: Current value of the flag
- `context`: Where the check occurred (`page_load`, `button_visibility`, `api_request`)
- `timestamp`: ISO timestamp of the event

**Usage:**

```typescript
import { trackFeatureFlag } from "@/features/document-generator/analytics";

trackFeatureFlag({
  flagName: "ENABLE_DOCUMENT_GENERATION",
  flagValue: true,
  context: "page_load",
});
```

### 9. Credit Usage (`document_credit_usage`)

Tracks credit usage for document generation.

**Properties:**

- `document_type`: Type of document
- `action`: Type of credit action (`check`, `deduct`, `refund`)
- `amount`: Number of credits involved
- `balance_before`: Credit balance before action
- `balance_after`: Credit balance after action
- `success`: Whether the action was successful
- `timestamp`: ISO timestamp of the event

**Usage:**

```typescript
import { trackCreditUsage } from "@/features/document-generator/analytics";

trackCreditUsage({
  documentType: "prd",
  action: "deduct",
  amount: 5,
  balanceBefore: 20,
  balanceAfter: 15,
  success: true,
});
```

### 10. Generator Page View (`generator_page_viewed`)

Tracks when a user views a generator page.

**Properties:**

- `idea_id`: Unique identifier of the idea
- `document_type`: Type of document to be generated
- `timestamp`: ISO timestamp of the event

**Usage:**

```typescript
import { trackGeneratorPageView } from "@/features/document-generator/analytics";

trackGeneratorPageView("uuid", "prd");
```

## Implementation Details

### PostHog Integration

All tracking functions use the PostHog client from `posthog-js`. The tracking module:

1. Checks if PostHog is available and loaded before tracking
2. Logs events to console for debugging (can be removed in production)
3. Handles errors gracefully without breaking the user experience
4. Includes timestamps for all events

### Error Handling

The tracking functions are designed to fail silently. If PostHog is not available or an error occurs during tracking, the functions will:

1. Log the error to the console
2. Continue execution without throwing
3. Not impact the user experience

## Analytics Insights

This tracking enables analysis of:

1. **Generation Patterns**: Which document types are most frequently generated
2. **Success/Failure Rates**: Track generation reliability and identify issues
3. **Credit Usage**: Monitor credit consumption per document type
4. **Editing Behavior**: How often users edit generated documents
5. **Version Management**: How users interact with version history
6. **Export Preferences**: Which export formats are most popular
7. **Feature Adoption**: Track feature flag usage and adoption rates
8. **Performance Metrics**: Generation time and success rates

## Requirements Coverage

This implementation satisfies the following requirements from the Document Generation spec:

- Track document generation requests (by type)
- Track document generation success/failure rates
- Track credit usage per document type
- Track document editing events
- Track version history usage
- Track document regeneration events
- Track export functionality usage (by format)
- Track feature flag adoption

All requirements for observability are covered.
