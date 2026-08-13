"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { submitAssessmentAttemptAction, type AssessmentActionState } from "@/app/actions/assessment.actions";
import { AssessmentNavigation } from "@/components/learning/assessment-navigation";
import type { LearnerAttempt } from "@/services/assessment.service";

const initialState: AssessmentActionState = {};

export function QuestionRunner({ attempt }: { attempt: LearnerAttempt }) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [confirming, setConfirming] = useState(false);
  const [state, submitAction, pending] = useActionState(submitAssessmentAttemptAction, initialState);
  const current = attempt.questions[currentIndex];
  const answered = useMemo(() => attempt.questions.map((question) => answers[question.id] !== undefined), [answers, attempt.questions]);
  const unansweredCount = answered.filter((value) => !value).length;

  if (state.result) {
    router.replace(`/results/${state.result.attemptId}`);
  }

  function selectChoice(choiceId: string) {
    if (current.type === "MULTIPLE_CHOICE") {
      const previous = (answers[current.id] as { choiceIds?: string[] } | undefined)?.choiceIds ?? [];
      setAnswers({ ...answers, [current.id]: { choiceIds: previous.includes(choiceId) ? previous.filter((id) => id !== choiceId) : [...previous, choiceId] } });
      return;
    }
    setAnswers({ ...answers, [current.id]: { choiceId } });
  }

  function selectBoolean(value: boolean) {
    setAnswers({ ...answers, [current.id]: { value } });
  }

  function selectNumeric(value: string) {
    setAnswers({ ...answers, [current.id]: { value } });
  }

  return (
    <form action={submitAction} className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <input type="hidden" name="data" value={JSON.stringify({ attemptId: attempt.id, answers })} />
      <header className="border-b border-[var(--border)] pb-6">
        <p className="text-sm font-medium text-[var(--primary)]">{attempt.assessment.title}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">ข้อ {currentIndex + 1} จาก {attempt.questions.length}</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">{answered[currentIndex] ? "ตอบแล้ว" : "ยังไม่ตอบ"}</p>
      </header>
      <div className="mt-6 hidden md:block"><AssessmentNavigation currentIndex={currentIndex} answered={answered} onSelect={setCurrentIndex} /></div>
      <fieldset className="mt-8">
        <legend className="text-lg font-semibold leading-relaxed">{current.prompt}</legend>
        <div className="mt-6 space-y-3">
          {(current.type === "SINGLE_CHOICE" || current.type === "MULTIPLE_CHOICE") && current.choices.map((choice) => {
            const selected = current.type === "MULTIPLE_CHOICE"
              ? ((answers[current.id] as { choiceIds?: string[] } | undefined)?.choiceIds ?? []).includes(choice.id)
              : (answers[current.id] as { choiceId?: string } | undefined)?.choiceId === choice.id;
            return <label key={choice.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-[var(--border)] px-4 py-3 has-checked:border-[var(--primary)] has-checked:bg-[var(--surface-subtle)]"><input type={current.type === "MULTIPLE_CHOICE" ? "checkbox" : "radio"} name={`question-${current.id}`} checked={selected} onChange={() => selectChoice(choice.id)} className="size-4 accent-[var(--primary)]" /><span>{choice.text}</span></label>;
          })}
          {current.type === "TRUE_FALSE" && [true, false].map((value) => <label key={String(value)} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-[var(--border)] px-4 py-3 has-checked:border-[var(--primary)] has-checked:bg-[var(--surface-subtle)]"><input type="radio" name={`question-${current.id}`} checked={(answers[current.id] as { value?: boolean } | undefined)?.value === value} onChange={() => selectBoolean(value)} className="size-4 accent-[var(--primary)]" /><span>{value ? "จริง" : "เท็จ"}</span></label>)}
          {current.type === "NUMERIC" && <div><label htmlFor={`question-${current.id}`} className="text-sm font-medium">คำตอบตัวเลข</label><input id={`question-${current.id}`} inputMode="decimal" pattern="[+-]?[0-9]+(?:\\.[0-9]+)?" value={(answers[current.id] as { value?: string } | undefined)?.value ?? ""} onChange={(event) => selectNumeric(event.target.value)} className="mt-2 min-h-11 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" /></div>}
        </div>
      </fieldset>
      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-6">
        <button type="button" disabled={currentIndex === 0} onClick={() => setCurrentIndex(currentIndex - 1)} className="min-h-11 rounded-md border border-[var(--border)] px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60">ก่อนหน้า</button>
        {currentIndex < attempt.questions.length - 1 ? <button type="button" onClick={() => setCurrentIndex(currentIndex + 1)} className="min-h-11 rounded-md bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary-foreground)]">ถัดไป</button> : <button type="button" onClick={() => setConfirming(true)} className="min-h-11 rounded-md bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary-foreground)]">ส่งคำตอบ</button>}
      </div>
      {confirming ? <section role="dialog" aria-modal="true" aria-labelledby="submit-title" className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"><h2 id="submit-title" className="text-lg font-semibold">ยืนยันการส่งคำตอบ</h2><p className="mt-2 text-sm text-[var(--muted-foreground)]">ยังมี {unansweredCount} ข้อที่ยังไม่ได้ตอบ การส่งคำตอบจะไม่สามารถแก้ไขได้</p><div className="mt-5 flex flex-wrap gap-3"><button type="submit" disabled={pending} className="min-h-11 rounded-md bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary-foreground)] disabled:opacity-60">{pending ? "กำลังส่ง…" : "ยืนยันส่งคำตอบ"}</button><button type="button" disabled={pending} onClick={() => setConfirming(false)} className="min-h-11 rounded-md border border-[var(--border)] px-4 text-sm font-semibold">กลับไปตรวจคำตอบ</button></div></section> : null}
      {state.error ? <p role="alert" className="mt-4 text-sm text-[var(--danger)]">{state.error}</p> : null}
    </form>
  );
}
