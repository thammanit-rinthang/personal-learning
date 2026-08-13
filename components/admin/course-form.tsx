"use client";

import { useState } from "react";
import { createCourseDraftAction, updateCourseAction } from "@/app/actions/course.actions";
import { FormField } from "@/components/ui/form-field";

type Result = { success: boolean; error?: string } | null;

export function CourseForm({ course, subjects }: { course?: { id: string; title: string; slug: string; description: string | null; subjectId: string }; subjects: Array<{ id: string; title: string }> }) {
  const [state, setState] = useState<Result>(null); const [pending, setPending] = useState(false);
  const submit = async (formData: FormData) => { setPending(true); const result = course ? await updateCourseAction(course.id, formData) : await createCourseDraftAction(formData); setState(result); setPending(false); };
  return <form action={submit} className="grid gap-5"><FormField name="title" label="ชื่อหลักสูตร" required defaultValue={course?.title} /><FormField name="slug" label="Slug สำหรับ URL" helpText="ใช้ตัวพิมพ์เล็ก ตัวเลข และขีดกลาง" required defaultValue={course?.slug} /><label className="grid gap-1.5 text-sm font-medium">สาขาวิชา<select name="subjectId" defaultValue={course?.subjectId} required className="min-h-11 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]">{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.title}</option>)}</select></label><label className="grid gap-1.5 text-sm font-medium">คำอธิบาย<textarea name="description" defaultValue={course?.description ?? ""} rows={4} className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" /></label>{state && !state.success ? <p role="alert" className="text-sm text-[var(--danger)]">{state.error}</p> : null}<button type="submit" disabled={pending} className="min-h-11 w-fit rounded-md bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary-foreground)] disabled:opacity-60">{pending ? "กำลังบันทึก…" : course ? "บันทึกฉบับร่าง" : "สร้างหลักสูตรฉบับร่าง"}</button></form>;
}
