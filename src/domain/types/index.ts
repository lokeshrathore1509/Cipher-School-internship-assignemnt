export type AttemptStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "EVALUATING"
  | "COMPLETED"
  | "FAILED";

export type EvaluatorType = "RULE_BASED" | "AI";

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export type RubricDimensionKey =
  | "REQUIREMENT_UNDERSTANDING"
  | "CLASS_RESPONSIBILITIES"
  | "COUPLING_COHESION"
  | "ENCAPSULATION_INTERFACES"
  | "ABSTRACTION_DESIGN_PATTERNS"
  | "EXTENSIBILITY"
  | "EDGE_CASES_TESTABILITY"
  | "EXPLANATION_QUALITY";

export interface RubricDimensionMeta {
  key: RubricDimensionKey;
  label: string;
  weight: number; // For overall score calculation
  description: string;
  evaluationCriteria: string;
}

export interface StructuredSubmissionPayload {
  requirementsUnderstanding: string;
  assumptions: string;
  coreClasses: string;
  responsibilities: string;
  relationships: string;
  importantMethods: string;
  designPatterns: string;
  edgeCases: string;
  tradeOffs: string;
  solutionNotes?: string;
}

export interface CriterionResult {
  dimension: RubricDimensionKey;
  score: number; // 1 - 5
  evidence: string;
  concern: string;
  suggestion: string;
  confidence: ConfidenceLevel;
}

export interface EvaluationResult {
  overallScore: number; // 0 - 100
  evaluatorType: EvaluatorType;
  summary: string;
  topStrengths: string[];
  topImprovements: string[];
  criteria: CriterionResult[];
}

export interface ProblemEntity {
  id: string;
  slug: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD" | string;
  shortDescription: string;
  problemStatement: string;
  functionalRequirements: string[];
  assumptions: string[];
  constraints: string[];
  expectedDesignAreas: string[];
  sampleEdgeCases: string[];
  createdAt: Date;
}

export interface AttemptEntity {
  id: string;
  problemId: string;
  attemptNumber: number;
  status: AttemptStatus;
  createdAt: Date;
  updatedAt: Date;
  problem?: ProblemEntity;
  submission?: SubmissionEntity | null;
  evaluation?: EvaluationEntity | null;
}

export interface SubmissionEntity {
  id: string;
  attemptId: string;
  format: string;
  content: StructuredSubmissionPayload;
  createdAt: Date;
}

export interface EvaluationEntity {
  id: string;
  attemptId: string;
  overallScore: number;
  evaluatorType: EvaluatorType;
  summary: string;
  topStrengths: string[];
  topImprovements: string[];
  createdAt: Date;
  criteria: CriterionResult[];
}
