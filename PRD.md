Product Name: No Vibe – No Code
Version: MVP → Pre-Alpha → Alpha
Owner: [You]
Last Updated: 2025-11-05

1. 🧩 Overview
1.1 Product Summary

No Vibe – No Code turns a product idea into an execution-ready backlog with AI-assisted documentation today, and layers in governed automation once Codex returns.

Current focus:
- **AI PM Agents** craft Idea Reviews, PRDs, and roadmaps under human supervision.
- **GitHub ticket export** publishes work into issues/projects for manual execution.

Upcoming focus:
- **Local VibeRunner automation** is ported after the MVP, keeping execution on the user’s machine and invoking Codex from the browser.
- Hosted or API-driven automation is deferred until Codex (or alternative LLM APIs) are production-ready.

Mission:
Help users go from “I have an idea” to “I have a governed plan with tickets” — and prepare the path to safe automation.

2. 🎯 Goals & Success Metrics

| Goal | Metric | Target |
| --- | --- | --- |
| Deliver actionable documentation | Time from idea → PRD + tickets | ≤ 24h with human approvals |
| Maintain artifact quality | Human acceptance of AI drafts | ≥ 90% of MVP outputs after edits |
| Prepare safe automation | Smoke tests on ported VibeRunner | 100% tasks require human checkpoint sign-off |
| Enable monetization runway | Waitlist sign-ups post-automation preview | 200 qualified leads before hosted launch |

3. 🧱 Scope

**In Scope (MVP → Alpha)**
- Idea ingestion and evaluation (Idea Reviewer prompts, manual overrides).
- PRD generation with templated structure and reviewer checklist.
- Roadmap and mind-map synthesis with artifact storage in `/vibeboard/`.
- GitHub issue and project board publishing based on approved roadmap.
- Manual execution tracking with human checkpoints between each AI output.
- Porting the existing local VibeRunner for optional automation once Codex returns.
- Lightweight marketing/showcase materials post-automation preview.

**Out of Scope (until Post-Alpha)**
- Hosted automation or remote execution.
- Non-GitHub integrations (Jira, Notion) beyond discovery.
- Paid tiers, billing systems, or enterprise compliance tooling.
- Direct AI API automation (Claude/GPT) during MVP.

4. 👥 Target Users

| Persona | Needs | Value |
| --- | --- | --- |
| 🧑‍💻 Indie Builders | Fast MVP validation | Idea → PRD → backlog in a day |
| 🧑‍💼 Product Managers | Convert specs into actionable tickets | Reduce coordination overhead |
| 🧠 AI Studios / Agencies | Parallel project pipelines | Scale idea throughput with human stops |
| 🏢 Enterprise R&D | Internal innovation acceleration | Controlled sandbox for AI documentation |

5. 🚀 User Flow (Macro)

1️⃣  User captures an idea in the repo template or CLI prompt  
      ↓  
2️⃣  Idea Reviewer (via Codex-in-browser workflow) drafts an Idea Review for human edits  
      ↓  
3️⃣  Approved Idea Review seeds the PRD generator; reviewers confirm acceptance criteria  
      ↓  
4️⃣  Roadmap builder produces mind-map + milestone plan; humans reorder and tag checkpoints  
      ↓  
5️⃣  Ticket publisher creates GitHub issues/projects with “AI generated – pending review” labels  
      ↓  
6️⃣  (MVP) Humans run tickets manually, logging outcomes  
      ↓  
7️⃣  (Pre-Alpha) Ported VibeRunner can be triggered locally; every run stops for human QA and testing

6. 🧠 Functional Requirements

**6.1 Idea → PRD Module**
- Input: user prompt describing idea (README instructions or CLI script).
- Output: Idea Review + PRD `.md` files adhering to template fields.
- Execution: Operator triggers Codex-in-browser workflow; artifacts are committed with reviewer comments.
- Storage: `/vibeboard/docs/<slug>/` (idea.json, idea-review.md, prd.md) with version history.

**6.2 PRD → Mind-map → Roadmap Module**
- Transform PRD into mind-map JSON and milestone timeline.
- Embed human checkpoints (“Review with stakeholder”, “Manual feasibility check”) per milestone.
- Store outputs in `/vibeboard/docs/<slug>/roadmap.json` and `/vibeboard/docs/<slug>/mindmap.json`.

**6.3 Roadmap → Tickets Module**
- Each milestone generates a GitHub project item.
- Each deliverable yields an issue with acceptance criteria, dependencies, and explicit human test instructions.
- Tickets tagged `status/pending-review` until human marks ready.

