import { prisma } from "../db/prisma";
import {
  AttemptEntity,
  AttemptStatus,
  EvaluationResult,
  StructuredSubmissionPayload,
} from "../../domain/types";

export class AttemptRepository {
  async getNextAttemptNumber(problemId: string): Promise<number> {
    const latest = await prisma.attempt.findFirst({
      where: { problemId },
      orderBy: { attemptNumber: "desc" },
      select: { attemptNumber: true },
    });
    return (latest?.attemptNumber || 0) + 1;
  }

  async createAttempt(
    problemId: string,
    initialStatus: AttemptStatus = "DRAFT"
  ): Promise<AttemptEntity> {
    const nextNumber = await this.getNextAttemptNumber(problemId);
    const created = await prisma.attempt.create({
      data: {
        problemId,
        attemptNumber: nextNumber,
        status: initialStatus,
      },
      include: {
        problem: true,
      },
    });

    return {
      id: created.id,
      problemId: created.problemId,
      attemptNumber: created.attemptNumber,
      status: created.status as AttemptStatus,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  async findById(id: string): Promise<AttemptEntity | null> {
    const row = await prisma.attempt.findUnique({
      where: { id },
      include: {
        problem: true,
        submission: true,
        evaluation: {
          include: {
            criteria: true,
          },
        },
      },
    });

    if (!row) return null;

    let submission = null;
    if (row.submission) {
      let content: StructuredSubmissionPayload;
      try {
        content = JSON.parse(row.submission.content);
      } catch {
        content = {
          requirementsUnderstanding: "",
          assumptions: "",
          coreClasses: "",
          responsibilities: "",
          relationships: "",
          importantMethods: "",
          designPatterns: "",
          edgeCases: "",
          tradeOffs: "",
          solutionNotes: row.submission.content,
        };
      }
      submission = {
        id: row.submission.id,
        attemptId: row.submission.attemptId,
        format: row.submission.format,
        content,
        createdAt: row.submission.createdAt,
      };
    }

    let evaluation = null;
    if (row.evaluation) {
      evaluation = {
        id: row.evaluation.id,
        attemptId: row.evaluation.attemptId,
        overallScore: row.evaluation.overallScore,
        evaluatorType: row.evaluation.evaluatorType as "RULE_BASED" | "AI",
        summary: row.evaluation.summary,
        topStrengths: JSON.parse(row.evaluation.topStrengths || "[]"),
        topImprovements: JSON.parse(row.evaluation.topImprovements || "[]"),
        createdAt: row.evaluation.createdAt,
        criteria: row.evaluation.criteria.map((c) => ({
          dimension: c.dimension as any,
          score: c.score,
          evidence: c.evidence,
          concern: c.concern,
          suggestion: c.suggestion,
          confidence: c.confidence as any,
        })),
      };
    }

    return {
      id: row.id,
      problemId: row.problemId,
      attemptNumber: row.attemptNumber,
      status: row.status as AttemptStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      problem: row.problem
        ? {
            id: row.problem.id,
            slug: row.problem.slug,
            title: row.problem.title,
            difficulty: row.problem.difficulty,
            shortDescription: row.problem.shortDescription,
            problemStatement: row.problem.problemStatement,
            functionalRequirements: JSON.parse(
              row.problem.functionalRequirements || "[]"
            ),
            assumptions: JSON.parse(row.problem.assumptions || "[]"),
            constraints: JSON.parse(row.problem.constraints || "[]"),
            expectedDesignAreas: JSON.parse(
              row.problem.expectedDesignAreas || "[]"
            ),
            sampleEdgeCases: JSON.parse(row.problem.sampleEdgeCases || "[]"),
            createdAt: row.problem.createdAt,
          }
        : undefined,
      submission,
      evaluation,
    };
  }

  async findByProblemId(problemId: string): Promise<AttemptEntity[]> {
    const rows = await prisma.attempt.findMany({
      where: { problemId },
      orderBy: { attemptNumber: "asc" },
      include: {
        evaluation: {
          select: {
            overallScore: true,
            evaluatorType: true,
            summary: true,
          },
        },
      },
    });

    return rows.map((r) => ({
      id: r.id,
      problemId: r.problemId,
      attemptNumber: r.attemptNumber,
      status: r.status as AttemptStatus,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      evaluation: r.evaluation
        ? {
            id: "",
            attemptId: r.id,
            overallScore: r.evaluation.overallScore,
            evaluatorType: r.evaluation.evaluatorType as any,
            summary: r.evaluation.summary,
            topStrengths: [],
            topImprovements: [],
            createdAt: r.createdAt,
            criteria: [],
          }
        : null,
    }));
  }

  async findAll(limit: number = 50): Promise<AttemptEntity[]> {
    const rows = await prisma.attempt.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        problem: true,
        evaluation: {
          select: {
            overallScore: true,
            evaluatorType: true,
            summary: true,
          },
        },
      },
    });

