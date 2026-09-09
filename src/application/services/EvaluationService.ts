import { Evaluator } from "../../domain/evaluators/Evaluator.interface";
import { EvaluationResult, EvaluatorType } from "../../domain/types";
import { attemptRepository } from "../../infrastructure/repositories/AttemptRepository";
import { problemRepository } from "../../infrastructure/repositories/ProblemRepository";
import { RuleBasedEvaluator } from "../../infrastructure/evaluators/RuleBasedEvaluator";
import { AIEvaluator } from "../../infrastructure/evaluators/AIEvaluator";

export class EvaluationService {
  private ruleEvaluator: RuleBasedEvaluator;
  private aiEvaluator: AIEvaluator;

  constructor() {
    this.ruleEvaluator = new RuleBasedEvaluator();
    this.aiEvaluator = new AIEvaluator();
  }

  getEvaluator(preferredType?: EvaluatorType): Evaluator {
    const configMode = process.env.EVALUATOR_TYPE || "AUTO";
    const hasApiKey = Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== "");

    if (preferredType === "RULE_BASED" || configMode === "RULE_BASED") {
      return this.ruleEvaluator;
    }

    if (preferredType === "AI" || configMode === "AI") {
      if (hasApiKey) {
        return this.aiEvaluator;
      }
      // If AI is forced but no key exists, fallback to rule-based or throw
      if (configMode === "AI") {
        throw new Error("AI Evaluator is configured as required, but OPENAI_API_KEY is not set.");
      }
    }

    // AUTO mode: use AI if key exists, otherwise use RuleBased
    return hasApiKey ? this.aiEvaluator : this.ruleEvaluator;
  }

  async evaluateAttempt(
    attemptId: string,
    forcedEvaluator?: EvaluatorType
  ): Promise<EvaluationResult> {
    const attempt = await attemptRepository.findById(attemptId);
    if (!attempt) {
      throw new Error(`Attempt with id ${attemptId} not found.`);
    }

    if (!attempt.submission) {
      throw new Error(`Attempt ${attemptId} has no submitted solution to evaluate.`);
    }

    // Invariant check: Prevent duplicate concurrent evaluations
    if (attempt.status === "EVALUATING") {
      throw new Error(`Attempt ${attemptId} is currently being evaluated. Please wait.`);
    }

    const problem = await problemRepository.findById(attempt.problemId);
    if (!problem) {
      throw new Error(`Associated problem ${attempt.problemId} not found.`);
    }

    // 1. Mark as EVALUATING
    await attemptRepository.updateStatus(attemptId, "EVALUATING");

    try {
      const evaluator = this.getEvaluator(forcedEvaluator);
      console.log(`Evaluating attempt ${attemptId} using ${evaluator.type}...`);

      const result = await evaluator.evaluate(problem, attempt.submission.content);

      // 2. Persist evaluation and transition to COMPLETED
      await attemptRepository.saveEvaluation(attemptId, result);
      return result;
    } catch (err: any) {
      console.error(`Evaluation failed for attempt ${attemptId}:`, err);

      // Invariant: Never lose submission! Transition status to FAILED
      await attemptRepository.updateStatus(attemptId, "FAILED");
      throw new Error(
        `Evaluation failed: ${err.message || "Unknown error"}. Your submitted solution has been safely preserved.`
      );
    }
  }
}

export const evaluationService = new EvaluationService();
