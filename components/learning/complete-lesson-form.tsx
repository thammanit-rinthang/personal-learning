"use client";

import { useActionState } from "react";
import { markLessonCompleteAction, type LearningActionState } from "@/app/actions/learning.actions";

const initialState: LearningActionState = {};

export function CompleteLessonForm({ lessonId, returnPath, completed }: { lessonId: string; returnPath: string; completed: boolean }) {
  const [state, action, pending] = useActionState(markLessonCompleteAction, initialState);

  if (completed) {
    return <p className="text-sm font-medium text-[var(--success)]">เรียนจบบทนี้แล้ว</p>;
  }

  return <form action={action}><input type="hidden" name="lessonId" value={lessonId} /><input type="hidden" name="returnPath" value={returnPath} /><button disabled={pending} className="min-h-11 rounded-md bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60">{pending ? "กำลังบันทึก…" : "ทำเครื่องหมายว่าเรียนจบ"}</button>{state.error ? <p role="alert" className="mt-2 text-sm text-[var(--danger)]">{state.error}</p> : null}{state.success ? <p role="status" className="mt-2 text-sm text-[var(--success)]">{state.success}</p> : null}</form>;
}
