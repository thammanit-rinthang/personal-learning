import Link from "next/link";
import { requireCurrentActor } from "@/server/auth";
import { getCommonMistakes } from "@/services/mastery.service";

export default async function MistakesPage() {
  const actor = await requireCurrentActor();
  const mistakes = await getCommonMistakes(actor, actor.id);
  return <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12"><header><p className="text-sm font-medium text-[var(--primary)]">พื้นที่ทบทวน</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">ข้อที่อยากกลับมาดูอีกครั้ง</h1><p className="mt-3 max-w-2xl text-[var(--muted-foreground)]">ใช้รายการนี้เพื่อเลือกหัวข้อที่ต้องการฝึกเพิ่ม ไม่ใช่เพื่อวัดความสามารถของคุณ</p></header>{mistakes.length ? <ul className="mt-8 space-y-3">{mistakes.map((mistake) => <li key={mistake.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"><p className="font-semibold">{mistake.concept?.title ?? "คำถามที่ต้องการทบทวน"}</p>{mistake.question ? <p className="mt-2 leading-relaxed">{mistake.question.prompt}</p> : null}<p className="mt-3 text-sm text-[var(--muted-foreground)]">พบ {mistake.wrongCount} ครั้ง · ล่าสุด {mistake.lastSeenAt.toLocaleDateString("th-TH")}</p>{mistake.question ? <Link href="/progress" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]">ดูความคืบหน้าและเลือกฝึกต่อ</Link> : null}</li>)}</ul> : <section className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6"><h2 className="text-lg font-semibold">ยังไม่มีรายการทบทวน</h2><p className="mt-2 text-[var(--muted-foreground)]">เมื่อมีข้อที่ตอบไม่ถูก รายการสำหรับทบทวนจะปรากฏที่นี่</p></section>}</main>;
}
