import { z } from "zod";
import { Evaluator } from "../../domain/evaluators/Evaluator.interface";
import {
  CriterionResult,
  EvaluationResult,
  ProblemEntity,
  RubricDimensionKey,
  StructuredSubmissionPayload,
} from "../../domain/types";
import { RUBRIC_DIMENSIONS, RUBRIC_DIMENSION_KEYS } from "../../domain/rubric/rubric.definition";

const aiEvaluationSchema = z.object({
  overallScore: z.number().min(0).max(100),
  summary: z.string().min(10),
  topStrengths: z.array(z.string()).min(1),
  topImprovements: z.array(z.string()).min(1),
  criteria: z.array(
    z.object({
      dimension: z.string(),
      score: z.number().min(1).max(5),
      evidence: z.string().min(5),
      concern: z.string().min(5),
      suggestion: z.string().min(5),
      confidence: z.enum(["HIGH", "MEDIUM", "LOW"]).default("HIGH"),
    })
  ),
});

export class AIEvaluator implements Evaluator {
  readonly type = "AI" as const;
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(apiKey?: string, model?: string, baseUrl?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || "";
    this.model = model || process.env.OPENAI_MODEL || "gpt-4o-mini";
    this.baseUrl = baseUrl || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  }

  async evaluate(
    problem: ProblemEntity,
    submission: StructuredSubmissionPayload
  ): Promise<EvaluationResult> {
    if (!this.apiKey) {
      throw new Error("Cannot run AIEvaluator: OPENAI_API_KEY is not configured.");
    }

    const systemPrompt = `You are a Principal Software Architect and elite Low-Level Design (LLD) interviewer.
You are evaluating a software engineer's object-oriented low-level design submission.

Your goal is to provide deep, constructive, and explainable feedback across 8 strict rubric dimensions.
Do NOT compare the candidate solely against one canonical solution; evaluate the validity, decoupling, responsibilities, abstractions, and trade-offs of their particular design.

You MUST score all 8 dimensions on a 1-5 scale:
${RUBRIC_DIMENSION_KEYS.map((k) => `- ${k}: ${RUBRIC_DIMENSIONS[k].label} (${RUBRIC_DIMENSIONS[k].evaluationCriteria})`).join("\n")}

For EACH criterion, you MUST provide:
- score: integer between 1 and 5
- evidence: direct quotes or explicit references to classes/methods/patterns from their submission
- concern: specific architectural risk, code smell, or violation (e.g. Single Responsibility violation, tight coupling, missing abstraction)
- suggestion: concrete, actionable advice on how to improve the design
- confidence: "HIGH", "MEDIUM", or "LOW"

Return ONLY a JSON object with this exact structure:
{
  "overallScore": <integer 0-100>,
  "summary": "<2-3 sentence executive review>",
  "topStrengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "topImprovements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "criteria": [
    {
      "dimension": "<One of the 8 dimension keys>",
      "score": <1-5>,
      "evidence": "<specific evidence from submission>",
      "concern": "<design concern or smell>",
      "suggestion": "<actionable fix>",
      "confidence": "HIGH"
    }
    // All 8 dimensions MUST be present
  ]
}`;

    const userPrompt = `=== PROBLEM STATEMENT ===
Title: ${problem.title}
Difficulty: ${problem.difficulty}
Statement: ${problem.problemStatement}

Functional Requirements:
${problem.functionalRequirements.map((r, i) => `${i + 1}. ${r}`).join("\n")}

Assumptions & Constraints:
${problem.constraints.concat(problem.assumptions).join("\n")}

Expected Design Areas:
${problem.expectedDesignAreas.join("\n")}

=== CANDIDATE SUBMISSION ===
A. Requirements Understanding:
${submission.requirementsUnderstanding}

B. Assumptions:
${submission.assumptions}

C. Core Classes & Interfaces:
${submission.coreClasses}

D. Responsibilities (SRP):
${submission.responsibilities}

E. Relationships (Inheritance / Composition):
${submission.relationships}

F. Important Methods & Contracts:
${submission.importantMethods}

G. Design Patterns & Abstractions:
${submission.designPatterns}

H. Edge Cases & Concurrency:
${submission.edgeCases}

I. Trade-offs & Design Decisions:
${submission.tradeOffs}

Additional Notes:
${submission.solutionNotes || "None"}

Please evaluate this submission thoroughly and return the JSON response.`;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI evaluation request failed (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("AI evaluation returned empty response body.");
    }

    let parsedJson;
    try {
      parsedJson = JSON.parse(content);
    } catch (e) {
      throw new Error("Failed to parse AI evaluation JSON response.");
    }

    const validated = aiEvaluationSchema.parse(parsedJson);

    // Map and sanitize criteria to ensure all 8 dimensions are present
    const criteriaMap = new Map<string, CriterionResult>();
    for (const c of validated.criteria) {
      if (RUBRIC_DIMENSION_KEYS.includes(c.dimension as RubricDimensionKey)) {
        criteriaMap.set(c.dimension, {
          dimension: c.dimension as RubricDimensionKey,
          score: c.score,
          evidence: c.evidence,
          concern: c.concern,
          suggestion: c.suggestion,
          confidence: c.confidence,
        });
      }
    }

    // Ensure all 8 keys exist; fallback any missing
    const criteriaList: CriterionResult[] = RUBRIC_DIMENSION_KEYS.map((k) => {
      if (criteriaMap.has(k)) {
        return criteriaMap.get(k)!;
      }
      return {
        dimension: k,
        score: 3,
        evidence: "Evaluated from candidate submission overview.",
        concern: "Standard design patterns apply.",
        suggestion: "Review class relationships and contracts.",
        confidence: "MEDIUM",
      };
    });

    return {
      overallScore: validated.overallScore,
      evaluatorType: this.type,
      summary: validated.summary,
      topStrengths: validated.topStrengths,
      topImprovements: validated.topImprovements,
      criteria: criteriaList,
    };
  }
}
