"use client";

import { useState } from "react";
import { createAssessmentAction, updateAssessmentAction } from "@/app/actions/assessment.actions";

type TargetCourse = { id: string; title: string; modules: Array<{ id: string; title: string; lessons: Array<{ id: string; title: string }> }> };
type Existing = { id: string; courseId: string; slug: string; title: string; description: string | null; type: string; passingScore: number; randomizeOrder: boolean; trigger: string; isRequired: boolean; maxAttempts: number | null; triggerModuleId: string | null; triggerLessonId: string | null };

export function AssessmentForm({ courses, existing }: { courses: TargetCourse[]; existing?: Existing }) {
  const [courseId, setCourseId] = useState(existing?.courseId ?? courses[0]?.id ?? "");
  const [trigger, setTrigger] = useState(existing?.trigger ?? "MANUAL");
  const [state, setState] = useState<{ success?: boolean; error?: string } | null>(null);
  const [pending, setPending] = useState(false);
  const course = courses.find((item) => item.id === courseId);
  const submit = async (formData: FormData) => {
    setPending(true);
    const data = {
      courseId: String(formData.get("courseId")), slug: String(formData.get("slug")), title: String(formData.get("title")),
      description: String(formData.get("description") || "") || null, type: String(formData.get("type")),
      passingScore: Number(formData.get("passingScore")), randomizeOrder: formData.get("randomizeOrder") === "on",
      trigger, isRequired: formData.get("isRequired") === "on", maxAttempts: String(formData.get("maxAttempts") || "") ? Number(formData.get("maxAttempts")) : null,
      triggerModuleId: trigger === "MODULE_COMPLETED" ? String(formData.get("triggerModuleId") || "") || null : null,
      triggerLessonId: trigger === "LESSON_COMPLETED" ? String(formData.get("triggerLessonId") || "") || null : null,
    };
    const payload = new FormData(); payload.set("data", JSON.stringify(data));
    const result = existing ? await updateAssessmentAction(existing.id, payload) : await createAssessmentAction(payload);
    setState(result); setPending(false);
  };
  return <form action={submit} className="grid gap-5">
    <label className="grid gap-1.5 text-sm font-medium">หลักสูตร<select name="courseId" value={courseId} onChange={(event) => setCourseId(event.target.value)} required className="min-h-11 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3">{courses.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
    <label className="grid gap-1.5 text-sm font-medium">ชื่อแบบประเมิน<input name="title" required defaultValue={existing?.title} className="min-h-11 rounded-md border border-[var(--border)] px-3" /></label>
    <label className="grid gap-1.5 text-sm font-medium">Slug<input name="slug" required defaultValue={existing?.slug} className="min-h-11 rounded-md border border-[var(--border)] px-3" /></label>
    <label className="grid gap-1.5 text-sm font-medium">ประเภท<select name="type" defaultValue={existing?.type ?? "QUIZ"} className="min-h-11 rounded-md border border-[var(--border)] px-3">{["PRACTICE", "CONCEPT_CHECK", "QUIZ", "MASTERY_TEST", "MIDTERM", "FINAL_EXAM"].map((value) => <option key={value}>{value}</option>)}</select></label>
    <label className="grid gap-1.5 text-sm font-medium">จุดเริ่มข้อสอบ<select name="trigger" value={trigger} onChange={(event) => setTrigger(event.target.value)} className="min-h-11 rounded-md border border-[var(--border)] px-3"><option value="MANUAL">ผู้เรียนกดเริ่มเอง</option><option value="LESSON_COMPLETED">เมื่อจบบทเรียน</option><option value="MODULE_COMPLETED">เมื่อจบ Module / Section</option><option value="COURSE_COMPLETED">เมื่อจบทั้ง Course</option></select></label>
    {trigger === "MODULE_COMPLETED" ? <label className="grid gap-1.5 text-sm font-medium">Module<select name="triggerModuleId" defaultValue={existing?.triggerModuleId ?? ""} required className="min-h-11 rounded-md border border-[var(--border)] px-3"><option value="">เลือก Module</option>{course?.modules.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label> : null}
    {trigger === "LESSON_COMPLETED" ? <label className="grid gap-1.5 text-sm font-medium">บทเรียน<select name="triggerLessonId" defaultValue={existing?.triggerLessonId ?? ""} required className="min-h-11 rounded-md border border-[var(--border)] px-3"><option value="">เลือกบทเรียน</option>{course?.modules.flatMap((module) => module.lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{module.title} / {lesson.title}</option>))}</select></label> : null}
    <div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium">คะแนนผ่าน (%)<input name="passingScore" type="number" min="0" max="100" defaultValue={existing?.passingScore ?? 70} className="min-h-11 rounded-md border border-[var(--border)] px-3" /></label><label className="grid gap-1.5 text-sm font-medium">จำนวนครั้งสูงสุด<input name="maxAttempts" type="number" min="1" defaultValue={existing?.maxAttempts ?? ""} placeholder="ไม่จำกัด" className="min-h-11 rounded-md border border-[var(--border)] px-3" /></label></div>
    <label className="flex min-h-11 items-center gap-3 text-sm"><input name="isRequired" type="checkbox" defaultChecked={existing?.isRequired ?? false} className="size-4" />ต้องทำและต้องผ่านก่อนดำเนินการต่อ</label>
    <label className="flex min-h-11 items-center gap-3 text-sm"><input name="randomizeOrder" type="checkbox" defaultChecked={existing?.randomizeOrder ?? false} className="size-4" />สุ่มลำดับคำถาม</label>
    {state?.error ? <p role="alert" className="text-sm text-[var(--danger)]">{state.error}</p> : null}{state?.success ? <p role="status" className="text-sm text-[var(--success)]">บันทึกแบบประเมินแล้ว</p> : null}
    <button type="submit" disabled={pending} className="min-h-11 w-fit rounded-md bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary-foreground)] disabled:opacity-60">{pending ? "กำลังบันทึก…" : existing ? "บันทึกการตั้งค่า" : "สร้างแบบประเมิน"}</button>
  </form>;
}
