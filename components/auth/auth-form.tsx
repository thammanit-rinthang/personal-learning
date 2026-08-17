"use client";

import { useActionState } from "react";
import type { AuthActionState } from "@/app/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";

type AuthFormProps = {
  mode: "login" | "register";
  action: (state: AuthActionState, formData: FormData) => Promise<AuthActionState>;
  returnTo?: string;
};

const initialState: AuthActionState = {};

export function AuthForm({ mode, action, returnTo }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const isRegister = mode === "register";

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
      {isRegister ? <FormField name="name" label="ชื่อที่แสดง" autoComplete="name" required /> : null}
      {isRegister ? <FormField name="username" label="ชื่อผู้ใช้" autoComplete="username" helpText="3-30 ตัว ใช้ a-z, 0-9, _ หรือ -" required /> : <FormField name="identifier" label="อีเมลหรือชื่อผู้ใช้" autoComplete="username" required />}
      {isRegister ? <FormField name="email" label="อีเมล" type="email" autoComplete="email" inputMode="email" required /> : null}
      <FormField name="password" label="รหัสผ่าน" type="password" autoComplete={isRegister ? "new-password" : "current-password"} helpText={isRegister ? "อย่างน้อย 8 ตัวอักษร" : undefined} required />
      {isRegister ? <FormField name="confirmPassword" label="ยืนยันรหัสผ่าน" type="password" autoComplete="new-password" required /> : null}
      {state.error ? <p className="rounded-md border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]" role="alert">{state.error}</p> : null}
      <Button className="w-full" type="submit" disabled={pending}>{pending ? "กำลังดำเนินการ…" : isRegister ? "สร้างบัญชี" : "เข้าสู่ระบบ"}</Button>
    </form>
  );
}
