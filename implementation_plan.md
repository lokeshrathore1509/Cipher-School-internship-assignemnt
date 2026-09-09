# Implementation Plan - Low-Level Design (LLD) Practice Platform

A full-stack, domain-driven Low-Level Design (LLD) practice platform built for software engineering learners. It addresses the core learner gap: *designing a solution without knowing whether abstractions, coupling, responsibilities, and trade-offs are sound*, providing structured submissions and rubric-based, explainable evaluations with deterministic and AI evaluators.

## User Review Required

> [!IMPORTANT]
> **No external API key is required to run the full application.**
> A robust, deterministic rule-based evaluation engine analyzes the learner's submitted classes, responsibilities, patterns, and edge cases, producing evidence-backed rubric scores across 8 dimensions. When an `OPENAI_API_KEY` (or compatible LLM key) is provided in `.env`, the system automatically activates the `AIEvaluator` using structured JSON output validated with Zod.

> [!NOTE]
> **Storage & Portability:**
> SQLite (`file:./prisma/dev.db`) is used via Prisma ORM for zero-setup, fully reproducible local execution. The database will be seeded with 4 detailed, production-grade LLD problems (Parking Lot, Elevator System, Vending Machine, Cinema Booking).

---

## Proposed Architecture & Domain Design

The platform is designed as a **clean modular monolith** strictly separating UI, application services, domain entities, and infrastructure.

```
┌────────────────────────────────────────────────────────┐
│                   Presentation Layer                   │
│   Next.js App Router (/problems, /practice, /attempts)  │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                   Application Layer                    │
│   PracticeService, AttemptService, EvaluationService   │
└─────────────┬───────────────────────────┬──────────────┘
              │                           │
┌─────────────▼───────────────┐ ┌─────────▼──────────────┐
│        Domain Layer         │ │  Infrastructure Layer  │
│  Entities, Value Objects,   │ │  Prisma Repositories,  │
│  Rubric Models, Interfaces  │ │  Evaluator Strategies  │
└─────────────────────────────┘ └────────────────────────┘
```

### 1. Future Change Test Proofing
- **Change Test A (Submission Format):** Submissions use a polymorphic payload model (`SubmissionContent` discriminated union, currently `StructuredTextSubmissionContent`, ready for `ClassDiagramSubmissionContent`).
- **Change Test B (Evaluator Pluggability):** An `Evaluator` strategy interface is consumed by `EvaluationService`. Concrete strategies include `RuleBasedEvaluator`, `AIEvaluator`, and an optional `CompositeEvaluator`.

### 2. Status Lifecycle & Invariant Safety
```
DRAFT ──► SUBMITTED ──► EVALUATING ──► COMPLETED
                             │
                             └──► FAILED (Submission retained; retry allowed)
```
- A submission is **persisted in `SUBMITTED` state before evaluation begins**.
- Concurrent/duplicate evaluation is guarded against at the service layer using state locks.
- If evaluation encounters an error, the attempt is transitioned to `FAILED`, the submission is preserved, and the learner can trigger a retry without data loss.

---

## Proposed Changes

### Tech Stack & Dependencies
- **Framework:** Next.js 15+ (App Router, React 19, TypeScript)
- **Styling:** Tailwind CSS + Radix/Lucide icons + custom modern glassmorphic tokens
- **Database / ORM:** SQLite via Prisma ORM
- **Validation:** Zod (for submission payloads, AI response parsing, API requests)
- **Testing:** Vitest (domain & application unit tests) + Playwright (end-to-end browser tests)

---

### Component 1: Data Model & Persistence (`prisma/schema.prisma`)

#### [NEW] `prisma/schema.prisma`
- `Problem`: id, slug (unique), title, difficulty, shortDescription, problemStatement, functionalRequirements (JSON/text), assumptions, constraints, expectedDesignAreas, sampleEdgeCases, createdAt.
- `Attempt`: id, problemId, attemptNumber, status (`DRAFT`, `SUBMITTED`, `EVALUATING`, `COMPLETED`, `FAILED`), createdAt, updatedAt.
- `Submission`: id, attemptId (unique), format (`STRUCTURED_TEXT`), content (JSON string storing the 9 sections), createdAt.
- `Evaluation`: id, attemptId (unique), overallScore (0-100), evaluatorType (`RULE_BASED` or `AI`), summary, topStrengths (JSON array), topImprovements (JSON array), createdAt.
- `EvaluationCriterion`: id, evaluationId, dimension (1 of 8 rubric dimensions), score (1-5), evidence, concern, suggestion, confidence (`HIGH`, `MEDIUM`, `LOW`).

