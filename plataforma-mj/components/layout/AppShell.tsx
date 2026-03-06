"use client";

import { Sidebar } from "./Sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </TooltipProvider>
  );
};
