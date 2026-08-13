import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminShell } from "@/components/admin/admin-shell";

vi.mock("next/navigation", () => ({ usePathname: () => "/admin/questions" }));

describe("AdminShell", () => {
  it("groups navigation and opens the accessible mobile menu", async () => {
    render(<AdminShell><h1>เนื้อหา</h1></AdminShell>);
    expect(screen.getAllByText("เนื้อหา").length).toBeGreaterThan(0);
    await userEvent.click(screen.getByRole("button", { name: "เปิดเมนูผู้ดูแล" }));
    expect(screen.getAllByRole("navigation", { name: "เมนูผู้ดูแล" })).toHaveLength(2);
  });
});
