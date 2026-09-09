import { NextResponse } from "next/server";
import { problemService } from "@/application/services/ProblemService";

export async function GET() {
  try {
    const problems = await problemService.getAllProblems();
    return NextResponse.json({ success: true, data: problems });
  } catch (error: any) {
    console.error("GET /api/problems error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch problems" },
      { status: 500 }
    );
  }
}
