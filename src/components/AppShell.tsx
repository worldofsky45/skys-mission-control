"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import clsx from "clsx";

type NavKey =
  | "overview"
  | "paper"
  | "polymarket"
  | "ideas"
  | "roi"
  | "costs"
  | "memory"
  | "agents"
  | "health";

type AppShellProps = {
  active: NavKey;
  title: string;
  description: string;
  children: React.ReactNode;
  onRefresh?: () => void;
};

const navItems: Array<{ key: NavKey; label: string; href: string; utility: string }> = [
  { key: "overview", label: "Overview", href: "/", utility: "Daily command status" },
  { key: "paper", label: "Paper Trading", href: "/paper-trading", utility: "Positions and P&L" },
  { key: "polymarket", label: "Polymarket", href: "/polymarket", utility: "Prediction signals" },
  { key: "ideas", label: "Idea Engine", href: "/ideas", utility: "Approve and track" },
  { key: "roi", label: "ROI", href: "/roi", utility: "Returns by project" },
  { key: "costs", label: "Costs", href: "/costs", utility: "Budget tracking" },
  { key: "memory", label: "Memory", href: "/memory", utility: "Context hub" },
  { key: "agents", label: "Agents", href: "/agents", utility: "Sessions and tokens" },
  { key: "health", label: "Health", href: "/health", utility: "Pipeline checks" },
];

export function AppShell({ active, title, description, children, onRefresh }: AppShellProps) {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;

      if (isTyping) {
        return;
      }

      if (event.key.toLowerCase() === "r") {
        onRefresh?.();
      }

      if (event.key === "?") {
        setShortcutsOpen(true);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onRefresh]);

  return (
    <main className="min-h-screen bg-[#0b1020] px-4 py-6 text-slate-50 md:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold text-cyan-200">Local-only v1</p>
              <h1 className="mt-2 text-3xl font-semibold leading-tight md:text-4xl">{title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{description}</p>
            </div>
            <div className="flex gap-2">
              {onRefresh ? (
                <button
                  type="button"
                  onClick={onRefresh}
                  className="rounded border border-white/10 px-3 py-2 text-sm font-medium text-slate-200 hover:border-cyan-300/50"
                >
                  Refresh
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setShortcutsOpen(true)}
                className="rounded border border-white/10 px-3 py-2 text-sm font-medium text-slate-200 hover:border-cyan-300/50"
              >
                Shortcuts
              </button>
            </div>
          </div>

          <nav aria-label="Mission Control utility pages" className="grid gap-2 sm:grid-cols-2 xl:grid-cols-9">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={clsx(
                  "rounded-md border px-3 py-2 transition-colors",
                  active === item.key
                    ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-50"
                    : "border-white/10 bg-white/[0.04] text-slate-200 hover:border-white/30",
                )}
              >
                <span className="block text-sm font-semibold">{item.label}</span>
                <span className="mt-1 block text-xs text-slate-400">{item.utility}</span>
              </Link>
            ))}
          </nav>
        </header>

        {children}

        <footer className="border-t border-white/10 py-4 text-xs text-slate-500">
          Polling every 30 seconds. API routes own all workspace reads and writes.
        </footer>
      </div>

      {shortcutsOpen ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-md border border-white/10 bg-slate-950 p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-50">Keyboard Shortcuts</h2>
              <button
                type="button"
                onClick={() => setShortcutsOpen(false)}
                className="rounded border border-white/10 px-2 py-1 text-sm text-slate-300"
              >
                Close
              </button>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-300">Refresh current page</dt>
                <dd className="rounded border border-white/10 px-2 py-1 font-mono text-xs text-cyan-100">R</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-300">Open shortcuts</dt>
                <dd className="rounded border border-white/10 px-2 py-1 font-mono text-xs text-cyan-100">?</dd>
              </div>
            </dl>
          </div>
        </div>
      ) : null}
    </main>
  );
}
