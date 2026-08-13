import { SiteHeader } from "@/components/layout/site-header";

export default function LearnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[var(--background)]">
      <SiteHeader />
      {children}
    </div>
  );
}
