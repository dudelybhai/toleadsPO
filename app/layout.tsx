import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Toleads PO Dashboard",
  description: "Interactive purchase and order dashboard for Toleads."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
