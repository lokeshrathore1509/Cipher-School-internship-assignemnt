import { Evaluator } from "../../domain/evaluators/Evaluator.interface";
import {
  ConfidenceLevel,
  CriterionResult,
  EvaluationResult,
  ProblemEntity,
  RubricDimensionKey,
  StructuredSubmissionPayload,
} from "../../domain/types";
import { RUBRIC_DIMENSIONS } from "../../domain/rubric/rubric.definition";

export class RuleBasedEvaluator implements Evaluator {
  readonly type = "RULE_BASED" as const;

  async evaluate(
    problem: ProblemEntity,
    submission: StructuredSubmissionPayload
  ): Promise<EvaluationResult> {
    const criteria: CriterionResult[] = [];
    const strengths: string[] = [];
    const improvements: string[] = [];

    // Helper text extractors
    const textAll = [
      submission.requirementsUnderstanding,
      submission.assumptions,
      submission.coreClasses,
      submission.responsibilities,
      submission.relationships,
      submission.importantMethods,
      submission.designPatterns,
      submission.edgeCases,
      submission.tradeOffs,
      submission.solutionNotes || "",
    ]
      .join(" ")
      .toLowerCase();

    // 1. REQUIREMENT UNDERSTANDING
    const reqCriteria = this.evaluateRequirements(problem, submission, textAll);
    criteria.push(reqCriteria);

    // 2. CLASS RESPONSIBILITIES (SRP)
    const respCriteria = this.evaluateResponsibilities(problem, submission, textAll);
    criteria.push(respCriteria);

    // 3. COUPLING & COHESION
    const couplingCriteria = this.evaluateCouplingCohesion(submission, textAll);
    criteria.push(couplingCriteria);

    // 4. ENCAPSULATION & INTERFACES
    const encapCriteria = this.evaluateEncapsulation(submission, textAll);
    criteria.push(encapCriteria);

    // 5. ABSTRACTION & DESIGN PATTERNS
    const patternCriteria = this.evaluateDesignPatterns(problem, submission, textAll);
    criteria.push(patternCriteria);

    // 6. EXTENSIBILITY (OPEN-CLOSED)
    const extCriteria = this.evaluateExtensibility(problem, submission, textAll);
    criteria.push(extCriteria);

    // 7. EDGE CASES & TESTABILITY
    const edgeCriteria = this.evaluateEdgeCases(problem, submission, textAll);
    criteria.push(edgeCriteria);

    // 8. QUALITY OF EXPLANATION & TRADE-OFFS
    const expCriteria = this.evaluateExplanation(submission, textAll);
    criteria.push(expCriteria);

    // Calculate Overall Score (Normalized to 0 - 100)
    const totalScore = criteria.reduce((sum, c) => sum + c.score, 0);
    const maxScore = criteria.length * 5; // 40
    const overallScore = Math.round((totalScore / maxScore) * 100);

    // Identify top strengths (criteria with score >= 4) and improvements (score <= 3)
    for (const c of criteria) {
      const dimLabel = RUBRIC_DIMENSIONS[c.dimension].label;
      if (c.score >= 4) {
        strengths.push(`${dimLabel}: ${c.evidence.slice(0, 110)}...`);
      } else {
        improvements.push(`${dimLabel}: ${c.suggestion.slice(0, 110)}...`);
      }
    }

    if (strengths.length === 0) {
      strengths.push("Good foundational effort structuring the core classes and identifying key problem boundaries.");
    }
    if (improvements.length === 0) {
      improvements.push("Consider refining formal UML method signatures and documenting thread-safety locks.");
    }

    let summary = `Your solution demonstrates a solid attempt with an overall architectural score of ${overallScore}%. `;
    if (overallScore >= 80) {
      summary += "The design exhibits clean separation of concerns, thoughtful design patterns, and good awareness of extensibility.";
    } else if (overallScore >= 60) {
      summary += "The core domain entities are well captured, but some classes carry multiple responsibilities and coupling can be reduced.";
    } else {
      summary += "The submission captures high-level intentions, but lacks interface abstractions, decomposition of god classes, and edge-case handling.";
    }

    return {
      overallScore,
      evaluatorType: this.type,
      summary,
      topStrengths: strengths.slice(0, 3),
      topImprovements: improvements.slice(0, 3),
      criteria,
    };
  }

