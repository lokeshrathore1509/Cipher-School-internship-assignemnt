import { NextRequest, NextResponse } from "next/server";
import { evaluationService } from "@/application/services/EvaluationService";
import { practiceService } from "@/application/services/PracticeService";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { evaluatorType } = body;

    const evalResult = await evaluationService.evaluateAttempt(id, evaluatorType);
    const updatedAttempt = await practiceService.getAttempt(id);

    return NextResponse.json({
      success: true,
      message: "Evaluation completed",
      data: {
        evaluation: evalResult,
        attempt: updatedAttempt,
      },
    });
  } catch (error: any) {
    console.error("POST /api/attempts/[id]/evaluate error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Evaluation execution failed" },
      { status: 500 }
    );
  }
}
