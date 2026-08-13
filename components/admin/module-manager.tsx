"use client";

import { useState } from "react";
import { createModuleAction, reorderModulesAction, updateModuleAction } from "@/app/actions/course.actions";
import { createLessonDraftAction, reorderLessonsAction } from "@/app/actions/lesson.actions";

type ModuleItem = { id: string; title: string; description: string | null; position: number; lessons: Array<{ id: string; title: string; position: number; status: string }> };

export function ModuleManager({ courseId, modules }: { courseId: string; modules: ModuleItem[] }) {
  const [items, setItems] = useState(modules);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function move(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= items.length) return;
    const reordered = [...items];
    [reordered[index], reordered[next]] = [reordered[next], reordered[index]];
    setItems(reordered);
    const form = new FormData();
    reordered.forEach((item) => form.append("moduleIds", item.id));
    const result = await reorderModulesAction(courseId, form);
    if (!result.success) { setMessage(result.error ?? "ไม่สามารถบันทึกลำดับได้"); setItems(modules); } else setMessage("บันทึกลำดับ Module แล้ว");
  }

  async function createModule(formData: FormData) {
    setPending(true); setMessage("");
    const result = await createModuleAction(formData);
    setPending(false); setMessage(result.success ? "สร้าง Module แล้ว" : result.error ?? "ไม่สามารถสร้าง Module ได้");
    if (result.success) window.location.reload();
  }

  async function createLesson(formData: FormData) {
    setPending(true); setMessage("");
    const result = await createLessonDraftAction(formData);
    setPending(false); setMessage(result.success ? "สร้างบทเรียนฉบับร่างแล้ว" : result.error ?? "ไม่สามารถสร้างบทเรียนได้");
    if (result.success) window.location.reload();
  }

  async function updateModule(moduleId: string, formData: FormData) {
    setPending(true); setMessage("");
    const result = await updateModuleAction(moduleId, formData);
    setPending(false); setMessage(result.success ? "บันทึก Module แล้ว" : result.error ?? "ไม่สามารถบันทึก Module ได้");
  }

  async function moveLesson(moduleIndex: number, lessonIndex: number, direction: -1 | 1) {
    const lessons = [...items[moduleIndex].lessons];
    const next = lessonIndex + direction;
    if (next < 0 || next >= lessons.length) return;
    [lessons[lessonIndex], lessons[next]] = [lessons[next], lessons[lessonIndex]];
    const nextItems = items.map((item, index) => index === moduleIndex ? { ...item, lessons } : item);
    setItems(nextItems);
    const form = new FormData(); lessons.forEach((lesson) => form.append("lessonIds", lesson.id));
    const result = await reorderLessonsAction(items[moduleIndex].id, form);
    if (!result.success) { setMessage(result.error ?? "ไม่สามารถบันทึกลำดับบทเรียนได้"); setItems(items); } else setMessage("บันทึกลำดับบทเรียนแล้ว");
  }

  return <div className="space-y-6">
    {message ? <p role="status" className="border border-[var(--border)] bg-[var(--surface-subtle)] p-3 text-sm">{message}</p> : null}
    <form action={createModule} className="grid gap-3 border border-[var(--border)] bg-[var(--surface)] p-4 sm:grid-cols-2"><h3 className="sm:col-span-2 font-semibold">เพิ่ม Module ฉบับร่าง</h3><input name="courseId" type="hidden" value={courseId} readOnly /><input name="position" type="hidden" value={items.length} readOnly /><label className="grid gap-1 text-sm">ชื่อ Module<input name="title" required className="min-h-11 rounded-md border border-[var(--border)] px-3" /></label><label className="grid gap-1 text-sm">Slug<input name="slug" required pattern="[a-z0-9-]+" className="min-h-11 rounded-md border border-[var(--border)] px-3" /></label><label className="grid gap-1 text-sm sm:col-span-2">คำอธิบาย<textarea name="description" rows={2} className="rounded-md border border-[var(--border)] px-3 py-2" /></label><button disabled={pending} className="min-h-11 w-fit rounded-md bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary-foreground)] disabled:opacity-60">สร้าง Module</button></form>
    <ol className="space-y-4">{items.map((module, index) => <li key={module.id} className="border border-[var(--border)] bg-[var(--surface)] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">Module {index + 1}</p><h3 className="mt-1 font-semibold">{module.title}</h3>{module.description ? <p className="mt-1 text-sm text-[var(--muted-foreground)]">{module.description}</p> : null}</div><div className="flex gap-2"><button type="button" aria-label={`เลื่อน ${module.title} ขึ้น`} disabled={index === 0} onClick={() => move(index, -1)} className="min-h-11 rounded-md border border-[var(--border)] px-3 text-sm disabled:opacity-40">ขึ้น</button><button type="button" aria-label={`เลื่อน ${module.title} ลง`} disabled={index === items.length - 1} onClick={() => move(index, 1)} className="min-h-11 rounded-md border border-[var(--border)] px-3 text-sm disabled:opacity-40">ลง</button></div></div><form action={updateModule.bind(null, module.id)} className="mt-4 grid gap-3 border-t border-[var(--border)] pt-4 sm:grid-cols-2"><label className="grid gap-1 text-sm">ชื่อ Module<input name="title" required defaultValue={module.title} className="min-h-11 rounded-md border border-[var(--border)] px-3" /></label><label className="grid gap-1 text-sm">คำอธิบาย<input name="description" defaultValue={module.description ?? ""} className="min-h-11 rounded-md border border-[var(--border)] px-3" /></label><button disabled={pending} className="min-h-11 w-fit rounded-md border border-[var(--border)] px-4 text-sm font-semibold">บันทึก Module</button></form><ul className="mt-4 divide-y divide-[var(--border)] border-y border-[var(--border)]">{module.lessons.map((lesson, lessonIndex) => <li key={lesson.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><a href={`/admin/lessons/${lesson.id}`} className="text-sm font-medium hover:underline">{lesson.position + 1}. {lesson.title}</a><div className="flex items-center gap-2"><span className="text-xs text-[var(--muted-foreground)]">{lesson.status}</span><button type="button" aria-label={`เลื่อน ${lesson.title} ขึ้น`} disabled={lessonIndex === 0} onClick={() => moveLesson(index, lessonIndex, -1)} className="min-h-11 rounded-md border border-[var(--border)] px-2 text-xs disabled:opacity-40">ขึ้น</button><button type="button" aria-label={`เลื่อน ${lesson.title} ลง`} disabled={lessonIndex === module.lessons.length - 1} onClick={() => moveLesson(index, lessonIndex, 1)} className="min-h-11 rounded-md border border-[var(--border)] px-2 text-xs disabled:opacity-40">ลง</button></div></li>)}{!module.lessons.length ? <li className="py-3 text-sm text-[var(--muted-foreground)]">ยังไม่มีบทเรียน</li> : null}</ul><form action={createLesson} className="mt-4 grid gap-3 border-t border-[var(--border)] pt-4 sm:grid-cols-[1fr_1fr_auto]"><input name="moduleId" type="hidden" value={module.id} readOnly /><input name="position" type="hidden" value={module.lessons.length} readOnly /><input name="title" required placeholder="ชื่อบทเรียน" aria-label="ชื่อบทเรียน" className="min-h-11 rounded-md border border-[var(--border)] px-3" /><input name="slug" required pattern="[a-z0-9-]+" placeholder="lesson-slug" aria-label="Lesson slug" className="min-h-11 rounded-md border border-[var(--border)] px-3" /><button disabled={pending} className="min-h-11 rounded-md border border-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary)] disabled:opacity-60">เพิ่มบทเรียน</button></form></li>)}</ol>
  </div>;
}
