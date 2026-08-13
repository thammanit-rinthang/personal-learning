import Link from "next/link";
import { registerAction } from "@/app/actions/auth.actions";
import { AuthForm } from "@/components/auth/auth-form";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-5 py-10">
      <section className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium text-[var(--primary)]">Personal Learning OS</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">สร้างบัญชี</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">เริ่มต้นเส้นทางการเรียนรู้ของคุณ</p>
        <div className="mt-7"><AuthForm mode="register" action={registerAction} /></div>
        <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">มีบัญชีอยู่แล้ว? <Link className="font-medium text-[var(--primary)] underline-offset-4 hover:underline" href="/login">เข้าสู่ระบบ</Link></p>
      </section>
    </main>
  );
}
