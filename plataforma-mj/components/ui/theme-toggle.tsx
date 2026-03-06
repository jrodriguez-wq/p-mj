"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ThemeToggleProps {
  variant?: "icon" | "dropdown";
  size?: "sm" | "default";
}

export const ThemeToggle = ({ variant = "icon", size = "default" }: ThemeToggleProps) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
    }, 0);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-lg"
        aria-label="Toggle theme"
        disabled
      >
        <span className="inline-block h-4 w-4" aria-hidden />
      </Button>
    );
  }

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size={size === "sm" ? "icon" : "icon"}
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className="h-9 w-9 rounded-lg"
      >
        {isDark ? (
          <Sun className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Moon className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" aria-label="Toggle theme">
          {isDark ? (
            <Moon className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Sun className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          Light
          {theme === "light" && <span className="ml-auto text-xs text-primary">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
          {theme === "dark" && <span className="ml-auto text-xs text-primary">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          System
          {theme === "system" && <span className="ml-auto text-xs text-primary">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