  private evaluateRequirements(
    problem: ProblemEntity,
    submission: StructuredSubmissionPayload,
    textAll: string
  ): CriterionResult {
    const text = submission.requirementsUnderstanding.toLowerCase();
    const wordCount = submission.requirementsUnderstanding.trim().split(/\s+/).length;

    // Check how many key requirements keywords are mentioned
    const reqKeywords = problem.functionalRequirements.map((r) =>
      r.toLowerCase().split(" ").slice(0, 3).join(" ")
    );
    const matchedCount = reqKeywords.filter((k) => textAll.includes(k.slice(0, 8))).length;

    let score = 3;
    let concern = "Some functional requirements appear lightly addressed or generalized.";
    let suggestion = "Explicitly trace each functional requirement to the class or method executing it.";
    let evidence = `Found ${wordCount} words in requirements breakdown. `;

    if (wordCount > 60 && matchedCount >= 2) {
      score = 5;
      concern = "Minimal ambiguity detected.";
      suggestion = "Ensure non-functional SLAs (latency, throughput) are as clearly framed as functional ones.";
      evidence += `Identified thorough coverage of problem requirements including '${submission.requirementsUnderstanding.slice(0, 90)}...'`;
    } else if (wordCount > 30) {
      score = 4;
      concern = "Good summary, but verify if corner constraints (e.g., concurrency or capacity limits) are highlighted.";
      suggestion = "Include explicit assumptions on system boundaries and external integrations.";
      evidence += `Understood core goals: '${submission.requirementsUnderstanding.slice(0, 75)}...'`;
    } else {
      score = 2;
      concern = "Requirements summary is very brief and might miss critical problem constraints.";
      suggestion = "Elaborate on the input, processing steps, and expected outputs for each key scenario.";
      evidence += `Brief requirement text provided (${wordCount} words).`;
    }

    return {
      dimension: "REQUIREMENT_UNDERSTANDING",
      score,
      evidence,
      concern,
      suggestion,
      confidence: "HIGH",
    };
  }

  private evaluateResponsibilities(
    problem: ProblemEntity,
    submission: StructuredSubmissionPayload,
    textAll: string
  ): CriterionResult {
    const text = (submission.coreClasses + " " + submission.responsibilities).toLowerCase();
    const respLen = submission.responsibilities.trim().length;

    // Detect potential God Class patterns (e.g. ParkingLot doing pricing, booking, and database)
    const godClassIndicators = [
      text.includes("parkinglot") && (text.includes("price") || text.includes("fee")) && text.includes("spot"),
      text.includes("elevatorsystem") && text.includes("door") && text.includes("dispatch"),
      text.includes("vendingmachine") && text.includes("dispense") && text.includes("coin") && text.includes("inventory"),
    ];
    const hasGodClass = godClassIndicators.some(Boolean);

    let score = 3;
    let evidence = `Analyzed classes and responsibilities: '${submission.responsibilities.slice(0, 85)}...'`;
    let concern = "Some classes may have multiple reasons to change.";
    let suggestion = "Apply Single Responsibility Principle: separate coordination from calculation and storage.";

    if (respLen > 150 && !hasGodClass) {
      score = 5;
      evidence = `Clean class demarcation evident: '${submission.responsibilities.slice(0, 100)}...'`;
      concern = "Ensure helper/utility responsibilities are not buried within entities.";
      suggestion = "Keep entities focused on domain invariants and delegate orchestration to domain services.";
    } else if (hasGodClass) {
      score = 3;
      concern = "Risk of God-Class anti-pattern: A central class appears to handle both orchestration and business rules.";
      suggestion = "Decompose central orchestrators. Delegate pricing/dispatching/inventory to dedicated collaborator classes.";
    } else if (respLen < 40) {
      score = 2;
      concern = "Responsibilities are barely articulated.";
      suggestion = "Write 1-2 clear responsibility sentences for every class listed in your core classes.";
    }

    return {
      dimension: "CLASS_RESPONSIBILITIES",
      score,
      evidence,
      concern,
      suggestion,
      confidence: "HIGH",
    };
  }

