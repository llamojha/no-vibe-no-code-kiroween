# Document Generation Feature Guide

## Overview

The Document Generation feature transforms analyzed startup ideas into professional, AI-generated project documentation. Users can generate four types of documents with AI assistance, then edit and export them for execution.

**Key Benefits**:

- Transform ideas into actionable documentation in minutes
- AI-generated content based on your idea and analysis
- Version control for all edits and regenerations
- Export to Markdown or PDF for sharing with your team
- Contextual generation that references previous documents

## Feature Status

**Current Status**: ✅ Fully Implemented

**Feature Flag**: `ENABLE_DOCUMENT_GENERATION` (default: true)

**Availability**: All authenticated users with sufficient credits

## Document Types

### 1. Product Requirements Document (PRD)

**Credit Cost**: 50 credits

**Purpose**: Defines what to build and why

**Sections**:

- Problem Statement
- Target Users & Personas
- User Stories
- Features & Requirements
- Success Metrics
- Out of Scope
- Assumptions & Dependencies

**Best Used**: First document after analysis to define product scope

### 2. Technical Design Document

**Credit Cost**: 75 credits

**Purpose**: Defines how to build the product

**Sections**:

- Architecture Overview
- Technology Stack Recommendations
- Data Models & Database Schema
- API Specifications
- Security Considerations
- Scalability & Performance
- Deployment Strategy
- Third-party Integrations

**Best Used**: After PRD to plan technical implementation

**Context**: References PRD content if available

### 3. Architecture Document

**Credit Cost**: 75 credits

**Purpose**: Defines system architecture and infrastructure

**Sections**:

- System Architecture Diagram
- Component Breakdown
- Data Flow
- Integration Points
- Infrastructure Requirements
- Scalability Considerations
- Disaster Recovery & Backup
- Monitoring & Observability

**Best Used**: After Technical Design for detailed architecture planning

**Context**: References Technical Design content if available

### 4. Project Roadmap

**Credit Cost**: 50 credits

**Purpose**: Defines project milestones and priorities (without specific timeframes)

**Sections**:

- Milestones (logical ordering, no dates)
- Feature Prioritization (MoSCoW method)
- Dependencies & Blockers
- Resource Considerations
- Risk Mitigation Strategies
- Success Criteria per Milestone
- Go-to-Market Strategy

**Best Used**: After PRD and Technical Design to plan execution

**Context**: References PRD and Technical Design if available

**Note**: The roadmap focuses on logical ordering and priorities, not specific dates. Users determine their own timeline based on team velocity and resources.

## Recommended Workflow

While you can generate any document at any time, we recommend this workflow for best results:

```
1. Analysis → 2. PRD → 3. Technical Design → 4. Architecture → 5. Roadmap
```

**Why This Order?**

1. **Analysis First**: Validates your idea and provides scores/feedback
2. **PRD Second**: Uses analysis insights to define product requirements
3. **Technical Design Third**: Uses PRD to plan technical implementation
4. **Architecture Fourth**: Uses Technical Design for detailed system architecture
5. **Roadmap Last**: Uses PRD and Technical Design to plan execution

**Important**: This is a recommendation, not a requirement. You can generate documents in any order based on your needs.

## User Guide

### Accessing Document Generation

1. **From Dashboard**: Click "Manage" on any idea card
2. **From Idea Panel**: View document generation buttons at the top
3. **Direct Navigation**: Use `/generate/[type]/[ideaId]` routes

### Generating a Document

1. **Navigate to Generator Page**:

   - Click the appropriate "Generate [Type]" button in the Idea Panel
   - Or navigate directly to `/generate/prd/[ideaId]` (or other document type)

2. **Review Context**:

   - The generator page displays your idea text
   - Shows analysis summary if available
   - Shows existing related documents (e.g., PRD when generating Technical Design)

3. **Check Credit Cost**:

   - Credit cost is displayed on the generate button
   - Ensure you have sufficient credits before generating

4. **Generate**:

   - Click "Generate" button
   - AI generation takes 30-60 seconds
   - Progress indicator shows generation status
   - You'll be redirected to Idea Panel when complete

5. **Review Generated Document**:
   - Document appears in the Idea Panel
   - Expand to view full content
   - Check quality and completeness

### Editing Documents

1. **Open Editor**:

   - Click "Edit" button on any generated document
   - Markdown editor opens with syntax highlighting

2. **Make Changes**:

   - Edit content using Markdown syntax
   - Preview mode available for reviewing changes
   - Auto-save (debounced) prevents data loss
   - Character count and save status displayed

