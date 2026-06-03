import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "./ui/button";

interface ThemeToggleProps {
  className?: string;
  variant?: "default" | "icon";
}

export function ThemeToggle({ className, variant = "icon" }: ThemeToggleProps) {
  const { theme, toggleTheme, switchable } = useTheme();

  if (!switchable || !toggleTheme) return null;

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className={className}
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        {theme === "light" ? (
          <Moon className="size-4" />
        ) : (
          <Sun className="size-4" />
        )}
      </Button>
    );
  }

  // Switch-style toggle
  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex h-7 w-[52px] items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        theme === "dark"
          ? "bg-primary/20"
          : "bg-muted"
      } ${className || ""}`}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      <span
        className={`inline-flex size-5 items-center justify-center rounded-full bg-background shadow-sm transition-transform duration-200 ${
          theme === "dark" ? "translate-x-[26px]" : "translate-x-1"
        }`}
      >
        {theme === "light" ? (
          <Sun className="size-3 text-amber-500" />
        ) : (
          <Moon className="size-3 text-indigo-400" />
        )}
      </span>
    </button>
  );
}
