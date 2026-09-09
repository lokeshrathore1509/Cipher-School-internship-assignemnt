import { NextRequest, NextResponse } from "next/server";
import { problemService } from "@/application/services/ProblemService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const data = await problemService.getProblemBySlug(slug);

    if (!data) {
      return NextResponse.json(
        { success: false, error: `Problem with slug '${slug}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("GET /api/problems/[slug] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch problem" },
      { status: 500 }
    );
  }
}
