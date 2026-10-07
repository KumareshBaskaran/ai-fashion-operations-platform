import type { Metadata } from "next";
import "./globals.css";

import Sidebar from "./components/Sidebar";

export const metadata: Metadata = {
  title: "Fashion AI Operations",
  description: "AI-powered fashion operations platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-950">
        <div className="flex min-h-screen">
          <Sidebar />

          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}