  private evaluateCouplingCohesion(
    submission: StructuredSubmissionPayload,
    textAll: string
  ): CriterionResult {
    const relText = submission.relationships.toLowerCase();
    const hasComposition = relText.includes("composition") || relText.includes("has-a") || relText.includes("contains");
    const hasInheritance = relText.includes("inheritance") || relText.includes("extends") || relText.includes("is-a");
    const hasInterface = relText.includes("implements") || relText.includes("interface") || relText.includes("abstraction");

    let score = 3;
    let evidence = `Relationship definition: '${submission.relationships.slice(0, 85)}...'`;
    let concern = "Relationships are lightly specified; risk of direct concrete class coupling.";
    let suggestion = "Favor composition over inheritance ('has-a' over 'is-a') to keep modules loosely coupled.";

    if (hasComposition && (hasInterface || hasInheritance)) {
      score = 5;
      evidence = `Effective use of composition and clean boundaries indicated: '${submission.relationships.slice(0, 100)}...'`;
      concern = "Watch out for deep inheritance trees (prefer 1 level maximum).";
      suggestion = "Ensure dependent services are injected via constructors rather than instantiated directly inside classes.";
    } else if (hasInheritance && !hasComposition) {
      score = 3;
      concern = "Heavy reliance on inheritance without clear composition relationships.";
      suggestion = "Replace deep class hierarchies with composition and strategy delegates.";
    } else if (relText.length < 30) {
      score = 2;
      concern = "Insufficient relationship details to evaluate coupling safely.";
      suggestion = "Diagram or explain how classes collaborate (e.g. ParkingLot has ParkingFloors, Floor has Spots).";
    }

    return {
      dimension: "COUPLING_COHESION",
      score,
      evidence,
      concern,
      suggestion,
      confidence: "MEDIUM",
    };
  }

  private evaluateEncapsulation(
    submission: StructuredSubmissionPayload,
    textAll: string
  ): CriterionResult {
    const text = (submission.coreClasses + " " + submission.importantMethods).toLowerCase();
    const hasInterfaces = text.includes("interface") || text.includes("abstract") || text.includes("<") || text.includes("contract");
    const hasPrivateFields = text.includes("private") || text.includes("getter") || text.includes("encapsulat");
    const methodsLen = submission.importantMethods.trim().length;

    let score = 3;
    let evidence = `Methods & Contracts review: '${submission.importantMethods.slice(0, 80)}...'`;
    let concern = "Contracts and encapsulation boundaries could be made more explicit.";
    let suggestion = "Define explicit interfaces (e.g., PricingStrategy, DispatchStrategy) so clients program to contracts.";

    if (hasInterfaces && methodsLen > 100) {
      score = 5;
      evidence = `Explicit interface contracts declared: '${submission.importantMethods.slice(0, 100)}...'`;
      concern = "Ensure interfaces remain small and focused (Interface Segregation Principle).";
      suggestion = "Mark state-mutating methods clearly and hide internal collection structures.";
    } else if (hasInterfaces || methodsLen > 80) {
      score = 4;
      concern = "Encapsulation is largely maintained, but verify that mutable state is not directly leaked.";
      suggestion = "Return unmodifiable views or copies of internal collections (e.g., parking spots list).";
    } else {
      score = 2;
      concern = "Lack of clear interface definitions and method signatures.";
      suggestion = "Provide exact method signatures with return types and parameters for core behaviors.";
    }

    return {
      dimension: "ENCAPSULATION_INTERFACES",
      score,
      evidence,
      concern,
      suggestion,
      confidence: "HIGH",
    };
  }

