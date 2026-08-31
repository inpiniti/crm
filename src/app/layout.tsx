import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Toaster } from "@/components/ui/sonner";
import { QuickAddTask } from "@/components/features/QuickAddTask";
import { listProjectOptions } from "@/infrastructure/supabase/repositories/projects";
import { listPersonOptions } from "@/infrastructure/supabase/repositories/people";

const pretendard = localFont({
  src: "../../public/fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});

export const metadata: Metadata = {
  title: "업무 기록",
  description: "개인 업무 기록",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [projects, people] = await Promise.all([
    listProjectOptions().catch(() => []),
    listPersonOptions().catch(() => []),
  ]);
  return (
    <html lang="ko" className={`${pretendard.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <Header />
          <main className="mx-auto w-full max-w-[1120px] px-4 pb-24 pt-6 sm:px-6 sm:pt-8">{children}</main>
          <QuickAddTask projects={projects} people={people} />
          <Toaster position="bottom-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
