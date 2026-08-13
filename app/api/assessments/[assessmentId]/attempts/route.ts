import { NextRequest, NextResponse } from "next/server";
import { requireCurrentActor } from "@/server/auth";
import { startAssessmentAttempt } from "@/services/assessment.service";
import { AppError } from "@/server/errors";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  try {
    const actor = await requireCurrentActor();
    const resolvedParams = await params;
    
    const attempt = await startAssessmentAttempt(actor, { assessmentId: resolvedParams.assessmentId });
    return NextResponse.json(attempt, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      let status = 500;
      if (error.code === "UNAUTHORIZED") status = 401;
      if (error.code === "FORBIDDEN") status = 403;
      if (error.code === "NOT_FOUND") status = 404;
      if (error.code === "VALIDATION") status = 400;
      if (error.code === "CONFLICT") status = 409;
      
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
