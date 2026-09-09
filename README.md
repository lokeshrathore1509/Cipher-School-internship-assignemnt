# LLD Practice Platform — Master Low-Level Object-Oriented Design

An end-to-end, production-grade practice platform built for software engineers to master **Low-Level Design (LLD)**. The platform solves the fundamental learner problem: *drafting an object-oriented system design without knowing whether responsibilities, abstractions, relationships, coupling, extensibility, and trade-offs are sound*.

Featuring a **modular monolith architecture**, **zero external dependencies for local execution (SQLite + deterministic heuristic evaluator)**, an **8-dimension explainable rubric**, and **pluggable AI evaluation** via OpenAI/LLM endpoints.

---

## Key Features

1. **Curated Problem Library (4 Problems Seeded):**
   - **Multi-Floor Parking Lot System** (Dynamic pricing strategies, spot allocation, concurrency)
   - **Elevator Control System** (Multi-car dispatch algorithms, car state patterns, safety sensors)
   - **State-Driven Vending Machine** (FSM lifecycle states, coin/cash inventory, transaction rollbacks)
   - **Movie Ticket / Cinema Booking System** (Concurrency lock on seats, tier pricing, payment orchestration)

2. **Structured Practice Workspace:**
   - 9-section structured submission capturing core design evidence:
     - A. Requirements Understanding & Scope
     - B. Assumptions & Boundaries
     - C. Core Classes, Interfaces & Enums
     - D. Responsibilities (Single Responsibility Principle)
     - E. Relationships (Composition vs Inheritance)
     - F. Important Methods & Contracts
     - G. Design Patterns & Abstractions
     - H. Edge Cases, Concurrency & Failure Handling
     - I. Trade-offs & Design Decisions
     - Plus optional free-form Solution Notes.
   - **1-Click Starter Template Loader** tailored to each problem for immediate guidance.
   - **Local & Database Draft Autosaving**.

3. **8-Dimension Explainable Evaluation Rubric:**
   Every submission is scored across:
   1. *Requirement Understanding*
   2. *Class Responsibilities (SRP)*
   3. *Coupling & Cohesion*
   4. *Encapsulation & Interfaces*
   5. *Abstraction & Design Patterns*
   6. *Extensibility (Open-Closed)*
   7. *Edge Cases & Testability*
   8. *Quality of Explanation & Trade-offs*

   Each criterion card details: **Score (1-5)**, **Direct Evidence Quotes**, **Architectural Concern**, and **Actionable Suggestion**.

4. **Pluggable Dual-Evaluator Engine:**
   - **Rule-Based Evaluator (Deterministic):** Uses AST keyword heuristics, god-class detection, and pattern analysis. Requires **NO external API key**; works immediately out-of-the-box!
   - **AI Evaluator (LLM):** Structured JSON output validated with Zod, acting as a Principal LLD Interviewer. Automatically activates if `OPENAI_API_KEY` is configured.

