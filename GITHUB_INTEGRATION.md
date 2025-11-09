# GitHub Integration Hooks

Automated workflows for bidirectional synchronization between GitHub issues and Kiro specs.

### 📋 Issue → Spec

**File:** `github-issue-to-spec.kiro.hook`

Converts a GitHub issue into a complete Kiro spec with requirements, design, and tasks.

**Usage:**

1. Click "📋 Issue → Spec" button in Agent Hooks panel
2. Provide the GitHub issue number
3. Answer clarifying questions about scope and requirements
4. Spec files are created in `.kiro/specs/[issue-name]/`

**Output:**

- `requirements.md` - User stories and acceptance criteria
- `design.md` - Architecture and implementation approach
- `tasks.md` - Ordered implementation tasks with checkboxes

---

### 📤 Spec → Issues

**File:** `spec-to-github-issues.kiro.hook`

Creates GitHub issues from specs, roadmaps, or task lists.

**Usage:**

1. Click "📤 Spec → Issues" button in Agent Hooks panel
2. Choose source:
   - `TODO.md` - Backlog items
   - `ROADMAP.md` - Project roadmap
   - Spec `tasks.md` file
   - Custom document
3. Configure preferences (labels, assignments, structure)
4. Review preview and confirm
5. Issues are created in GitHub

**Features:**

- Parent/sub-issue relationships
- Custom labels and assignments
- Links to spec documentation
- Batch creation with preview

---

### 🔄 Sync Issues

**File:** `sync-github-issues.kiro.hook`

Synchronizes GitHub issue status with local spec task checkboxes.

**Usage:**

1. Click "🔄 Sync Issues" button in Agent Hooks panel
2. Review proposed changes
3. Confirm to update local files

**What it does:**

- Marks tasks as `[x]` when GitHub issue is closed
- Marks tasks as `[ ]` when GitHub issue is reopened
- Shows summary of all changes

---

## Other Hooks

### 📊 Update Structure Index

**File:** `update-structure-index.json`

Updates `.kiro/steering/structure.md` with current project file structure.

**Usage:**

- Click "Update Structure Index" button
- Automatically scans `src/`, `features/`, `lib/`, `app/` directories
- Updates file index while preserving documentation

---

## How to Use Hooks

### Via Agent Hooks Panel

1. Open Explorer view in Kiro
2. Find "Agent Hooks" section
3. Click the button for the hook you want to run

### Via Command Palette

1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Search for "Open Kiro Hook UI"
3. Select the hook to run

---

## Configuration

### GitHub Authentication

Hooks require GitHub MCP server with authentication. Configure in `~/.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "GITHUB_PERSONAL_ACCESS_TOKEN",
        "ghcr.io/github/github-mcp-server"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_token_here"
      },
      "disabled": false
    }
  }
}
```

**Get a token:** https://github.com/settings/tokens

**Required scopes:**

- `repo` - Full control of repositories
- `read:org` - Read org and team membership
- `read:user` - Read user profile data

---

## Workflow Examples

### Example 1: Issue to Implementation

1. Create GitHub issue with feature request
2. Run "📋 Issue → Spec" to generate spec
3. Review and refine spec files
4. Implement tasks from `tasks.md`
5. Run "🔄 Sync Issues" to mark completed

### Example 2: Roadmap to Backlog

1. Create `ROADMAP.md` with milestones and tasks
2. Run "📤 Spec → Issues" and select ROADMAP.md
3. Configure as parent/sub-issue structure
4. Issues created in GitHub for team tracking

### Example 3: Spec to GitHub Project

1. Complete spec in `.kiro/specs/feature-name/`
2. Run "📤 Spec → Issues" and select spec's `tasks.md`
3. Issues created with links back to spec
4. Track progress in GitHub Projects

---

## Best Practices

- **Single Focus:** Each spec should address one core feature
- **Clear Scope:** Define what's IN and OUT of scope explicitly
- **Minimal Tasks:** Break work into small, focused tasks
- **Regular Sync:** Run sync hook after closing GitHub issues
- **Documentation:** Keep specs updated as implementation evolves

---

## Repository

**Project:** llamojha/no-vibe-no-code-kiroween
**Hooks Location:** `.kiro/hooks/github-*.kiro.hook` and `.kiro/hooks/sync-github-*.kiro.hook`
**Specs Directory:** `.kiro/specs/`

## Hook Files

The following hooks are located in `.kiro/hooks/`:

- `github-issue-to-spec.kiro.hook` - 📋 Issue → Spec
- `spec-to-github-issues.kiro.hook` - 📤 Spec → Issues
- `sync-github-issues.kiro.hook` - 🔄 Sync Issues