3. **Save Changes**:

   - Click "Save" button
   - Creates new version (v2, v3, etc.)
   - Previous version preserved in version history
   - Updated timestamp reflects latest changes

4. **Editor Features**:
   - Syntax highlighting for Markdown
   - Preview mode for formatted view
   - Undo/redo functionality
   - Keyboard shortcuts (Ctrl+S to save)
   - Accessibility support (keyboard navigation, ARIA labels)

### Version Management

1. **View Version History**:

   - Click "Version History" button on any document
   - Modal displays all versions in descending order (newest first)
   - Each version shows timestamp and version number

2. **Compare Versions**:

   - Select any version to view its content
   - Compare with current version
   - Identify changes between versions

3. **Restore Previous Version**:
   - Click "Restore" on any previous version
   - Creates new version with that content
   - Does not delete any versions (immutable history)
   - New version number assigned (e.g., v4 from restored v1)

### Regenerating Documents

1. **When to Regenerate**:

   - Want fresh AI perspective
   - Updated your idea or analysis
   - Need different approach or focus

2. **Regeneration Process**:

   - Click "Regenerate" button on document
   - Confirmation dialog shows credit cost warning
   - Confirm to proceed
   - AI generates new content (30-60 seconds)
   - Creates new version preserving previous version

3. **Credit Behavior**:
   - Credits deducted before generation
   - Automatic refund if generation fails
   - Same cost as initial generation

### Exporting Documents

1. **Export Options**:

   - Click "Export" button on any document
   - Choose format: Markdown (.md) or PDF

2. **Markdown Export**:

   - Plain text format with Markdown syntax
   - Easy to edit in any text editor
   - Version control friendly (Git)
   - Includes metadata header

3. **PDF Export**:

   - Formatted, professional appearance
   - Ready for sharing with stakeholders
   - Includes metadata (title, version, date)
   - Non-editable format

4. **Export Metadata**:
   - Document title
   - Version number
   - Creation date
   - Last updated date

### Progress Tracking

The **Document Progress Indicator** shows your documentation workflow status:

- **Completed**: Green checkmark, document generated
- **Pending**: Gray, document not yet generated
- **Next Recommended**: Highlighted suggestion (not required)

**Progress Percentage**: Calculated based on completed documents (0-100%)

## Error Handling

### Insufficient Credits

**Error**: "Insufficient credits to generate document"

**Solution**:

- Check your credit balance in the dashboard
- Purchase more credits or upgrade your plan
- No credits deducted when balance is insufficient

### AI Service Error

**Error**: "Failed to generate document"

**Behavior**:

- Credits automatically refunded
- Error message displayed with retry option
- Can retry generation immediately

**Common Causes**:

- Temporary AI service outage
- Network connectivity issues
- Invalid idea content (too short/long)

### Feature Flag Disabled

**Error**: "Document generation is currently disabled"

**Cause**: `ENABLE_DOCUMENT_GENERATION` feature flag is false

**Solution**: Contact administrator to enable feature

### Document Not Found

**Error**: "Document not found"

**Causes**:

- Document ID is invalid
- Document belongs to another user
- Document was deleted

### Version Not Found

**Error**: "Version not found"

**Causes**:

- Version number doesn't exist
- Document has fewer versions than requested

## Best Practices

### Content Quality

1. **Start with Good Analysis**: Better analysis = better generated documents
2. **Review and Edit**: AI-generated content is a starting point, not final output
3. **Iterate**: Use regeneration to explore different approaches
4. **Version Control**: Save frequently to preserve your work

### Workflow Optimization

1. **Follow Recommended Order**: Analysis → PRD → Technical Design → Architecture → Roadmap
2. **Generate Contextually**: Later documents benefit from earlier ones
3. **Edit Before Moving On**: Refine each document before generating the next
4. **Export Regularly**: Keep backups of important versions

### Credit Management

1. **Check Balance First**: Ensure sufficient credits before generating
2. **Edit vs Regenerate**: Editing is free, regeneration costs credits
3. **Use Version History**: Restore previous versions instead of regenerating

### Collaboration

1. **Export for Sharing**: Use PDF for stakeholders, Markdown for developers
2. **Version Control**: Track changes through version history
3. **Document Progress**: Use progress indicator to communicate status

## Technical Details

### AI Generation

**Model**: Google Gemini AI

**Context Included**:

