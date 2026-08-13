import Link from "next/link";
import type { LearnerAssessmentResult } from "@/services/assessment.service";

export function AssessmentResult({ result }: { result: LearnerAssessmentResult }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="border-b border-[var(--border)] pb-8">
        <p className="text-sm font-medium text-[var(--primary)]">ผลการประเมิน</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{result.assessmentTitle}</h1>
        <p className="mt-5 text-5xl font-semibold tabular-nums">{result.percentage}%</p>
        <p className="mt-3 text-[var(--muted-foreground)]">ได้ {result.score} คะแนน · {result.passed ? "ผ่านเกณฑ์ที่กำหนด" : "ยังไม่ผ่านเกณฑ์ในครั้งนี้"}</p>
      </header>
      <section className="mt-8" aria-labelledby="review-heading">
        <h2 id="review-heading" className="text-xl font-semibold">สรุปคำตอบ</h2>
        <ol className="mt-4 space-y-3">
          {result.questions.map((question) => <li key={question.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"><p className="text-sm font-medium">ข้อ {question.position + 1} · {question.isCorrect ? "ตอบถูก" : "ตอบไม่ถูก"}</p><p className="mt-2 leading-relaxed">{question.prompt}</p><p className="mt-2 text-sm text-[var(--muted-foreground)]">{question.pointsAwarded} / {question.points} คะแนน</p></li>)}
        </ol>
      </section>
      <div className="mt-8 flex flex-wrap gap-3"><Link href="/progress" className="inline-flex min-h-11 items-center rounded-md bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary-foreground)]">ดูความคืบหน้า</Link><Link href="/review/mistakes" className="inline-flex min-h-11 items-center rounded-md border border-[var(--border)] px-4 text-sm font-semibold">ทบทวนข้อที่พลาด</Link></div>
    </main>
  );
}
