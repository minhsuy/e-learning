# TMdemy Frontend — AI Project Guide

## 1. Project Identity

TMdemy is an E-learning platform frontend.

This repository contains **frontend code only**.

### Stack

* Next.js App Router
* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* REST API
* Socket.IO for realtime communication where required

### Frontend Root

```text
d:/e-learning
```

### Backend

The backend is a separate project:

```text
d:/e-learning_server
```

The frontend must treat the backend as an external service.

---

## 2. AI Role

AI works as a **Frontend Engineer** inside this repository.

AI is responsible for:

* UI implementation
* frontend architecture
* frontend state management
* API integration
* authentication flow
* Socket.IO client integration
* responsive design
* accessibility
* frontend validation
* frontend documentation

AI must not modify the backend unless the user explicitly requests backend work in a separate task.

---

## 3. Project Entry Points

Before implementing a non-trivial task, inspect the relevant project documentation.

### Project Context

```text
docs/PROJECT_CONTEXT.md
```

### Architecture

```text
docs/FRONTEND_ARCHITECTURE.md
```

### User Flows

```text
docs/USER_FLOWS.md
```

### UI/UX

```text
docs/UI_UX_GUIDELINES.md
```

### API Integration

```text
docs/API_INTEGRATION.md
```

### Authentication

```text
docs/AUTHENTICATION.md
```

### Roles & Permissions

```text
docs/ROLE_PERMISSIONS.md
```

### Frontend Roadmap

```text
docs/FRONTEND_ROADMAP.md
```

### AI Feature Direction

```text
docs/AI_FEATURE_DIRECTION.md
```

### API Contract

The API documentation under:

```text
api/
```

is the frontend **API Contract Source of Truth**.

Do not invent API behavior when the contract already defines it.

---

## 4. Instruction Hierarchy

Use this priority order:

```text
User's current task
        ↓
AGENTS.md
        ↓
.agents/rules/ (mandatory constraints)
        ↓
.agents/workflows/ (task execution process)
        ↓
.agents/skills/ (specialized implementation playbooks)
        ↓
Relevant specialized agents
        ↓
Implementation
```

The `.agents/` configuration directory contains:
```text
.agents/
├── rules/        # Rules: Mandatory constraints and boundaries (what AI must and must not do)
├── skills/       # Skills: Specialized implementation playbooks (how to perform specific capabilities)
└── workflows/    # Workflows: Task execution process (how tasks progress and orchestrate skills)
```

Higher-level instructions must not be silently overridden by lower-level instructions.

When instructions conflict, stop and report the conflict instead of guessing.

---

## 5. Rules

Frontend rules are stored in:

```text
.agents/rules/
```

Rules define **mandatory constraints** — what AI must and must not do.

Active established rules:

* `00-core.md`: Core principles, inspect before modify, scope control, dependency policy, and conflict resolution.
* `01-architecture.md`: Next.js App Router, Server Components by default, separation of concerns, and architectural invariants.
* `02-api-boundary.md`: Backend isolation, REST/Socket.IO communication, Source of Truth in `api/`, and [BACKEND GAP] protocol.
* `03-ui-ux.md`: Stitch visual reference, Tailwind + shadcn/ui, responsive standards, and 6 state UX coverage.
* `04-code-quality.md`: Strict TypeScript, clean code, no premature abstraction, and [DEPENDENCY REQUEST] protocol.
* `05-validation.md`: Mandatory automated checks (tsc, lint, build), UI/API verification checklists, and honest reporting.

Do not duplicate the complete content of these rules inside this file.

---

## 6. Skills

Specialized implementation knowledge lives under:

```text
.agents/skills/
```

Skills are **specialized implementation playbooks** — describing how to execute specific types of frontend work.

Active established skills:

* `stitch-ui` (`.agents/skills/stitch-ui/SKILL.md`): Convert Stitch designs to frontend, preserve visual hierarchy, prioritize component reuse.
* `api-integration` (`.agents/skills/api-integration/SKILL.md`): Connect REST API from `api/` contract, use centralized API client, handle UX states.
* `auth-integration` (`.agents/skills/auth-integration/SKILL.md`): Authentication, token lifecycle, protected routes, and role permission matrix.
* `page-implementation` (`.agents/skills/page-implementation/SKILL.md`): Assemble routes in App Router, compose RSC and Client Components, responsive layouts.
* `frontend-review` (`.agents/skills/frontend-review/SKILL.md`): Review architecture, types, UI/UX, accessibility, security, and classification of findings.
* `bug-investigation` (`.agents/skills/bug-investigation/SKILL.md`): Systematic troubleshooting, root cause isolation, minimal targeted fixes, regression prevention.

Only use a skill when it is relevant to the current task.

---

## 7. Workflows

Repeatable development processes live under:

```text
.agents/workflows/
```

Workflows define **the task execution process** — coordinating how tasks progress, enforcing validation gates, and orchestrating which skills are selected.

Active established workflows:

* `feature-development` (`.agents/workflows/feature-development.md`): End-to-end coordination for creating pages, UI components, and API integration with mandatory gates and review.
* `bug-fix` (`.agents/workflows/bug-fix.md`): Systematic troubleshooting, root cause isolation, minimal targeted fix, and regression prevention.
* `review-and-validation` (`.agents/workflows/review-and-validation.md`): Comprehensive code quality audit, standards compliance check, and automated validation without modifying code.

Do not skip workflow stages or bypass gates when a workflow is being executed.

---

## 8. Specialized Agents

Specialized AI roles will eventually live under:

```text
.agents/agents/
```

Possible roles:

```text
ui-agent
api-agent
auth-agent
realtime-agent
review-agent
testing-agent
```

Agents are specialized responsibilities, not replacements for the project rules.

---

## 9. Backend Boundary

This is a critical project boundary.

Frontend communicates with the backend only through:

```text
REST API
Socket.IO
```

Frontend must NEVER:

* import backend source code
* import Prisma
* access PostgreSQL directly
* access MongoDB directly
* import Mongoose models
* create database queries
* modify backend controllers
* modify backend services
* modify backend repositories
* modify backend routes
* modify Prisma schema
* modify backend API contracts
* bypass the API layer

If a required backend capability does not exist, report:

```text
[BACKEND GAP]
```

Then explain:

* required capability
* expected endpoint/event
* why the frontend needs it

Do not fake the API and do not modify the backend unless explicitly instructed.

---

## 10. API Contract

The frontend must use the API documentation under:

```text
api/
```

as the contract source of truth.

Before integrating an API, verify:

* endpoint
* HTTP method
* authentication requirement
* request parameters
* request body
* response structure
* error structure
* pagination
* role requirements

Do not invent fields or endpoints.

If the API contract is insufficient or contradictory:

```text
[BACKEND GAP]
```

Report the issue before implementing assumptions.

---

## 11. UI / Design Direction

TMdemy uses Stitch as the primary visual reference.

Stitch project:

```text
tmdemy
```

The frontend should preserve the established TMdemy visual language.

Use:

* Tailwind CSS
* shadcn/ui
* reusable components
* consistent spacing
* consistent typography
* responsive layouts
* accessible interactions

Prefer reusing existing components over creating duplicates.

When implementing a Stitch screen, reproduce the intended structure and visual hierarchy rather than creating an unrelated design.

---

## 12. Existing Application Structure

Important frontend areas include:

```text
src/
├── app/
├── components/
├── data/
├── lib/
├── types/
└── ...
```

The exact structure may evolve.

Before creating a new file or folder, inspect the existing structure and reuse an existing pattern when appropriate.

Do not reorganize the project without a clear reason.

---

## 13. Current Product Areas

The frontend currently contains or is planned around:

* authentication
* dashboard
* course listing
* course detail
* classroom / learning
* learning roadmap
* leaderboard
* certificates
* profile
* settings
* messages
* gamification
* XP
* streak
* course recommendations
* AI features
* future realtime features

Not every feature is necessarily fully connected to the backend.

AI must distinguish between:

```text
UI implemented
API integrated
Backend supported
Fully functional
```

Never claim a feature is fully functional when only its UI exists.

---

## 14. Development Principles

### Inspect before modifying

Before changing code:

1. inspect the relevant files
2. understand the existing pattern
3. check the API contract if applicable
4. reuse existing architecture
5. then implement

### Scope control

Implement only what the current task requires.

Do not:

* add unrelated features
* refactor unrelated code
* redesign unrelated pages
* change architecture without approval
* install unnecessary dependencies
* modify backend to solve a frontend problem

### Prefer simple solutions

Prefer:

```text
existing component
    >
small reusable component
    >
new abstraction
```

Avoid unnecessary complexity.

---

## 15. Dependency Policy

Do not install a new npm package unless it is necessary for the requested task.

If a dependency is required, report:

```text
[DEPENDENCY REQUEST]
```

with:

* package name
* purpose
* why existing dependencies are insufficient

Do not silently introduce major libraries or replace the existing stack.

---

## 16. Validation

After meaningful implementation, validate the affected frontend.

Typical checks:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Also verify the affected UI manually when possible.

For API integrations, verify the implementation against:

```text
api/
```

For authentication-protected features, verify appropriate auth and role behavior.

---

## 17. Reporting

For larger phased tasks, create a progress report under:

```text
docs/progress/
```

The report should contain:

* what was implemented
* files created/modified
* validation results
* known issues
* unresolved backend gaps
* scope limitations
* next recommended step

After completing a defined phase, stop.

Do not automatically continue into the next phase unless explicitly instructed.

---

## 18. Important Rule

When uncertain:

```text
DO NOT GUESS.
DO NOT EXPAND SCOPE.
DO NOT MODIFY BACKEND.
DO NOT FAKE SUCCESS.
```

Instead:

```text
INSPECT → VERIFY → IMPLEMENT → VALIDATE → REPORT
```

The goal is to maintain a stable, understandable, production-quality frontend while preserving the separation between TMdemy frontend and backend.
