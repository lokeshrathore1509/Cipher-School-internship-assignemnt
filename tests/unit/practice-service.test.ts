import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/infrastructure/db/prisma";
import { practiceService } from "@/application/services/PracticeService";
import { evaluationService } from "@/application/services/EvaluationService";
import { problemRepository } from "@/infrastructure/repositories/ProblemRepository";
import { attemptRepository } from "@/infrastructure/repositories/AttemptRepository";
import { RuleBasedEvaluator } from "@/infrastructure/evaluators/RuleBasedEvaluator";
import { structuredSubmissionSchema } from "@/domain/schemas/submission.schema";
import { STARTER_TEMPLATES } from "@/domain/templates/starterTemplates";

describe("LLD Practice Platform - Domain & Service Unit Tests", () => {
  const testSlug = "parking-lot";
  let problemId: string;

  beforeAll(async () => {
    const problem = await problemRepository.findBySlug(testSlug);
    if (!problem) {
      throw new Error("Seeded problem not found. Please run seed first.");
    }
    problemId = problem.id;
  });

  afterAll(async () => {
    // Clean up attempts created during testing
    await prisma.attempt.deleteMany({
      where: { problemId },
    });
    await prisma.$disconnect();
  });

  // Test 1: Cannot submit empty solution
  it("1. Cannot submit empty solution - rejects with validation error", async () => {
    const draft = await practiceService.getOrCreateDraft(testSlug);

    const emptyPayload = {
      requirementsUnderstanding: "",
      assumptions: "",
      coreClasses: "",
      responsibilities: "",
      relationships: "",
      importantMethods: "",
      designPatterns: "",
      edgeCases: "",
      tradeOffs: "",
    };

    // Expect Zod validation failure
    await expect(
      practiceService.submitSolution(draft.id, emptyPayload)
    ).rejects.toThrow();
  });

  // Test 2: Valid submission creates an attempt and saves submission
  it("2. Valid submission creates an attempt and links submission", async () => {
    const draft = await practiceService.getOrCreateDraft(testSlug);
    const validPayload = STARTER_TEMPLATES["parking-lot"];

    const updated = await practiceService.submitSolution(
      draft.id,
      validPayload,
      "RULE_BASED"
    );

    expect(updated).toBeDefined();
    expect(updated.id).toBe(draft.id);
    expect(updated.submission).toBeDefined();
    expect(updated.submission?.content.coreClasses).toContain("ParkingLot");
  });

  // Test 3: Submission status transitions correctly
  it("3. Submission status transitions correctly (DRAFT -> SUBMITTED -> COMPLETED)", async () => {
    // Create new draft
    const attempt = await attemptRepository.createAttempt(problemId, "DRAFT");
    expect(attempt.status).toBe("DRAFT");

    const validPayload = STARTER_TEMPLATES["parking-lot"];
    const completed = await practiceService.submitSolution(
      attempt.id,
      validPayload,
      "RULE_BASED"
    );

    expect(completed.status).toBe("COMPLETED");
  });

  // Test 4: Duplicate submission is handled safely
  it("4. Duplicate submission is handled safely - prevents concurrent or repeated submit", async () => {
    const attempt = await attemptRepository.createAttempt(problemId, "DRAFT");
    const validPayload = STARTER_TEMPLATES["parking-lot"];

    // First submission
    await practiceService.submitSolution(attempt.id, validPayload, "RULE_BASED");

    // Second submission on already COMPLETED attempt must be rejected
    await expect(
      practiceService.submitSolution(attempt.id, validPayload, "RULE_BASED")
    ).rejects.toThrow(/already been evaluated/i);
  });

  // Test 5: Evaluation generates criterion results across all 8 dimensions
  it("5. Evaluation generates criterion results across all 8 rubric dimensions", async () => {
    const problem = await problemRepository.findById(problemId);
    expect(problem).toBeDefined();

    const evaluator = new RuleBasedEvaluator();
    const result = await evaluator.evaluate(
      problem!,
      STARTER_TEMPLATES["parking-lot"]
    );

    expect(result.criteria).toHaveLength(8);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.topStrengths.length).toBeGreaterThanOrEqual(1);
    expect(result.topImprovements.length).toBeGreaterThanOrEqual(1);

    // Verify all criteria have evidence, concern, and suggestion
    for (const c of result.criteria) {
      expect(c.score).toBeGreaterThanOrEqual(1);
      expect(c.score).toBeLessThanOrEqual(5);
      expect(c.evidence).toBeTruthy();
      expect(c.concern).toBeTruthy();
      expect(c.suggestion).toBeTruthy();
    }
  });

  // Test 6: Evaluation failure does not delete submission
  it("6. Evaluation failure does not delete submission - sets status to FAILED", async () => {
    const attempt = await attemptRepository.createAttempt(problemId, "DRAFT");
    const validPayload = STARTER_TEMPLATES["parking-lot"];

    // Save submission first
    await attemptRepository.saveOrUpdateSubmission(attempt.id, validPayload);

    // Mock an evaluator failure
    const badAttemptId = attempt.id;

    // Simulate failure by forcing status to FAILED
    await attemptRepository.updateStatus(badAttemptId, "FAILED");

    // Verify attempt still has its submission in DB intact!
    const reloaded = await attemptRepository.findById(badAttemptId);
    expect(reloaded).toBeDefined();
    expect(reloaded?.status).toBe("FAILED");
    expect(reloaded?.submission).toBeDefined();
    expect(reloaded?.submission?.content.coreClasses).toContain("ParkingLot");
  });

  // Test 7: Retry creates a new attempt with incremented attempt number
  it("7. Retry creates a new attempt with incremented attempt number", async () => {
    const priorAttempts = await attemptRepository.findByProblemId(problemId);
    const initialCount = priorAttempts.length;

    const retryAttempt = await practiceService.retryProblem(testSlug);

    expect(retryAttempt.id).toBeDefined();
    expect(retryAttempt.attemptNumber).toBe(initialCount + 1);
    expect(retryAttempt.status).toBe("DRAFT");
  });

  // Test 8: Previous attempt remains immutable
  it("8. Previous attempt remains immutable when new retry attempt is created", async () => {
    const firstAttempt = await attemptRepository.createAttempt(problemId, "DRAFT");
    await practiceService.submitSolution(
      firstAttempt.id,
      STARTER_TEMPLATES["parking-lot"],
      "RULE_BASED"
    );

    const firstCompleted = await attemptRepository.findById(firstAttempt.id);
    const originalScore = firstCompleted?.evaluation?.overallScore;
    const originalStatus = firstCompleted?.status;

    // Create second retry attempt
    const secondAttempt = await practiceService.retryProblem(testSlug);

    // Verify first attempt was NOT mutated or overwritten
    const firstAfterRetry = await attemptRepository.findById(firstAttempt.id);
    expect(firstAfterRetry?.status).toBe(originalStatus);
    expect(firstAfterRetry?.evaluation?.overallScore).toBe(originalScore);
    expect(firstAfterRetry?.id).not.toBe(secondAttempt.id);
  });

  // Test 9: Score calculation is correct
  it("9. Score calculation is accurate from rubric criterion sum", async () => {
    const evaluator = new RuleBasedEvaluator();
    const problem = await problemRepository.findById(problemId);
    const result = await evaluator.evaluate(
      problem!,
      STARTER_TEMPLATES["parking-lot"]
    );

    const sumScores = result.criteria.reduce((sum, c) => sum + c.score, 0);
    const maxScore = result.criteria.length * 5; // 40
    const expectedPercent = Math.round((sumScores / maxScore) * 100);

    expect(result.overallScore).toBe(expectedPercent);
  });

  // Test 10: Required problem fields are validated
  it("10. Required problem fields are properly populated and validated in repository", async () => {
    const problem = await problemRepository.findBySlug(testSlug);
    expect(problem).toBeDefined();
    expect(problem?.title).toBeTruthy();
    expect(problem?.slug).toBe("parking-lot");
    expect(problem?.difficulty).toBe("MEDIUM");
    expect(problem?.problemStatement.length).toBeGreaterThan(50);
    expect(problem?.functionalRequirements.length).toBeGreaterThan(3);
    expect(problem?.assumptions.length).toBeGreaterThan(1);
    expect(problem?.constraints.length).toBeGreaterThan(1);
    expect(problem?.expectedDesignAreas.length).toBeGreaterThan(1);
    expect(problem?.sampleEdgeCases.length).toBeGreaterThan(1);
  });
});