- Original idea text
- Analysis scores and feedback (for PRD)
- Existing PRD content (for Technical Design and Roadmap)
- Existing Technical Design content (for Architecture)

**Generation Time**: 30-60 seconds average

**Quality**: Professional-grade documentation with structured sections

### Version Management

**Storage**: Each version is a separate database row with unique UUID

**Identification**: Versions identified by (idea_id, document_type, version) tuple

**Immutability**: All versions preserved, no deletions

**Ordering**: Latest version determined by highest version number

### Credit System Integration

**Deduction**: Credits deducted before AI generation starts

**Refund**: Automatic refund if generation fails

**Balance Check**: Validates sufficient credits before deduction

**No Charge**: Editing and version management are free

### Feature Flag Control

**Flag**: `ENABLE_DOCUMENT_GENERATION`

**Default**: true

**Scope**: Controls all document generation functionality

**Behavior When Disabled**:

- Generation buttons hidden in UI
- API endpoints return 403 Forbidden
- Existing documents remain accessible

## Troubleshooting

### Generation Takes Too Long

**Expected Time**: 30-60 seconds

**If Longer**:

- Check network connectivity
- Wait for "still working" message (appears after 30s)
- If exceeds 2 minutes, refresh and retry

### Document Content Issues

**Problem**: Generated content doesn't match expectations

**Solutions**:

- Regenerate for different perspective
- Edit content manually
- Improve idea description and analysis first
- Check that context documents (PRD, Technical Design) are complete

### Version History Not Showing

**Problem**: Version history appears empty

**Cause**: Document has only one version

**Solution**: Edit and save to create additional versions

### Export Fails

**Problem**: Export download doesn't start

**Solutions**:

- Check browser popup blocker settings
- Try different export format
- Ensure document content is valid
- Check browser console for errors

## Keyboard Shortcuts

### Document Editor

- `Ctrl+S` / `Cmd+S`: Save changes
- `Ctrl+Z` / `Cmd+Z`: Undo
- `Ctrl+Shift+Z` / `Cmd+Shift+Z`: Redo
- `Tab`: Indent
- `Shift+Tab`: Outdent

### Navigation

- `Esc`: Close modal/editor
- `Enter`: Confirm action in dialogs

## Accessibility

### Keyboard Navigation

- All buttons and controls accessible via keyboard
- Tab order follows logical flow
- Focus indicators visible

### Screen Reader Support

- ARIA labels on all interactive elements
- Semantic HTML structure
- Status announcements for async operations

### Mobile Support

- Responsive design for all screen sizes
- Touch-friendly controls
- Optimized editor for mobile devices

## FAQ

### Can I generate documents in any order?

Yes! While we recommend Analysis → PRD → Technical Design → Architecture → Roadmap, you can generate any document at any time. Later documents benefit from earlier ones through contextual generation.

### Do I need to generate all document types?

No. Generate only the documents you need for your project. Some teams may only need a PRD, while others want the full suite.

### Can I edit AI-generated content?

Absolutely! AI-generated content is a starting point. We encourage you to review, edit, and refine all documents to match your specific needs.

### What happens to old versions when I edit?

All versions are preserved. When you save edits, a new version is created with a new UUID and incremented version number. Previous versions remain accessible through version history.

### Can I delete a document?

Currently, documents cannot be deleted individually. You can delete the entire idea (which deletes all associated documents) from the Idea Panel.

### How do I share documents with my team?

Export documents as PDF (for stakeholders) or Markdown (for developers). You can also copy content directly from the editor.

### What if I run out of credits during generation?

Credits are checked before generation starts. If you have insufficient credits, generation won't start and no credits are deducted. If generation fails after starting, credits are automatically refunded.

### Can I use documents offline?

Export documents as Markdown or PDF for offline access. The web application requires internet connectivity.

### How long are documents stored?

Documents are stored indefinitely as long as your account is active. We recommend regular exports for backup.

### Can I import existing documents?

Currently, document import is not supported. You can copy/paste content into the editor after generating a document.

## Support

For questions or issues with document generation:

- Check this guide first
- Review [API Documentation](./API.md) for technical details
- Review [Developer Guide](./DEVELOPER_GUIDE.md) for implementation details
- Contact support: support@novibecode.com

## Changelog

### v1.0.0 (2024-01-15)

- Initial release of document generation feature
- Support for 4 document types (PRD, Technical Design, Architecture, Roadmap)
- Version management with full history
- Export to Markdown and PDF
- Credit system integration
- Feature flag control

---

_Last updated: January 15, 2024_
