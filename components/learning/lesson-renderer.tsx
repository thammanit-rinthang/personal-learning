import type { ReactNode } from "react";
import { BookOpen, Lightbulb, Quote } from "lucide-react";

type LessonBlock = {
  id: string;
  type: string;
  contentMarkdown: string | null;
  data: unknown;
};

function renderText(content: string | null): ReactNode {
  if (!content) {
    return null;
  }

  return content.split("\n").map((line, index) => <p key={`${line}-${index}`} className="mt-4 first:mt-0">{line}</p>);
}

export function LessonRenderer({ blocks }: { blocks: LessonBlock[] }) {
  return (
    <div className="text-[1.0625rem] leading-8 text-[var(--foreground)]">
      {blocks.map((block) => {
        if (block.type === "HEADING") {
          return <h2 key={block.id} className="mt-10 text-2xl font-semibold tracking-tight first:mt-0">{block.contentMarkdown?.replace(/^#+\s*/, "")}</h2>;
        }

        if (block.type === "CALLOUT") {
          return <aside key={block.id} className="mt-6 border-l-4 border-[var(--primary)] bg-[var(--surface-subtle)] px-5 py-4" aria-label="ข้อควรทราบ"><div className="flex gap-3"><Lightbulb aria-hidden="true" className="mt-1 size-5 shrink-0 text-[var(--primary)]" /><div>{renderText(block.contentMarkdown)}</div></div></aside>;
        }

        if (block.type === "EXAMPLE") {
          return <section key={block.id} className="mt-6 border border-[var(--border)] bg-[var(--surface-subtle)] p-5"><div className="flex gap-3"><Quote aria-hidden="true" className="mt-1 size-5 shrink-0 text-[var(--primary)]" /><div><h3 className="font-semibold">ตัวอย่าง</h3><div className="mt-2">{renderText(block.contentMarkdown)}</div></div></div></section>;
        }

        if (block.type === "REFERENCE") {
          return <aside key={block.id} className="mt-6 border-y border-[var(--border)] py-4 text-sm text-[var(--muted-foreground)]"><div className="flex gap-2"><BookOpen aria-hidden="true" className="size-4 shrink-0" /><div>{renderText(block.contentMarkdown)}</div></div></aside>;
        }

        return <div key={block.id} className="mt-5">{renderText(block.contentMarkdown)}</div>;
      })}
    </div>
  );
}