  private evaluateDesignPatterns(
    problem: ProblemEntity,
    submission: StructuredSubmissionPayload,
    textAll: string
  ): CriterionResult {
    const patternText = submission.designPatterns.toLowerCase();
    const commonPatterns = ["strategy", "state", "factory", "observer", "singleton", "command", "builder", "decorator", "facade"];
    const foundPatterns = commonPatterns.filter((p) => patternText.includes(p) || textAll.includes(p));

    let score = 3;
    let evidence = foundPatterns.length > 0
      ? `Mentioned design patterns: ${foundPatterns.join(", ")}.`
      : `Section notes: '${submission.designPatterns.slice(0, 75)}...'`;
    let concern = "Design patterns are either missing or not clearly justified for the problem.";
    let suggestion = "Introduce a recognized pattern like Strategy (for dynamic algorithms) or State (for lifecycle transitions).";

    if (foundPatterns.length >= 2 && patternText.length > 60) {
      score = 5;
      evidence = `Thoughtfully applied patterns: ${foundPatterns.join(", ")} with explanation: '${submission.designPatterns.slice(0, 90)}...'`;
      concern = "Avoid pattern overload; ensure each pattern genuinely reduces code volatility.";
      suggestion = "Document the concrete trade-off introduced by each pattern (e.g., extra classes vs runtime flexibility).";
    } else if (foundPatterns.length >= 1) {
      score = 4;
      concern = "Pattern mentioned, but the motivation could be deepened.";
      suggestion = "Explain the exact problem solved by the pattern instead of naming it in isolation.";
    } else if (patternText.length < 20) {
      score = 2;
      concern = "No meaningful design patterns or abstractions identified.";
      suggestion = "Consider where system behavior varies at runtime and apply an appropriate GoF pattern.";
    }

    return {
      dimension: "ABSTRACTION_DESIGN_PATTERNS",
      score,
      evidence,
      concern,
      suggestion,
      confidence: "HIGH",
    };
  }

  private evaluateExtensibility(
    problem: ProblemEntity,
    submission: StructuredSubmissionPayload,
    textAll: string
  ): CriterionResult {
    const tradeOffText = (submission.tradeOffs + " " + submission.designPatterns).toLowerCase();
    const hasExtensibility =
      tradeOffText.includes("extens") ||
      tradeOffText.includes("open-closed") ||
      tradeOffText.includes("new vehicle") ||
      tradeOffText.includes("new state") ||
      tradeOffText.includes("pluggable") ||
      tradeOffText.includes("strategy");

    let score = 3;
    let evidence = `Design extensibility notes: '${submission.tradeOffs.slice(0, 80)}...'`;
    let concern = "Hardcoded logic or 'switch/if-else' ladders might be needed to add future features.";
    let suggestion = "Ensure new requirements (such as a new vehicle type or pricing formula) can be added via new subclasses/strategies without editing existing classes.";

    if (hasExtensibility && submission.tradeOffs.length > 60) {
      score = 5;
      evidence = `Open-Closed Principle respected: '${submission.tradeOffs.slice(0, 95)}...'`;
      concern = "Beware of over-anticipating future requirements (YAGNI principle).";
      suggestion = "Keep extension points focused on dimensions of known variability.";
    } else if (submission.tradeOffs.length > 30) {
      score = 4;
      concern = "Moderate extensibility; consider how a 3rd party developer would plug in a new module.";
      suggestion = "Use a factory or registry pattern to instantiate new types without modifying orchestrator code.";
    } else {
      score = 2;
      concern = "Minimal discussion on how the design accommodates evolving requirements.";
      suggestion = "Walk through what code changes are needed if the business adds a new requirement tomorrow.";
    }

    return {
      dimension: "EXTENSIBILITY",
      score,
      evidence,
      concern,
      suggestion,
      confidence: "MEDIUM",
    };
  }

