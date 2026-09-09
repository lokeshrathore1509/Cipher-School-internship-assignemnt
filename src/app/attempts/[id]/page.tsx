import { notFound } from "next/navigation";
import { attemptRepository } from "@/infrastructure/repositories/AttemptRepository";
import AttemptReview from "@/components/feedback/AttemptReview";

export const dynamic = "force-dynamic";

export default async function AttemptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const attempt = await attemptRepository.findById(id);

  if (!attempt) {
    notFound();
  }

  return <AttemptReview attempt={attempt} />;
}
