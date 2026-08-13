import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Button } from "@/components/ui/button"
import { FormField } from "@/components/ui/form-field"
import { StatusBadge } from "@/components/ui/status-badge"
import * as React from "react"

describe("UI Primitives", () => {
  describe("Button", () => {
    it("renders disabled state correctly and prevents clicks", async () => {
      const handleClick = vi.fn()
      render(<Button disabled onClick={handleClick}>Click me</Button>)
      
      const button = screen.getByRole("button", { name: "Click me" })
      expect(button).toBeDisabled()
      
      await userEvent.click(button)
      expect(handleClick).not.toHaveBeenCalled()
    })

    it("has visible focus ring class", () => {
      render(<Button>Focus me</Button>)
      const button = screen.getByRole("button", { name: "Focus me" })
      expect(button.className).toContain("focus-visible:ring-[var(--focus-ring)]")
    })
  })

  describe("FormField", () => {
    it("connects label and error to input accessibility tree", () => {
      render(
        <FormField 
          label="Email" 
          error="Invalid email" 
          id="email-input" 
        />
      )
      
      const input = screen.getByLabelText("Email")
      expect(input).toHaveAttribute("aria-invalid", "true")
      
      const errorDesc = input.getAttribute("aria-describedby")
      expect(errorDesc).toBeTruthy()
      
      const errorMessage = document.getElementById(errorDesc!)
      expect(errorMessage).toHaveTextContent("Invalid email")
    })
  })

  describe("StatusBadge", () => {
    it("renders text and icon together", () => {
      const TestIcon = <svg data-testid="test-icon" />
      render(<StatusBadge icon={TestIcon}>Draft</StatusBadge>)
      
      expect(screen.getByText("Draft")).toBeInTheDocument()
      expect(screen.getByTestId("test-icon")).toBeInTheDocument()
    })
  })
})
