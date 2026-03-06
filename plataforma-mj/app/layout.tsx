import type { Metadata } from "next";
import { Toaster } from "sonner";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeWell RMS",
  description: "Rental Management System — MJ Newell Homes",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased bg-background text-foreground">
        <ThemeProvider>
          <QueryProvider>
            {children}
            <Toaster
              position="top-right"
              richColors
              expand
              toastOptions={{
                duration: 4000,
                classNames: {
                  toast:       "!font-sans",
                  title:       "!font-medium",
                  description: "!text-sm",
                },
              }}
            />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
