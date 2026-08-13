import { NextRequest, NextResponse } from "next/server";
import { requireCurrentActor } from "@/server/auth";
import { updateCourseBySlug } from "@/services/course.service";
import { courseUpdateSchema } from "@/schemas/course.schema";
import { AppError } from "@/server/errors";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseSlug: string }> }
) {
  try {
    const actor = await requireCurrentActor();
    const resolvedParams = await params;

    const body = await request.json();
    const data = courseUpdateSchema.parse(body);
    const updated = await updateCourseBySlug(actor, resolvedParams.courseSlug, data);
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof AppError) {
      let status = 500;
      if (error.code === "UNAUTHORIZED") status = 401;
      if (error.code === "FORBIDDEN") status = 403;
      if (error.code === "NOT_FOUND") status = 404;
      if (error.code === "VALIDATION") status = 400;
      
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
