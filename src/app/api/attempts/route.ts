import { NextRequest, NextResponse } from "next/server";
import { attemptRepository } from "@/infrastructure/repositories/AttemptRepository";
import { practiceService } from "@/application/services/PracticeService";

export async function GET() {
  try {
    const attempts = await attemptRepository.findAll();
    return NextResponse.json({ success: true, data: attempts });
  } catch (error: any) {
    console.error("GET /api/attempts error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch attempts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { problemSlug, isRetry } = body;

    if (!problemSlug) {
      return NextResponse.json(
        { success: false, error: "problemSlug is required" },
        { status: 400 }
      );
    }

    const attempt = isRetry
      ? await practiceService.retryProblem(problemSlug)
      : await practiceService.getOrCreateDraft(problemSlug);

    return NextResponse.json({ success: true, data: attempt }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/attempts error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to initialize attempt" },
      { status: 500 }
    );
  }
}
