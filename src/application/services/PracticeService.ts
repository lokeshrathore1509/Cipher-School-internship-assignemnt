import { structuredSubmissionSchema } from "../../domain/schemas/submission.schema";
import {
  AttemptEntity,
  EvaluatorType,
  StructuredSubmissionPayload,
} from "../../domain/types";
import { attemptRepository } from "../../infrastructure/repositories/AttemptRepository";
import { problemRepository } from "../../infrastructure/repositories/ProblemRepository";
import { evaluationService } from "./EvaluationService";

export class PracticeService {
  async getOrCreateDraft(problemSlug: string): Promise<AttemptEntity> {
    const problem = await problemRepository.findBySlug(problemSlug);
    if (!problem) {
      throw new Error(`Problem with slug "${problemSlug}" not found.`);
    }

    // Check if there is an active draft for this problem
    const attempts = await attemptRepository.findByProblemId(problem.id);
    const existingDraft = attempts.find((a) => a.status === "DRAFT");

    if (existingDraft) {
      const full = await attemptRepository.findById(existingDraft.id);
      if (full) return full;
    }

    // Create a new draft attempt
    const newAttempt = await attemptRepository.createAttempt(problem.id, "DRAFT");
    const full = await attemptRepository.findById(newAttempt.id);
    return full!;
  }

  async saveDraft(
    attemptId: string,
    payload: Partial<StructuredSubmissionPayload>
  ): Promise<void> {
    const attempt = await attemptRepository.findById(attemptId);
    if (!attempt) {
      throw new Error(`Attempt with id ${attemptId} not found.`);
    }

    const fullPayload: StructuredSubmissionPayload = {
      requirementsUnderstanding: payload.requirementsUnderstanding || "",
      assumptions: payload.assumptions || "",
      coreClasses: payload.coreClasses || "",
      responsibilities: payload.responsibilities || "",
      relationships: payload.relationships || "",
      importantMethods: payload.importantMethods || "",
      designPatterns: payload.designPatterns || "",
      edgeCases: payload.edgeCases || "",
      tradeOffs: payload.tradeOffs || "",
      solutionNotes: payload.solutionNotes || "",
    };

    await attemptRepository.saveOrUpdateSubmission(attemptId, fullPayload);
  }

  async submitSolution(
    attemptId: string,
    rawPayload: unknown,
    evaluatorType?: EvaluatorType
  ): Promise<AttemptEntity> {
    const attempt = await attemptRepository.findById(attemptId);
    if (!attempt) {
      throw new Error(`Attempt with id ${attemptId} not found.`);
    }

    // Guard against duplicate submission if already evaluating or completed
    if (attempt.status === "EVALUATING") {
      throw new Error("This attempt is already being evaluated.");
    }
    if (attempt.status === "COMPLETED") {
      throw new Error("This attempt has already been evaluated and completed. Click 'Try Again' to start a new attempt.");
    }

    // 1. Validate payload with Zod - Prevent empty or incomplete submissions
    const validatedPayload = structuredSubmissionSchema.parse(rawPayload);

    // 2. Persist submission BEFORE evaluation begins
    await attemptRepository.saveOrUpdateSubmission(attemptId, validatedPayload);
    await attemptRepository.updateStatus(attemptId, "SUBMITTED");

    // 3. Trigger evaluation
    try {
      await evaluationService.evaluateAttempt(attemptId, evaluatorType);
    } catch (err: any) {
      console.warn(`Evaluation returned error: ${err.message}`);
      // Re-throw so caller/UI receives notice, but submission remains safe
      throw err;
    }

    // Return the updated attempt
    const updated = await attemptRepository.findById(attemptId);
    return updated!;
  }

  async retryProblem(problemSlug: string): Promise<AttemptEntity> {
    const problem = await problemRepository.findBySlug(problemSlug);
    if (!problem) {
      throw new Error(`Problem with slug "${problemSlug}" not found.`);
    }

    // Creates a brand new attempt with incremented attemptNumber
    // The previous attempts remain completely untouched and immutable
    const newAttempt = await attemptRepository.createAttempt(problem.id, "DRAFT");
    const full = await attemptRepository.findById(newAttempt.id);
    return full!;
  }

  async getAttempt(id: string): Promise<AttemptEntity | null> {
    return attemptRepository.findById(id);
  }
}

export const practiceService = new PracticeService();
