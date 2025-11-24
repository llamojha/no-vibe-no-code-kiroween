# Document Utilities

This directory contains utility functions for working with document types in the Idea Panel Document Generation feature.

## Overview

The document utilities provide a clean, centralized API for:

- Getting document metadata (display names, icons, colors, credit costs)
- Calculating document generation progress
- Determining recommended next documents in the workflow
- Generating routes for document generator pages

## Architecture

All utility functions follow the **delegation pattern** - they delegate to either:

1. `DocumentType` value object methods (which in turn delegate to `DOCUMENT_TYPE_CONFIGS`)
2. `DOCUMENT_TYPE_CONFIGS` directly

This ensures a **single source of truth** with no duplication.

## Files

### `utils.ts`

Core utility functions for document metadata and routing:

- `getDocumentDisplayName(type)` - Get human-readable name
- `getDocumentCreditCost(type)` - Get credit cost for generation
- `getDocumentIcon(type)` - Get icon identifier
- `getDocumentColor(type)` - Get color class
- `getGeneratorRoute(type, ideaId)` - Get generator page route

### `progress.ts`

Functions for tracking and calculating document generation progress:

- `getRecommendedNextDocument(documents)` - Get next recommended document
- `calculateProgress(documents)` - Calculate completion percentage (0-100)
- `hasDocumentType(documents, type)` - Check if document type exists
- `getDocumentOrder(type)` - Get workflow order number
- `getDocumentTypesInOrder()` - Get all types sorted by workflow order

### `index.ts`

Centralized exports for all document utilities.

## Usage Examples

### Getting Document Metadata

```typescript
import { DocumentType } from "@/src/domain/value-objects/DocumentType";
import {
  getDocumentDisplayName,
  getDocumentCreditCost,
  getDocumentIcon,
  getDocumentColor,
} from "@/lib/documents";

const type = DocumentType.PRD;

console.log(getDocumentDisplayName(type)); // "Product Requirements Document"
console.log(getDocumentCreditCost(type)); // 50
console.log(getDocumentIcon(type)); // "file-text"
console.log(getDocumentColor(type)); // "blue"
```

### Generating Routes

```typescript
import { DocumentType } from "@/src/domain/value-objects/DocumentType";
import { getGeneratorRoute } from "@/lib/documents";

const ideaId = "abc-123";
const route = getGeneratorRoute(DocumentType.PRD, ideaId);
console.log(route); // "/generate/prd/abc-123"
```

### Calculating Progress

```typescript
import { calculateProgress, getRecommendedNextDocument } from "@/lib/documents";

const documents = [
  { documentType: "startup_analysis" },
  { documentType: "prd" },
];

const progress = calculateProgress(documents);
console.log(progress); // 40 (2 out of 5 documents)

const nextDoc = getRecommendedNextDocument(documents);
console.log(nextDoc?.value); // "technical_design"
```

### Checking Document Existence

```typescript
import { DocumentType } from "@/src/domain/value-objects/DocumentType";
import { hasDocumentType } from "@/lib/documents";

const documents = [
  { documentType: "startup_analysis" },
  { documentType: "prd" },
];

const hasPRD = hasDocumentType(documents, DocumentType.PRD);
console.log(hasPRD); // true

const hasRoadmap = hasDocumentType(documents, DocumentType.ROADMAP);
console.log(hasRoadmap); // false
```

## Workflow Order

The recommended workflow order is:

1. Analysis (order: 0) - Startup or Hackathon Analysis
2. PRD (order: 1) - Product Requirements Document
3. Technical Design (order: 2) - Technical Design Document
4. Architecture (order: 3) - Architecture Document
5. Roadmap (order: 4) - Project Roadmap

**Note:** This is a recommendation, not a requirement. Users can generate any document at any time.

## Configuration

All document type metadata is configured in `src/domain/config/documentTypeConfig.ts`:

```typescript
export const DOCUMENT_TYPE_CONFIGS: Record<string, DocumentTypeConfig> = {
  prd: {
    displayName: "Product Requirements Document",
    creditCost: 50,
    icon: "file-text",
    color: "blue",
    order: 1,
  },
  // ... other document types
};
```

## Testing

Unit tests are located in `__tests__/`:

- `utils.test.ts` - Tests for core utility functions
- `progress.test.ts` - Tests for progress calculation functions

Run tests with:

```bash
npm test -- lib/documents/__tests__
```

## Design Principles

1. **Single Source of Truth**: All metadata comes from `DOCUMENT_TYPE_CONFIGS`
2. **Delegation**: Utility functions delegate to `DocumentType` methods or config
3. **No Duplication**: Never hardcode document metadata in multiple places
4. **Type Safety**: Use `DocumentType` value objects, not raw strings
5. **Testability**: All functions are pure and easily testable

## Adding New Document Types

To add a new document type:

1. Add to `DocumentType` value object in `src/domain/value-objects/DocumentType.ts`
2. Add configuration to `DOCUMENT_TYPE_CONFIGS` in `src/domain/config/documentTypeConfig.ts`
3. Add route mapping in `getGeneratorRoute()` in `utils.ts`
4. Update workflow order in `getRecommendedNextDocument()` in `progress.ts` (if needed)

That's it! All utility functions will automatically work with the new type.

## Related Files

- `src/domain/value-objects/DocumentType.ts` - DocumentType value object
- `src/domain/config/documentTypeConfig.ts` - Document type configuration
- `src/domain/entities/Document.ts` - Document entity
- `features/idea-panel/components/` - UI components using these utilities