  private evaluateEdgeCases(
    problem: ProblemEntity,
    submission: StructuredSubmissionPayload,
    textAll: string
  ): CriterionResult {
    const edgeText = submission.edgeCases.toLowerCase();
    const hasConcurrency = edgeText.includes("concurren") || edgeText.includes("race") || edgeText.includes("thread") || edgeText.includes("lock") || edgeText.includes("atomic");
    const hasFullFailure = edgeText.includes("full") || edgeText.includes("exhaust") || edgeText.includes("out of") || edgeText.includes("fail") || edgeText.includes("error") || edgeText.includes("timeout");
    const wordCount = submission.edgeCases.trim().split(/\s+/).length;

    let score = 3;
    let evidence = `Edge cases addressed: '${submission.edgeCases.slice(0, 80)}...'`;
    let concern = "Boundary conditions (full capacity, race conditions, hardware timeouts) are only lightly covered.";
    let suggestion = "Detail concurrency synchronization locks and system recovery during unexpected failures.";

    if (hasConcurrency && hasFullFailure && wordCount > 40) {
      score = 5;
      evidence = `Strong edge-case foresight including concurrency and error recovery: '${submission.edgeCases.slice(0, 95)}...'`;
      concern = "Ensure lock granularity doesn't create performance bottlenecks.";
      suggestion = "Consider optimistic locking or lock striping for high-throughput entry/booking paths.";
    } else if (hasConcurrency || hasFullFailure || wordCount > 25) {
      score = 4;
      concern = "Good edge cases noted, but concurrency under heavy load requires explicit lock strategies.";
      suggestion = "Address what happens when multiple threads contend for the same resource simultaneously.";
    } else {
      score = 2;
      concern = "Edge cases section is sparse or generic.";
      suggestion = "List at least 3 critical failure scenarios and how your classes react to them gracefully.";
    }

    return {
      dimension: "EDGE_CASES_TESTABILITY",
      score,
      evidence,
      concern,
      suggestion,
      confidence: "HIGH",
    };
  }

  private evaluateExplanation(
    submission: StructuredSubmissionPayload,
    textAll: string
  ): CriterionResult {
    const tradeOffLen = submission.tradeOffs.trim().length;
    const notesLen = (submission.solutionNotes || "").trim().length;
    const totalWords = [
      submission.requirementsUnderstanding,
      submission.tradeOffs,
      submission.solutionNotes || "",
    ]
      .join(" ")
      .split(/\s+/).length;

    let score = 3;
    let evidence = `Explanation and trade-offs length: ${totalWords} words. Sample: '${submission.tradeOffs.slice(0, 80)}...'`;
    let concern = "Design trade-offs (e.g., why choice A was made over choice B) are not fully justified.";
    let suggestion = "In Low-Level Design interviews, justifying WHY you picked a pattern is as important as the code itself.";

    if (tradeOffLen > 100 && totalWords > 120) {
      score = 5;
      evidence = `Articulate design rationale and trade-off comparison: '${submission.tradeOffs.slice(0, 100)}...'`;
      concern = "Ensure non-functional impact (memory vs CPU trade-off) is noted alongside design trade-offs.";
      suggestion = "Clearly state alternative architectures considered and why they were rejected.";
    } else if (tradeOffLen > 40) {
      score = 4;
      concern = "Good rationale provided, but could mention alternatives considered.";
      suggestion = "Contrast your chosen pattern against simpler or more complex alternatives.";
    } else {
      score = 2;
      concern = "Trade-offs and architectural reasoning are under-explained.";
      suggestion = "Explain the pros and cons of your chosen approach compared to alternative designs.";
    }

    return {
      dimension: "EXPLANATION_QUALITY",
      score,
      evidence,
      concern,
      suggestion,
      confidence: "HIGH",
    };
  }
}
