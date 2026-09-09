import { notFound } from "next/navigation";
import { problemRepository } from "@/infrastructure/repositories/ProblemRepository";
import { practiceService } from "@/application/services/PracticeService";
import PracticeWorkspace from "@/components/practice/PracticeWorkspace";

export const dynamic = "force-dynamic";

export default async function PracticePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const problem = await problemRepository.findBySlug(slug);

  if (!problem) {
    notFound();
  }

  // Get existing draft or create a fresh attempt for this problem
  const attempt = await practiceService.getOrCreateDraft(slug);

  return <PracticeWorkspace problem={problem} attempt={attempt} />;
}
