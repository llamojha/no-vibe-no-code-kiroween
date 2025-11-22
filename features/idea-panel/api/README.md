# Idea Panel API Client

Client-side API wrappers for the Idea Panel feature. These functions provide a clean interface for React components to interact with the backend API.

## Available Functions

### `getIdeaWithDocuments(ideaId: string)`

Retrieves a single idea with all its associated documents.

**Parameters:**

- `ideaId` - The UUID of the idea to retrieve

**Returns:**

- `Promise<IdeaWithDocumentsDTO>` - The idea with its documents

**Throws:**

- Error if idea not found (404)
- Error if unauthorized (403)
- Error if authentication required (401)

**Example:**

```typescript
import { getIdeaWithDocuments } from "@/features/idea-panel/api";

const ideaData = await getIdeaWithDocuments("idea-uuid-here");
console.log(ideaData.idea.ideaText);
console.log(ideaData.documents.length);
```

### `getUserIdeas()`

Retrieves all ideas for the current authenticated user. Returns optimized data suitable for dashboard display.

**Returns:**

- `Promise<DashboardIdeaDTO[]>` - Array of user's ideas

**Throws:**

- Error if authentication required (401)
- Error if feature not available (404)

**Example:**

```typescript
import { getUserIdeas } from "@/features/idea-panel/api";

const ideas = await getUserIdeas();
ideas.forEach((idea) => {
  console.log(`${idea.ideaText} - ${idea.documentCount} documents`);
});
```

### `updateStatus(ideaId: string, status: ProjectStatus)`

Updates the project status of an idea.

**Parameters:**

- `ideaId` - The UUID of the idea to update
- `status` - One of: `"idea"`, `"in_progress"`, `"completed"`, `"archived"`

**Returns:**

- `Promise<void>` - Resolves when update is complete

**Throws:**

- Error if idea not found (404)
- Error if unauthorized (403)
- Error if invalid status (400)

**Example:**

```typescript
import { updateStatus } from "@/features/idea-panel/api";

await updateStatus("idea-uuid-here", "in_progress");
```

### `saveMetadata(ideaId: string, options: SaveMetadataOptions)`

Saves notes and/or tags for an idea.

**Parameters:**

- `ideaId` - The UUID of the idea to update
- `options` - Object containing:
  - `notes?: string` - Optional notes text
  - `tags?: string[]` - Optional array of tags

**Returns:**

- `Promise<void>` - Resolves when save is complete

**Throws:**

- Error if neither notes nor tags provided
- Error if idea not found (404)
- Error if unauthorized (403)
- Error if invalid metadata (400)

**Example:**

```typescript
import { saveMetadata } from "@/features/idea-panel/api";

// Save notes only
await saveMetadata("idea-uuid-here", {
  notes: "This is a great idea!",
});

// Save tags only
await saveMetadata("idea-uuid-here", {
  tags: ["mvp", "high-priority"],
});

// Save both
await saveMetadata("idea-uuid-here", {
  notes: "Updated notes",
  tags: ["mvp", "high-priority", "q1-2024"],
});
```

### `getDocumentsByIdea(ideaId: string)`

Retrieves all documents (analyses) for a specific idea.

**Parameters:**

- `ideaId` - The UUID of the idea

**Returns:**

- `Promise<DocumentDTO[]>` - Array of documents

**Throws:**

- Error if idea not found (404)
- Error if unauthorized (403)
- Error if authentication required (401)

**Example:**

```typescript
import { getDocumentsByIdea } from "@/features/idea-panel/api";

const documents = await getDocumentsByIdea("idea-uuid-here");
documents.forEach((doc) => {
  console.log(`${doc.documentType}: ${doc.title}`);
});
```

## Error Handling

All functions throw errors with descriptive messages. It's recommended to wrap calls in try-catch blocks:

```typescript
import { getIdeaWithDocuments } from "@/features/idea-panel/api";

try {
  const ideaData = await getIdeaWithDocuments(ideaId);
  // Handle success
} catch (error) {
  console.error("Failed to load idea:", error.message);
  // Handle error (show toast, etc.)
}
```

## Type Definitions

All type definitions are imported from `@/src/infrastructure/web/dto/IdeaDTO`:

- `IdeaDTO` - Single idea data
- `DocumentDTO` - Single document data
- `IdeaWithDocumentsDTO` - Idea with documents
- `DashboardIdeaDTO` - Optimized idea data for dashboard

## Requirements Coverage

This implementation satisfies the following requirements from the spec:

- **Requirement 1.2**: Navigate to Idea Panel route
- **Requirement 2.1**: Display list of documents
- **Requirement 3.3**: Persist status changes
- **Requirement 4.3**: Persist notes
- **Requirement 5.4**: Persist tags
- **Requirement 9.1**: Display ideas from ideas table
