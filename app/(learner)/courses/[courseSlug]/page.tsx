import { CourseOutline } from "@/components/learning/course-outline";
import { requireCurrentActor } from "@/server/auth";
import { getLearnerCourseOutline } from "@/services/learner.service";

export default async function CoursePage({ params }: { params: Promise<{ courseSlug: string }> }) {
  const { courseSlug } = await params;
  const actor = await requireCurrentActor();
  const course = await getLearnerCourseOutline(actor, courseSlug);

  return <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12"><header className="mb-8"><p className="text-sm font-medium text-[var(--primary)]">{course.subjectTitle}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{course.title}</h1>{course.description ? <p className="mt-3 max-w-2xl text-[var(--muted-foreground)]">{course.description}</p> : null}</header><CourseOutline course={course} /></main>;
}
