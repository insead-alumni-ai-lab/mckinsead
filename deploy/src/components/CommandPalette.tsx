import { useQuery } from "convex/react";
import {
  BarChart3,
  Building2,
  Moon,
  Plus,
  Search,
  Settings,
  Shield,
  Sun,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/contexts/ThemeContext";
import { api } from "../../convex/_generated/api";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const engagements = useQuery(api.engagements.list) ?? [];

  // Register keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(prev => !prev);
        setQuery("");
        setSelectedIndex(0);
      }
      // Escape to close
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setSelectedIndex(0);
  }, []);

  // Build command list
  const commands: CommandItem[] = [
    // Navigation
    {
      id: "nav-dashboard",
      label: "Go to Dashboard",
      icon: <BarChart3 className="size-4" />,
      action: () => {
        navigate("/dashboard");
        close();
      },
      keywords: ["home", "main", "engagements"],
    },
    {
      id: "nav-settings",
      label: "Go to Settings",
      icon: <Settings className="size-4" />,
      action: () => {
        navigate("/settings");
        close();
      },
      keywords: ["preferences", "config", "api", "keys"],
    },
    {
      id: "nav-admin",
      label: "Go to Admin",
      icon: <Shield className="size-4" />,
      action: () => {
        navigate("/admin");
        close();
      },
      keywords: ["users", "platform", "manage"],
    },
    // Actions
    {
      id: "action-new",
      label: "New Engagement",
      description: "Create a new strategy engagement",
      icon: <Plus className="size-4" />,
      action: () => {
        navigate("/dashboard");
        close();
      },
      keywords: ["create", "start", "engagement"],
    },
    // Theme
    {
      id: "theme-toggle",
      label: theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
      icon:
        theme === "dark" ? (
          <Sun className="size-4" />
        ) : (
          <Moon className="size-4" />
        ),
      action: () => {
        toggleTheme?.();
        close();
      },
      keywords: ["theme", "dark", "light", "mode"],
    },
    // Engagements
    ...engagements
      .filter((eng: { archived?: boolean }) => !eng.archived)
      .map(
        (eng: {
          _id: string;
          company: string;
          industry: string;
          stage: string;
          progress: number;
          question?: string | null;
          archived?: boolean;
        }) => ({
          id: `eng-${eng._id}`,
          label: eng.company,
          description: `${eng.industry} — ${eng.stage} (${eng.progress}%)`,
          icon: <Building2 className="size-4" />,
          action: () => {
            navigate(`/engagement/${eng._id}`);
            close();
          },
          keywords: [eng.industry, eng.stage, eng.question ?? ""].filter(
            Boolean,
          ),
        }),
      ),
  ];

  // Filter commands
  const filtered = query.trim()
    ? commands.filter(cmd => {
        const q = query.toLowerCase();
        return (
          cmd.label.toLowerCase().includes(q) ||
          cmd.description?.toLowerCase().includes(q) ||
          cmd.keywords?.some(kw => kw.toLowerCase().includes(q))
        );
      })
    : commands;

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      filtered[selectedIndex].action();
    }
  };

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return (
    <Dialog
      open={open}
      onOpenChange={v => {
        if (!v) close();
      }}
    >
      <DialogContent
        className="sm:max-w-lg p-0 gap-0 overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="border-0 shadow-none focus-visible:ring-0 px-0 text-sm"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted rounded border">
            ESC
          </kbd>
        </div>
        <div className="max-h-[320px] overflow-y-auto py-2">
          {filtered.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No results found
            </div>
          )}
          {filtered.map((cmd, i) => (
            <button
              key={cmd.id}
              onClick={cmd.action}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                i === selectedIndex
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-muted"
              }`}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <span className="shrink-0 text-muted-foreground">{cmd.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{cmd.label}</div>
                {cmd.description && (
                  <div className="text-xs text-muted-foreground truncate">
                    {cmd.description}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
        <div className="border-t px-4 py-2 flex items-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-muted rounded border font-mono">
              ↑↓
            </kbd>{" "}
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-muted rounded border font-mono">
              ↵
            </kbd>{" "}
            select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-muted rounded border font-mono">
              esc
            </kbd>{" "}
            close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
