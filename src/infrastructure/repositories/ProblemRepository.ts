import { prisma } from "../db/prisma";
import { ProblemEntity } from "../../domain/types";
import { Problem as PrismaProblem } from "@prisma/client";

function toDomain(row: PrismaProblem): ProblemEntity {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    difficulty: row.difficulty,
    shortDescription: row.shortDescription,
    problemStatement: row.problemStatement,
    functionalRequirements: JSON.parse(row.functionalRequirements || "[]"),
    assumptions: JSON.parse(row.assumptions || "[]"),
    constraints: JSON.parse(row.constraints || "[]"),
    expectedDesignAreas: JSON.parse(row.expectedDesignAreas || "[]"),
    sampleEdgeCases: JSON.parse(row.sampleEdgeCases || "[]"),
    createdAt: row.createdAt,
  };
}

export class ProblemRepository {
  async findAll(): Promise<ProblemEntity[]> {
    const problems = await prisma.problem.findMany({
      orderBy: { createdAt: "asc" },
    });
    return problems.map(toDomain);
  }

  async findBySlug(slug: string): Promise<ProblemEntity | null> {
    const problem = await prisma.problem.findUnique({
      where: { slug },
    });
    if (!problem) return null;
    return toDomain(problem);
  }

  async findById(id: string): Promise<ProblemEntity | null> {
    const problem = await prisma.problem.findUnique({
      where: { id },
    });
    if (!problem) return null;
    return toDomain(problem);
  }
}

export const problemRepository = new ProblemRepository();
