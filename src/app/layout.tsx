import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Store 137",
  description: "Мини-магазин смартфонов и гаджетов Store 137"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="min-h-screen">
        <div className="mx-auto w-full max-w-5xl px-4 py-6">
          {children}
        </div>
      </body>
    </html>
  );
}
