"use client";

export function AssessmentNavigation({ currentIndex, answered, onSelect }: { currentIndex: number; answered: boolean[]; onSelect: (index: number) => void }) {
  return (
    <nav aria-label="รายการข้อคำถาม" className="flex flex-wrap gap-2">
      {answered.map((isAnswered, index) => (
        <button
          key={index}
          type="button"
          aria-current={currentIndex === index ? "step" : undefined}
          onClick={() => onSelect(index)}
          className={`min-h-11 min-w-11 rounded-md border px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${currentIndex === index ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]" : "border-[var(--border)] bg-[var(--surface)]"}`}
        >
          {index + 1}<span className="sr-only"> {isAnswered ? "ตอบแล้ว" : "ยังไม่ตอบ"}</span>
        </button>
      ))}
    </nav>
  );
}
