import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal Learning OS",
  description: "A trust-first learning platform and editorial workspace",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