    return rows.map((r) => ({
      id: r.id,
      problemId: r.problemId,
      attemptNumber: r.attemptNumber,
      status: r.status as AttemptStatus,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      problem: r.problem
        ? {
            id: r.problem.id,
            slug: r.problem.slug,
            title: r.problem.title,
            difficulty: r.problem.difficulty,
            shortDescription: r.problem.shortDescription,
            problemStatement: r.problem.problemStatement,
            functionalRequirements: [],
            assumptions: [],
            constraints: [],
            expectedDesignAreas: [],
            sampleEdgeCases: [],
            createdAt: r.problem.createdAt,
          }
        : undefined,
      evaluation: r.evaluation
        ? {
            id: "",
            attemptId: r.id,
            overallScore: r.evaluation.overallScore,
            evaluatorType: r.evaluation.evaluatorType as any,
            summary: r.evaluation.summary,
            topStrengths: [],
            topImprovements: [],
            createdAt: r.createdAt,
            criteria: [],
          }
        : null,
    }));
  }

  async updateStatus(id: string, status: AttemptStatus): Promise<void> {
    await prisma.attempt.update({
      where: { id },
      data: { status },
    });
  }

  async saveOrUpdateSubmission(
    attemptId: string,
    payload: StructuredSubmissionPayload,
    format: string = "STRUCTURED_TEXT"
  ): Promise<void> {
    const content = JSON.stringify(payload);
    await prisma.submission.upsert({
      where: { attemptId },
      create: {
        attemptId,
        format,
        content,
      },
      update: {
        content,
        format,
      },
    });
  }

  async saveEvaluation(
    attemptId: string,
    evalResult: EvaluationResult
  ): Promise<void> {
    // Perform in transaction: delete prior evaluation if any, create new evaluation + criteria
    await prisma.$transaction(async (tx) => {
      // Check existing evaluation
      const existing = await tx.evaluation.findUnique({
        where: { attemptId },
      });

      if (existing) {
        await tx.evaluationCriterion.deleteMany({
          where: { evaluationId: existing.id },
        });
        await tx.evaluation.delete({
          where: { id: existing.id },
        });
      }

      const evaluation = await tx.evaluation.create({
        data: {
          attemptId,
          overallScore: Math.round(evalResult.overallScore),
          evaluatorType: evalResult.evaluatorType,
          summary: evalResult.summary,
          topStrengths: JSON.stringify(evalResult.topStrengths),
          topImprovements: JSON.stringify(evalResult.topImprovements),
        },
      });

      for (const criterion of evalResult.criteria) {
        await tx.evaluationCriterion.create({
          data: {
            evaluationId: evaluation.id,
            dimension: criterion.dimension,
            score: criterion.score,
            evidence: criterion.evidence,
            concern: criterion.concern,
            suggestion: criterion.suggestion,
            confidence: criterion.confidence,
          },
        });
      }

      await tx.attempt.update({
        where: { id: attemptId },
        data: { status: "COMPLETED" },
      });
    });
  }

  async getMetrics() {
    const totalAttempts = await prisma.attempt.count();
    const completedAttempts = await prisma.attempt.findMany({
      where: { status: "COMPLETED", evaluation: { isNot: null } },
      include: {
        evaluation: {
          select: { overallScore: true },
        },
      },
    });

    const distinctProblems = await prisma.attempt.findMany({
      distinct: ["problemId"],
      select: { problemId: true },
    });

    const averageScore =
      completedAttempts.length > 0
        ? Math.round(
            completedAttempts.reduce(
              (acc, curr) => acc + (curr.evaluation?.overallScore || 0),
              0
            ) / completedAttempts.length
          )
        : 0;

    return {
      totalAttempts,
      problemsPracticed: distinctProblems.length,
      averageScore,
    };
  }
}

export const attemptRepository = new AttemptRepository();
