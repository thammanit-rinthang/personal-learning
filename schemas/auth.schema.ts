import { z } from "zod";

const passwordSchema = z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร").max(128, "รหัสผ่านยาวเกินไป");
const usernameSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9_-]{2,29}$/, "ชื่อผู้ใช้ต้องมี 3-30 ตัว ใช้ a-z, 0-9, _ หรือ -");

export const registerInputSchema = z.object({
  name: z.string().trim().min(2, "กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร").max(100, "ชื่อยาวเกินไป"),
  username: usernameSchema,
  email: z.string().trim().toLowerCase().email("กรุณากรอกอีเมลที่ถูกต้อง").max(320),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((input) => input.password === input.confirmPassword, {
  message: "รหัสผ่านไม่ตรงกัน",
  path: ["confirmPassword"],
});

export const loginInputSchema = z.object({
  identifier: z.string().trim().min(1, "กรุณากรอกอีเมลหรือชื่อผู้ใช้").max(320),
  password: passwordSchema,
});

export type RegisterInput = z.infer<typeof registerInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
