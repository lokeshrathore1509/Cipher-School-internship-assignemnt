# AI Usage & Architectural Decision Record

**Project:** Low-Level Design (LLD) Practice Platform  
**Purpose:** Transparent documentation of AI-assisted engineering decisions made during architecture, domain modeling, and implementation.

---

## Decision 1: Evaluator Abstraction & Fallback Architecture

### What AI Suggested:
During initial planning, an AI assistant proposed directly calling the OpenAI API inside Next.js Server Actions with a `try/catch` block that would return a mock JSON object if the API failed.

### What Was Accepted vs Rejected:
- **Accepted:** The concept of having a mock fallback to ensure the application runs without an API key.
- **Rejected:** Placing AI API calls directly inside Server Actions or route handlers, and returning a shallow mock on error.
- **Accepted Alternative (Our Decision):**
  We formalized a strict **Evaluator Strategy Pattern** (`interface Evaluator`). We separated the evaluation engine into two distinct implementations:
  1. `RuleBasedEvaluator`: A deterministic, AST/heuristic parser that extracts substantive evidence, checks for god-classes, evaluates 8 dimensions, and produces legitimate architectural feedback without calling external APIs.
  2. `AIEvaluator`: A dedicated strategy using structured output and Zod validation against an OpenAI/LLM endpoint.
  We introduced `EvaluationService` to manage the strategy selection based on environment configuration (`AUTO`, `RULE_BASED`, `AI`).

### Rationale:
Direct coupling to an external AI API in the presentation layer violates the Single Responsibility Principle and the Dependency Inversion Principle. Building a standalone `RuleBasedEvaluator` guarantees that the platform is 100% functional, testable, and deterministic for anyone running the project locally out of the box.

---

## Decision 2: Submission Persistence Timing & Failure Isolation

### What AI Suggested:
An AI prompt suggested receiving the submission payload, calling the evaluation engine in memory, and then saving both the `Submission` and `Evaluation` together in a single database transaction upon success.

### What Was Accepted vs Rejected:
- **Rejected:** Saving the submission and evaluation simultaneously *after* evaluation completes.
- **Accepted (Our Decision):**
  We instituted an explicit state machine:
  `DRAFT` ──► `SUBMITTED` ──► `EVALUATING` ──► `COMPLETED` / `FAILED`.
  The learner's submission is persisted in the database in the `SUBMITTED` state **before** the evaluator executes. If evaluation throws an error (e.g., API timeout, invalid JSON, or network glitch), the state transitions to `FAILED`, but the submission text remains safely stored in SQLite.

### Rationale:
In developer education tools, learners invest 20–45 minutes crafting a comprehensive design. If an AI call times out or throws an unhandled exception, losing the learner's submitted text is a critical user-experience failure. By persisting before evaluation, we ensure zero data loss and enable 1-click re-evaluation.

---

## Decision 3: Submission Format — Free-Form Code vs Structured 9-Field Design

### What AI Suggested:
An AI assistant initially suggested providing a Monaco/VS Code editor where learners would write executable Java/TypeScript code with automated unit test verification.

### What Was Accepted vs Rejected:
- **Rejected:** A code-only execution sandbox for the MVP.
- **Accepted (Our Decision):**
  We built a structured 9-field submission workspace (Requirements, Assumptions, Core Classes, Responsibilities, Relationships, Methods & Contracts, Design Patterns, Edge Cases & Concurrency, Trade-offs + Notes).
- **Extensibility Preparedness:** We modeled `Submission.format` as a polymorphic field (`STRUCTURED_TEXT`), laying the foundation for future class diagram or code AST parsers (Change Test A).

### Rationale:
Low-Level Design interviews test structural reasoning, decoupling, encapsulation, and trade-offs. Asking a candidate to write 400 lines of boilerplate Java in a browser editor shifts the challenge to typing speed and syntax bugs rather than object-oriented design. The structured 9-field format captures all the necessary architectural evidence while keeping practice fast, focused, and measurable.

---

## Decision 4: Deterministic God-Class & SRP Detection Heuristics

### What AI Suggested:
For the deterministic fallback evaluator, AI suggested returning static boilerplate strings or random scores between 3 and 5.

### What Was Accepted vs Rejected:
- **Rejected:** Returning static or random mock scores.
- **Accepted (Our Decision):**
  We implemented heuristic algorithms inside `RuleBasedEvaluator`:
  - **God-Class Detection:** Checks whether a central orchestrator class (e.g., `ParkingLot` or `ElevatorSystem`) is documented as handling disparate domains (e.g., spot allocation + pricing calculation + ticket persistence). If detected, it assigns a lower score on `CLASS_RESPONSIBILITIES`, quotes the violation, and suggests separating concerns using the Strategy pattern.
  - **Coupling Detection:** Checks for keywords indicating composition (`has-a`, `contains`) versus inheritance (`is-a`, `extends`). If only inheritance is present, it flags tight coupling and recommends composition.
  - **Concurrency & Edge Cases:** Analyzes mention of locks, synchronization, and race condition handling.

### Rationale:
Static or random evaluations undermine learner trust. Even without an LLM, the deterministic evaluator must provide honest, evidence-grounded feedback based on what the learner actually submitted.

---

## Decision 5: Immutability of Completed Attempts During "Try Again"

### What AI Suggested:
An AI design suggested an `updateAttempt` API that would overwrite the existing attempt record with the new submission text when a learner clicked "Try Again".

### What Was Accepted vs Rejected:
- **Rejected:** Mutating existing attempt records.
- **Accepted (Our Decision):**
  Attempts are strictly append-only and immutable once completed. Clicking "Try Again" invokes `practiceService.retryProblem(slug)`, which queries `getNextAttemptNumber(problemId)` and creates a brand-new `Attempt` record (`Attempt #1`, `Attempt #2`, `Attempt #3`).

### Rationale:
Deliberate practice requires tracking improvement over time. Overwriting previous attempts destroys the learner's historical record and makes it impossible to visualize score progression (e.g., 58% → 74% → 86%).
