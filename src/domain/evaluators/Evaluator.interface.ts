import {
  EvaluationResult,
  EvaluatorType,
  ProblemEntity,
  StructuredSubmissionPayload,
} from "../types";

export interface Evaluator {
  readonly type: EvaluatorType;
  evaluate(
    problem: ProblemEntity,
    submission: StructuredSubmissionPayload
  ): Promise<EvaluationResult>;
}