#### [NEW] `prisma/seed.ts`
- Seeds the 4 complete LLD problems with rich specifications:
  1. **Parking Lot System** (Multiple spot types, dynamic fee strategies, concurrent entry/exit, ticket allocation)
  2. **Elevator Control System** (Multi-car dispatch algorithms, internal/external requests, state patterns)
  3. **Vending Machine** (State pattern for Idle/HasMoney/Dispensing/SoldOut, coin/cash inventory, change return)
  4. **Movie Ticket Booking / Cinema System** (Concurrency lock on seats, screening schedules, pricing, payment checkout)

---

### Component 2: Domain Layer (`src/domain/`)

#### [NEW] `src/domain/types/index.ts`
- Core entity types: `Problem`, `Attempt`, `Submission`, `Evaluation`, `RubricCriterion`.
- Submission status enum: `AttemptStatus` (`DRAFT`, `SUBMITTED`, `EVALUATING`, `COMPLETED`, `FAILED`).
- Rubric dimensions:
  1. `REQUIREMENT_UNDERSTANDING`
  2. `CLASS_RESPONSIBILITIES`
  3. `COUPLING_COHESION`
  4. `ENCAPSULATION_INTERFACES`
  5. `ABSTRACTION_DESIGN_PATTERNS`
  6. `EXTENSIBILITY`
  7. `EDGE_CASES_TESTABILITY`
  8. `EXPLANATION_QUALITY`

#### [NEW] `src/domain/evaluators/Evaluator.interface.ts`
- Definition of `Evaluator`:
  ```typescript
  export interface Evaluator {
    readonly type: 'RULE_BASED' | 'AI';
    evaluate(problem: Problem, submission: StructuredSubmission): Promise<EvaluationResult>;
  }
  ```

#### [NEW] `src/domain/schemas/submission.schema.ts`
- Zod schema for structured text submissions:
  - `requirementsUnderstanding` (min 20 chars)
  - `assumptions`
  - `coreClasses` (min 20 chars)
  - `responsibilities` (min 20 chars)
  - `relationships`
  - `importantMethods`
  - `designPatterns`
  - `edgeCases`
  - `tradeOffs`
  - `solutionNotes` (optional)

---

### Component 3: Application Services & Evaluators (`src/application/` & `src/infrastructure/`)

#### [NEW] `src/infrastructure/evaluators/RuleBasedEvaluator.ts`
- Sophisticated, deterministic AST/text and heuristic parser:
  - Class & interface detector (identifies entities, interfaces, inheritance/implementations).
  - Responsibility & God-Class detector (flags classes handling >3 distinct domain responsibilities like DB + Business + Pricing).
  - Coupling & SOLID heuristics (checks for abstraction usage, Strategy/Factory patterns, interface segregation).
  - Edge case & requirement coverage analyzer against problem-specific keywords.
  - Generates realistic, evidence-based feedback: specific quotes from submission, concrete concerns, and actionable architectural suggestions.

#### [NEW] `src/infrastructure/evaluators/AIEvaluator.ts`
- Uses structured output schema with LLM (e.g. OpenAI GPT-4o-mini / Gemini / compatible endpoint).
- Strict prompt instructing LLM to act as a Principal LLD Interviewer, assessing against the 8-dimension rubric without comparing to a single rigid template.
- Zod validation on AI output; if malformed or API fails, cleanly raises an error handled by `EvaluationService`.

#### [NEW] `src/application/services/EvaluationService.ts`
- Evaluator factory / strategy selector:
  - Checks if LLM API key is present; defaults to `RuleBasedEvaluator`.
  - Coordinates attempt status transition (`SUBMITTED` -> `EVALUATING` -> `COMPLETED`/`FAILED`).
  - Persists `Evaluation` and all 8 `EvaluationCriterion` records atomically.

#### [NEW] `src/application/services/PracticeService.ts`
- Handles starting new attempts, saving drafts, submitting solutions, and triggering retries.
- Enforces attempt numbering (`Attempt #1`, `Attempt #2`, etc.) and immutability of completed attempts.

---

### Component 4: Presentation Layer (Next.js App Router)

#### [NEW] `src/app/page.tsx` (Dashboard)
- High-level metrics: Problems practiced, total attempts, average score.
- Progress chart / score improvement tracker.
- Recent attempts table with status pills.
- "Continue Practicing" quick cards for the 4 problems.

#### [NEW] `src/app/problems/page.tsx` (Problem Library)
- Clean card grid of the 4 problems with tags, difficulty indicators, requirements summary, and attempt badges.

#### [NEW] `src/app/problems/[slug]/page.tsx` (Problem Details)
- Comprehensive view: problem statement, functional requirements, assumptions, constraints, sample edge cases.
- "Your Previous Attempts" history drawer/table with attempt progression (e.g. Attempt 1: 54% -> Attempt 2: 78%).
- Prominent "Start Practice" or "New Attempt" CTA.

