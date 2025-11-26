# Document Generator Analytics - Quick Start Guide

## Installation

The analytics module is already integrated. No additional setup required.

## Basic Usage

### Import the tracking functions

```typescript
import {
  trackDocumentGenerationRequest,
  trackDocumentGenerationSuccess,
  trackDocumentGenerationFailure,
  trackDocumentEdit,
  trackVersionHistory,
  trackDocumentRegeneration,
  trackDocumentExport,
  trackFeatureFlag,
  trackCreditUsage,
  trackGeneratorPageView,
} from "@/features/document-generator/analytics";
```

### Track document generation

```typescript
// When user clicks generate
trackDocumentGenerationRequest({
  ideaId: "uuid",
  documentType: "prd",
  creditCost: 5,
  userCredits: 20,
  hasExistingDocuments: true,
  existingDocumentTypes: ["startup_analysis"],
});

// On success
trackDocumentGenerationSuccess({
  ideaId: "uuid",
  documentId: "doc-uuid",
  documentType: "prd",
  creditCost: 5,
  generationTimeMs: 15000,
  version: 1,
});

// On failure
trackDocumentGenerationFailure({
  ideaId: "uuid",
  documentType: "prd",
  errorType: "ai_error",
  errorMessage: "AI service unavailable",
  creditsRefunded: true,
});
```

### Track document editing

```typescript
// When user saves
trackDocumentEdit({
  documentId: "doc-uuid",
  documentType: "prd",
  action: "save",
  previousVersion: 1,
  newVersion: 2,
  contentLengthChange: 150,
});

// When auto-save triggers
trackDocumentEdit({
  documentId: "doc-uuid",
  documentType: "prd",
  action: "auto_save",
  previousVersion: 1,
});
```

### Track version history

```typescript
// When modal opens
trackVersionHistory({
  documentId: "doc-uuid",
  documentType: "prd",
  action: "view",
  totalVersions: 5,
  currentVersion: 5,
});

// When user restores a version
trackVersionHistory({
  documentId: "doc-uuid",
  documentType: "prd",
  action: "restore",
  totalVersions: 5,
  selectedVersion: 3,
  currentVersion: 5,
});
```

### Track exports

```typescript
// On successful export
trackDocumentExport({
  documentId: "doc-uuid",
  documentType: "prd",
  format: "pdf",
  success: true,
  fileSizeBytes: 125000,
});

// On failed export
trackDocumentExport({
  documentId: "doc-uuid",
  documentType: "prd",
  format: "markdown",
  success: false,
  errorMessage: "Export failed",
});
```

### Track feature flags

```typescript
trackFeatureFlag({
  flagName: "ENABLE_DOCUMENT_GENERATION",
  flagValue: true,
  context: "page_load",
});
```

### Track credit usage

```typescript
trackCreditUsage({
  documentType: "prd",
  action: "deduct",
  amount: 5,
  balanceBefore: 20,
  balanceAfter: 15,
  success: true,
});
```

## Component Integration

### DocumentGenerator

Already integrated. Tracks:

- Page views
- Generation requests
- Success/failure events

### DocumentEditor

Pass optional props for tracking:

```typescript
<DocumentEditor
  initialContent={content}
  onSave={handleSave}
  documentId={documentId}
  documentType="prd"
  currentVersion={version}
/>
```

### VersionHistoryModal

Pass optional props for tracking:

```typescript
<VersionHistoryModal
  isOpen={isOpen}
  onClose={onClose}
  versions={versions}
  currentVersion={currentVersion}
  onRestore={handleRestore}
  documentId={documentId}
  documentType="prd"
/>
```

### ExportControls

Pass optional props for tracking:

```typescript
<ExportControls
  documentId={documentId}
  documentType="prd"
  onExportComplete={handleComplete}
/>
```

## Best Practices

1. **Always track both success and failure**: This provides complete visibility
2. **Include timing metrics**: Use `Date.now()` to measure generation time
3. **Track error types**: Classify errors for better analysis
4. **Use consistent document types**: Use the `TrackableDocumentType` type
5. **Don't block on tracking**: All tracking is async and fail-silent

## Debugging

All tracking events are logged to console in development:

```
[PostHog] 📄 document_generation_requested { ... }
[PostHog] ✅ document_generation_success { ... }
[PostHog] ❌ document_generation_failure { ... }
```

## Testing

Import mocked tracking functions in tests:

```typescript
import { vi } from "vitest";
import * as analytics from "@/features/document-generator/analytics";

vi.spyOn(analytics, "trackDocumentGenerationRequest");

// Your test code
expect(analytics.trackDocumentGenerationRequest).toHaveBeenCalledWith({
  // expected props
});
```

## Support

For questions or issues:

1. Check the [README](./README.md) for detailed documentation
2. Review the [test file](./__tests__/tracking.test.ts) for examples
3. Check PostHog dashboard for event verification
