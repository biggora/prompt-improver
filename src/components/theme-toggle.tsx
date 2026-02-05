"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-xl bg-slate-800/50 border border-slate-700 animate-pulse" />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 bg-white/5 border border-slate-200/20 text-slate-400 hover:text-white hover:bg-white/10 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700 shadow-sm"
      aria-label="Toggle Theme"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun
          size={20}
          className="transition-all transform rotate-0 scale-100"
        />
      ) : (
        <Moon
          size={20}
          className="transition-all transform rotate-0 scale-100"
        />
      )}
    </button>
  );
}