#### [NEW] `src/app/problems/[slug]/practice/page.tsx` (Practice Workspace)
- Split or focused tabbed workspace:
  - Left panel: Collapsible Problem Requirements & Checklist.
  - Right panel: 9-section structured design form with syntax-highlighted code/text areas.
  - "Load Starter Template" button for quick guidance.
  - LocalStorage autosave indicator ("Draft saved at 12:45 PM").
  - Action buttons: "Save Draft" & "Submit for Evaluation".
  - Submission confirmation modal.
  - Live evaluation loading state with animated progress steps.

#### [NEW] `src/app/attempts/page.tsx` (Attempt History)
- Filterable table of all attempts across problems with date, status, score, evaluator type, and direct link to review.

#### [NEW] `src/app/attempts/[id]/page.tsx` (Evaluation & Review)
- Executive review summary: Overall score gauge (e.g., 78/100), evaluator badge (Rule-Based vs AI), attempt number.
- "Top Strengths" and "Top Improvement Areas" callout panels.
- 8 Expandable / Grid Criterion Cards:
  - Dimension title & score (e.g. 4/5).
  - Quoted evidence from submission.
  - Architecture concern highlighted in amber/red.
  - Concrete suggestion highlighted in blue/green.
  - Evaluator confidence indicator.
- Submission Tab / Inspector: View full submitted text alongside the evaluation.
- "Try Again (New Attempt)" CTA that seeds a new attempt while preserving the current one.

#### [NEW] API Routes & Server Actions (`src/app/api/...`)
- `/api/problems`: List and get problem details.
- `/api/attempts`: Create draft, submit attempt, list history.
- `/api/attempts/[id]`: Get attempt with submission and evaluation.
- `/api/attempts/[id]/evaluate`: Trigger or retry evaluation.

---

### Component 5: Test Suite

#### [NEW] `tests/unit/practice-service.test.ts`
1. Cannot submit empty solution (validation error).
2. Valid submission creates an attempt with `SUBMITTED` status.
3. Submission status transitions: `DRAFT` -> `SUBMITTED` -> `EVALUATING` -> `COMPLETED`.
4. Duplicate submission or concurrent evaluation is prevented.
5. Evaluation generates all 8 criterion results.
6. Evaluation failure retains the submission and marks status `FAILED`.
7. Retry creates a new distinct attempt with incremented attempt number.
8. Previous attempt remains immutable after retry.
9. Score calculation (weighted / average of 8 criteria) is accurate.
10. Required problem fields are validated.

#### [NEW] `tests/e2e/practice-flow.spec.ts` (Playwright)
- End-to-end user journey test:
  1. Open dashboard.
  2. Navigate to Parking Lot problem.
  3. Start practice attempt.
  4. Fill in structured solution (or load starter template).
  5. Submit solution.
  6. Assert evaluation completes and displays score + criterion cards.
  7. Navigate to attempt history and verify the attempt is listed.

---

### Component 6: Documentation (`README.md`, `RESEARCH.md`, `DESIGN.md`, `AI_USAGE.md`)

- `README.md`: Features, architecture, setup instructions (`npm install`, `npm run db:setup`, `npm run dev`), testing guide (`npm test`), environment variables.
- `RESEARCH.md`: Real-world LLD practice platform analysis (AlgoMaster, LLDCoding, Hello Interview, Codemia, Educative, GitHub repos), identifying the critical feedback gap and justifying this MVP's structured-text rubric approach.
- `DESIGN.md`: Deep dive into LLD domain architecture, SOLID principles in the codebase, evaluator strategies, state machine, change tests A & B, scalability considerations.
- `AI_USAGE.md`: Transparent record of 4 AI-assisted engineering decisions made during development (evaluator abstraction, deterministic AST heuristic design, schema design, state transition safeguards).

---

## Verification Plan

### Automated Tests
- Run `npm test` (Vitest unit & service test suite):
  - Target: 100% pass across all 10 required domain test cases.
- Run `npx tsc --noEmit` to verify type integrity.
- Run `npm run lint` to verify code quality.
- Run `npx playwright test` to verify the end-to-end browser journey.

### Manual Verification
- Start Next.js dev server (`npm run dev`).
- Test complete user loop in browser:
  1. View Dashboard stats.
  2. Browse Problem Library -> Open "Parking Lot".
  3. Click "Start Practice".
  4. Test validation on empty submit (should show field errors).
  5. Click "Load Template", customize content, submit.
  6. Inspect evaluation results page: verify score, 8 criteria cards, evidence quotes, concerns, suggestions.
  7. Click "Try Again", verify Attempt #2 is created with previous attempt unchanged.
  8. Verify attempt history displays both attempts and score progression.