**6.4 Execution Support (MVP)**
- Provide manual runbook steps within each ticket.
- Track completion state in `/vibeboard/issues/` JSON mirror.
- Surface a checklist for humans to confirm outcomes.

**6.5 Local Automation (Pre-Alpha)**
- Port prior VibeRunner CLI with isolation per repo.
- Allow manual selection of tickets; runner stops after code generation for human testing before pushing.
- Require explicit confirmation before git operations (commit, PR creation).

**6.6 Notifications & Logs**
- Record every AI generation and human approval in `/vibeboard/logs/`.
- Optional CLI notifications; Slack integration postponed until Alpha.

7. 🧰 Non-Functional Requirements

| Category | Requirement |
| --- | --- |
| Performance | Generate Idea Review + PRD + roadmap in ≤ 15 min of operator time |
| Reliability | Regenerate artifacts deterministically given same prompts and guardrails |
| Security | All API keys remain on the user’s machine; no remote storage |
| Scalability | Support repositories with up to 200 tickets without automation |
| Transparency | Logs clearly show which steps were AI-generated vs. human-authored |

8. 🧮 Tech Stack

| Component | Stack |
| --- | --- |
| Backend / CLI | Node.js (TypeScript), lightweight scripts, optional CLI wrapper |
| LLM Agents | OpenAI Codex via browser workflow (no direct API calls yet) |
| Storage | Git + Markdown/JSON artifacts in repo |
| Integrations | GitHub REST / GraphQL (issues, projects) |
| Auth | GitHub personal access tokens; AI keys injected locally when Codex returns |
| Hosting | Local repository template; hosted runner evaluated post-alpha |
| CI | User-configured (GitHub Actions recommended for manual runs) |

9. 🧩 Phased Roadmap

| Phase | Milestone | Deliverables | Timing |
| --- | --- | --- | --- |
| 0 | Foundations (✅) | Updated AGENTS.md, manual idea review workflow, template repo instructions | Complete |
| 1 | MVP | Idea Review, PRD, roadmap, GitHub issues/projects with human checkpoints and documentation | Month 1 |
| 2 | Pre-Alpha | Port local VibeRunner, integrate Codex-in-browser automation triggers, add human QA gates | Month 2 |
| 3 | Alpha Preview | Automation showcase recordings, quick marketing site, case studies, community feedback loop | Month 3 |
| 4 | Post-Alpha Discovery | Research Jira/Notion sync, CLI with API adapters, hosted runner feasibility | Month 4+ |

10. 💰 Monetization Model (Aspirational)

| Plan | Features | Price |
| --- | --- | --- |
| Free | Idea Review, PRD, roadmap, GitHub ticket export | €0 |
| Pro | Local automation runner, workflow templates, community office hours | €25 / month (post-automation) |
| Team | Multi-repo coordination, analytics, showcase enablement | €99 / month |
| Enterprise | Compliance-ready automation, hosted runner, support SLAs | Custom |

11. ⚠️ Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Codex availability delays | Keep automation optional until Codex returns; document manual runbooks |
| Artifact quality gaps | Institute reviewer checklist and enforce human edits before publishing |
| Scope creep toward hosted product | Gate integrations/hosting work until after Alpha review |
| User confusion on automation status | Surface “Manual run required” labels and roadmap transparency |
| Security of user tokens | Provide guidance for local environment variables; avoid storing keys in repo |

12. ✅ Acceptance Criteria

**MVP**
- User supplies an idea → receives Idea Review + PRD drafts within 24h.
- Roadmap and mind-map created with at least three milestones and human checkpoints.
- GitHub issues/projects generated with manual testing steps and status labels.
- Logs capture every AI generation with reviewer attribution.

**Pre-Alpha**
- Local VibeRunner port executes a single ticket using Codex-in-browser prompts.
- Runner requires human approval before writing commits or opening PRs.
- Manual QA checklist completed after each run.
- Documented rollback path for reverting automation output.

13. 📈 Future Vision

- Multi-model support (Claude, Gemini) once API automation is viable.
- CLI with API adapters to offload Codex-in-browser workflow.
- Hosted site where users link a repo and progress through human-in-the-loop automation.
- Optional integrations with Jira/Notion for ticket sync after Post-Alpha validation.

Summary

The MVP prioritises trustworthy documentation and backlog creation without automation dependencies. By sequencing the VibeRunner port after Codex returns—and requiring human checkpoints at every iteration—the product builds toward a marketable automation platform without sacrificing safety or transparency.
