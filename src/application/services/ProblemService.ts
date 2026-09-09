import { ProblemEntity } from "../../domain/types";
import { attemptRepository } from "../../infrastructure/repositories/AttemptRepository";
import { problemRepository } from "../../infrastructure/repositories/ProblemRepository";

export interface ProblemWithAttempts extends ProblemEntity {
  attemptCount: number;
  bestScore: number | null;
  latestStatus: string | null;
}

export class ProblemService {
  async getAllProblems(): Promise<ProblemWithAttempts[]> {
    const problems = await problemRepository.findAll();

    const results: ProblemWithAttempts[] = [];
    for (const p of problems) {
      const attempts = await attemptRepository.findByProblemId(p.id);
      const scores = attempts
        .filter((a) => a.evaluation?.overallScore !== undefined)
        .map((a) => a.evaluation!.overallScore);

      const bestScore = scores.length > 0 ? Math.max(...scores) : null;
      const latestAttempt = attempts[attempts.length - 1];

      results.push({
        ...p,
        attemptCount: attempts.length,
        bestScore,
        latestStatus: latestAttempt ? latestAttempt.status : null,
      });
    }

    return results;
  }

  async getProblemBySlug(slug: string) {
    const problem = await problemRepository.findBySlug(slug);
    if (!problem) return null;

    const attempts = await attemptRepository.findByProblemId(problem.id);

    return {
      problem,
      attempts,
    };
  }

  async getDashboardData() {
    const metrics = await attemptRepository.getMetrics();
    const recentAttempts = await attemptRepository.findAll(6);
    const problems = await this.getAllProblems();

    return {
      metrics,
      recentAttempts,
      problems,
    };
  }
}

export const problemService = new ProblemService();
