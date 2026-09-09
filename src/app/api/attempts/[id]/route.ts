import { NextRequest, NextResponse } from "next/server";
import { practiceService } from "@/application/services/PracticeService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const attempt = await practiceService.getAttempt(id);

    if (!attempt) {
      return NextResponse.json(
        { success: false, error: `Attempt with id '${id}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: attempt });
  } catch (error: any) {
    console.error("GET /api/attempts/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch attempt" },
      { status: 500 }
    );
  }
}

// PATCH: Save draft without submitting
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { payload } = body;

    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Submission payload is required" },
        { status: 400 }
      );
    }

    await practiceService.saveDraft(id, payload);
    return NextResponse.json({ success: true, message: "Draft saved successfully" });
  } catch (error: any) {
    console.error("PATCH /api/attempts/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save draft" },
      { status: 500 }
    );
  }
}

// POST: Submit solution and run evaluation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { payload, evaluatorType } = body;

    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Submission payload is required" },
        { status: 400 }
      );
    }

    const updatedAttempt = await practiceService.submitSolution(
      id,
      payload,
      evaluatorType
    );

    return NextResponse.json({
      success: true,
      message: "Solution submitted and evaluated successfully",
      data: updatedAttempt,
    });
  } catch (error: any) {
    console.error("POST /api/attempts/[id] error:", error);

    // Provide clear error message for validation or evaluation failure
    const isValidationError = error.name === "ZodError" || error.issues;
    const errorMessage = isValidationError
      ? "Validation failed: " + (error.issues?.[0]?.message || error.message)
      : error.message || "Submission failed";

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: isValidationError ? 422 : 500 }
    );
  }
}