5. **Iterative Deliberate Practice & Score Progression:**
   - "Try Again" creates a new attempt (Attempt #1 → Attempt #2 → Attempt #3) while keeping previous attempts immutable.
   - Tracks score progression on the problem page and dashboard.

6. **Robust State Machine & Fault Isolation:**
   - States: `DRAFT` ──► `SUBMITTED` ──► `EVALUATING` ──► `COMPLETED` / `FAILED`.
   - Submissions are saved to the database *before* evaluation commences.
   - If evaluation encounters a failure, status transitions to `FAILED`, the submission is safely preserved, and the learner can retry evaluation with 1 click.

---

## Tech Stack

- **Framework:** Next.js 15 (App Router, React 19, TypeScript)
- **Styling:** Tailwind CSS + custom dark glassmorphic design tokens
- **Icons:** Lucide React
- **Database / ORM:** SQLite via Prisma ORM (`file:./prisma/dev.db`)
- **Validation:** Zod
- **Unit & Service Testing:** Vitest
- **End-to-End Testing:** Playwright

---

## Architecture Overview

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

- **Change Test A (Submission Formats):** `Submission.format` is modeled as a polymorphic discriminator (`STRUCTURED_TEXT`), ready for future class diagram or code AST parsers.
- **Change Test B (Pluggable Evaluators):** `EvaluationService` consumes `interface Evaluator`, allowing seamless addition of `RuleBasedEvaluator`, `AIEvaluator`, `HumanEvaluator`, or composite evaluators.

---

## Quick Start & Setup Instructions

### 1. Prerequisites
- **Node.js:** v18+ (tested on Node v22)
- **npm:** v9+

### 2. Installation
Clone or navigate to the project directory:
```bash
npm install
```

### 3. Database Setup & Seeding
This creates the SQLite database and seeds the 4 comprehensive LLD problems:
```bash
npm run db:setup
```

*(Alternatively, run `npx prisma db push` followed by `npx tsx prisma/seed.ts`)*

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables Configuration

Copy `.env.example` to `.env` (a ready `.env` is already configured for local SQLite):
```env
# Local SQLite database
DATABASE_URL="file:./dev.db"

# Evaluator Mode:
# "AUTO"       -> Uses AI if OPENAI_API_KEY is present, falls back to RULE_BASED
# "RULE_BASED" -> Always uses deterministic AST/heuristic evaluator (no API key needed)
# "AI"         -> Strictly requires OPENAI_API_KEY
EVALUATOR_TYPE="AUTO"

# Optional: Configure if you want to use the AI Evaluator
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-4o-mini"
OPENAI_BASE_URL="https://api.openai.com/v1"
```

---

## Running Tests

### Unit & Domain Service Tests (Vitest)
Executes all 10 domain tests covering submission validation, state transitions, duplicate safety, rubric generation, failure resilience, and score accuracy:
```bash
npm test
```

### End-to-End Tests (Playwright)
Validates the full learner journey: Choose Problem → Start Practice → Load Template → Submit → View Rubric Feedback → Check Attempt History:
```bash
npx playwright test
```

---

## Project Structure

```
├── prisma/
│   ├── schema.prisma       # Prisma schema (Problem, Attempt, Submission, Evaluation, EvaluationCriterion)
│   ├── seed.ts             # Database seed script for 4 LLD challenges
│   └── dev.db              # SQLite local database
├── src/
│   ├── app/                # App Router pages and API routes
│   │   ├── api/            # /api/problems, /api/attempts
│   │   ├── problems/       # Problem catalog and problem detail
│   │   ├── attempts/       # Attempt history and feedback review
│   │   ├── globals.css     # Tailwind CSS & design tokens
│   │   ├── layout.tsx      # App shell layout
│   │   └── page.tsx        # Learner dashboard
│   ├── application/        # Application services (PracticeService, EvaluationService, ProblemService)
│   ├── domain/             # Domain entities, rubric definitions, Zod schemas, starter templates
│   ├── infrastructure/     # Prisma client, Repositories, RuleBasedEvaluator, AIEvaluator
│   └── components/         # UI components, Navbar, Footer, PracticeWorkspace, AttemptReview
├── tests/
│   ├── unit/               # practice-service.test.ts (10 tests)
│   └── e2e/                # practice-flow.spec.ts (Playwright journey)
├── README.md               # Project guide and overview
├── RESEARCH.md             # Market analysis and learner problem research note
├── DESIGN.md               # Architectural specification and trade-off analysis
└── AI_USAGE.md             # Transparent AI-assisted engineering decisions
```

---

## Limitations & Future Extensions

- **Machine-Coding Sandbox:** The MVP focuses on architectural structure and trade-offs via structured text. A future release can add an embedded TypeScript/Java code runner to verify method unit tests alongside design evaluation.
- **Visual UML Class Diagrams:** As planned in *Change Test A*, future iterations can accept Mermaid/PlantUML diagrams and parse AST relationships automatically.
- **Async Queue Workers:** In high-traffic deployments, in-process evaluation can be offloaded to a Redis/BullMQ worker cluster.
