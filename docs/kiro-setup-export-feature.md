# Kiro Setup Export Feature

## Overview

This feature enables users to export their generated documents (PRD, Design Document, Tech Architecture, a ready-to-use Kiro workspace setup. This bridges the gap between document generation and project execution by providing users with:

1. **Steering files** - Derived from generated documents to provide context to Kiro
2. **Example spec** - One fully generated spec from the first roadmap item
3. **Spec generation guide** - Manual steering that teaches Kiro how to generate more specs from the roadmap
4. **Setup instructions** - README explaining how to use the exported files with Kiro

## User Value Proposition

After generating project documentation in No Vibe No Code, users can:

- Export a complete Kiro workspace setup with one click
- Drop the files into their project and immediately start working with Kiro
- Have Kiro generate additional specs from their roadmap on-demand
- Maintain context between their generated docs and Kiro's implementation work

## Export Package Structure

```
kiro-setup/
├── steering/
│   ├── product.md              ← Generated from PRD
│   ├── tech.md                 ← Generated from Tech Architecture
│   ├── architecture.md         ← Generated from Design Document
│   └── spec-generation.md      ← Manual steering for generating specs
├── specs/
│   └── example-feature/        ← One fully generated example from first roadmap item
│       ├── requirements.md
│       ├── design.md
│       └── tasks.md
├── docs/
│   └── roadmap.md              ← The generated roadmap (reference for spec generation)
└── README.md                   ← Setup instructions and usage guide
```

## Core Components

### 1. Steering Files (Auto-Generated)

#### product.md

**Source**: PRD
**Content**:

- Product vision and mission
- Target users and personas
- Success metrics and KPIs
- Product constraints and assumptions
- Core value proposition

#### tech.md

**Source**: Tech Architecture
**Content**:

- Technology stack and dependencies
- Framework versions and requirements
- Development environment setup
- Build and deployment configuration
- Technical constraints

#### architecture.md

**Source**: Design Document
**Content**:

- Architectural patterns (e.g., hexagonal architecture)
- Layer responsibilities and boundaries
- Code organization conventions
- Naming conventions
- Import patterns and standards

#### spec-generation.md (Template)

**Purpose**: Manual steering that teaches Kiro how to generate specs from roadmap
**Content**:

```markdown
---
inclusion: manual
---

# Spec Generation from Roadmap

When the user asks to create a spec from a roadmap item, follow this process:

## Input

Reference the roadmap at #[[file:docs/roadmap.md]] and identify the requested feature.

## Output Structure

Create a new spec folder under `.kiro/specs/{feature-name}/` with:

### requirements.md

- Extract user story from roadmap item description
- Define acceptance criteria based on the feature goals
- Reference relevant sections from #[[file:docs/PRD.md]]
- Keep scope focused on the single roadmap item

### design.md

- Propose technical approach aligned with #[[file:docs/tech-architecture.md]]
- Identify key components and interfaces
- Note dependencies on other roadmap items if any

### tasks.md

- Break down into implementable tasks
- Order by dependency
- Each task should be completable in one session

## Example

See `.kiro/specs/example-feature/` for reference structure.
```

### 2. Example Spec (Auto-Generated)

Generate one complete spec from the first roadmap item to serve as a reference.

**requirements.md**:

- User story extracted from roadmap item
- Acceptance criteria derived from roadmap goals
- References to PRD sections using `#[[file:docs/PRD.md]]`

**design.md**:

- Technical approach aligned with Tech Architecture
- Component breakdown
- Dependencies on other features

**tasks.md**:

- Implementable task breakdown
- Ordered by dependency
- Each task scoped to one session

### 3. README.md (Template)

**Content**:

- What's included in the export
- How to use the files with Kiro
- How to generate additional specs using `#spec-generation`
- Example workflow: "Create a spec for [feature name] from the roadmap"
- Tips for iterating on specs with Kiro

### 4. Roadmap Reference

Copy the generated roadmap to `docs/roadmap.md` so Kiro can reference it when generating specs.

## User Workflow

1. User generates PRD, Design Doc, Tech Architecture, and Roadmap in No Vibe No Code
2. User clicks "Export to Kiro" button
3. System generates the export package (ZIP or downloadable folder)
4. User downloads and extracts into their project's `.kiro/` folder
5. User opens Kiro and types: `#spec-generation Create a spec for "User Authentication" from the roadmap`
6. Kiro generates the spec using the steering + roadmap context
7. User iterates on the spec with Kiro
8. User says "implement this spec" → Kiro executes

## Technical Implementation Notes

### Template Engine

- Use string interpolation to populate templates from document data
- Extract relevant sections from PRD, Design Doc, Tech Architecture
- Parse roadmap structure to identify first item for example spec

### Export Format

- Generate as ZIP file for download
- Alternative: Copy-to-clipboard for individual files
- Consider GitHub repo creation in future version (out of scope for MVP)

### Data Extraction

- PRD → product.md: Extract vision, users, metrics, constraints
- Tech Architecture → tech.md: Extract stack, dependencies, setup
- Design Document → architecture.md: Extract patterns, conventions, standards
- Roadmap → First item → example spec: Extract description, goals, acceptance criteria

### Spec Generation Logic

- Parse roadmap item structure (title, description, goals, acceptance criteria)
- Generate requirements.md with user story and acceptance criteria
- Generate design.md with technical approach placeholder
- Generate tasks.md with basic task breakdown

## MVP Scope

### In Scope

✅ Export button on completed analysis/idea panel
✅ Generate 3 steering files (product.md, tech.md, architecture.md)
✅ Generate spec-generation.md manual steering
✅ Generate 1 example spec from first roadmap item
✅ Generate README.md with setup instructions
✅ Copy roadmap.md to docs folder
✅ ZIP generation for download

### Out of Scope (Future Versions)

❌ Interactive roadmap item picker (just export first item for MVP)
❌ GitHub repo creation
❌ Hooks generation
❌ Custom steering configuration UI
❌ Multiple export format options (just ZIP for MVP)

## Success Metrics

- Number of exports generated
- User adoption of Kiro after export
- Number of specs generated using `#spec-generation` steering
- User feedback on export quality and usefulness

## Future Enhancements

- **v2**: Interactive roadmap item selection (checkboxes for which items to generate specs)
- **v3**: GitHub repo creation with exported files
- **v4**: Suggested Kiro hooks based on tech stack
- **v5**: Custom steering configuration UI
- **v6**: Export format options (ZIP, GitHub, copy-paste)

## Integration Points

### Idea Panel Integration

- Add "Export to Kiro" button in Idea Panel when documents are generated
- Show export modal with preview of what will be generated
- Track export events in analytics

### Document Generation Integration

- Hook into existing document generation pipeline
- Reuse document data structures for template population
- Ensure all required documents are generated before allowing export

### Analytics Tracking

- Track export button clicks
- Track successful exports
- Track which documents are included in exports
- Track user engagement with exported files (future: via Kiro telemetry)

## Open Questions

1. Should we validate that all required documents exist before allowing export?
2. Should we allow partial exports (e.g., just steering files without specs)?
3. Should we version the export format for future compatibility?
4. Should we include the original generated documents (PRD, Design, etc.) in the export?
5. How do we handle updates to documents after export? Re-export? Merge strategy?

## Dependencies

- Existing document generation system (PRD, Design, Tech Architecture, Roadmap)
- ZIP generation library (e.g., JSZip)
- Template engine or string interpolation utilities
- File download mechanism in browser

## Estimated Complexity

**Overall**: Medium (achievable in single spec)

**Breakdown**:

- Steering templates: Small (3 files, mostly text transformation)
- Spec template: Small (1 example spec, text transformation)
- README template: Small (static content with minor interpolation)
- ZIP generation: Small-Medium (use existing library)
- Export button + UI: Small (button + basic modal)
- Wire up to document data: Medium (extract and transform data)

**Total Estimated Tasks**: 8-12 tasks

---

_Document created for spec generation planning_
_Last updated: November 26, 2025_
