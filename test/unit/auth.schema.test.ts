import { describe, expect, it } from "vitest";
import { loginInputSchema, registerInputSchema } from "@/schemas/auth.schema";

describe("auth schemas", () => {
  it("rejects a short registration password", () => {
    expect(registerInputSchema.safeParse({ name: "Learner", username: "learner", email: "learner@example.com", password: "short", confirmPassword: "short" }).success).toBe(false);
  });

  it("rejects mismatched registration passwords", () => {
    expect(registerInputSchema.safeParse({ name: "Learner", username: "learner", email: "learner@example.com", password: "password1", confirmPassword: "different-password" }).success).toBe(false);
  });

  it("normalizes a registration username", () => {
    expect(registerInputSchema.parse({ name: "Learner", username: " LEARNER_01 ", email: "learner@example.com", password: "long-enough-password", confirmPassword: "long-enough-password" }).username).toBe("learner_01");
  });

  it("accepts a username or email as a login identifier", () => {
    expect(loginInputSchema.parse({ identifier: " learner_01 ", password: "long-enough-password" }).identifier).toBe("learner_01");
    expect(loginInputSchema.parse({ identifier: "LEARNER@EXAMPLE.COM", password: "long-enough-password" }).identifier).toBe("LEARNER@EXAMPLE.COM");
  });
});
