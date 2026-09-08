import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { ActivityBar } from "@/components/layout/ActivityBar";
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
  title: "CRM - 업무 기록",
  description: "개인 업무 기록 및 IDE 스타일 워크스페이스",
};

import { DetailHeaderProvider } from "@/components/layout/DetailHeaderContext";
import { AiAgentPanel } from "@/components/features/AiAgentPanel";

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [projects, people] = await Promise.all([
    listProjectOptions().catch(() => []),
    listPersonOptions().catch(() => []),
  ]);
  return (
    <html lang="ko" className={`${pretendard.variable} h-full`} suppressHydrationWarning>
      <body className="h-full overflow-hidden bg-background">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <DetailHeaderProvider>
            <div className="flex h-screen w-screen overflow-hidden">
              <ActivityBar />
              <main className="flex-1 h-full min-w-0 overflow-hidden flex flex-row">
                {children}
                <AiAgentPanel />
              </main>
            </div>
            <QuickAddTask projects={projects} people={people} />
            <Toaster position="bottom-center" />
          </DetailHeaderProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

