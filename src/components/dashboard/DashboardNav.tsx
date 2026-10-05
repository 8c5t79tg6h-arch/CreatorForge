"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

const navItems = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/tools", label: "Tools" },
  { href: "/dashboard/projects", label: "Workspace" },
  { href: "/dashboard/settings", label: "Settings" },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-line bg-bg-elevated/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-display text-xl font-semibold text-ink">
            CreatorForge
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-[12px] px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-[var(--accent-soft)] text-accent"
                      : "text-muted hover:bg-[color-mix(in_srgb,var(--ink)_5%,transparent)] hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard/tools" className="hidden sm:block">
            <Button size="sm">New generation</Button>
          </Link>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-[12px] border border-line px-3 py-2 text-sm font-semibold text-ink md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((value) => !value)}
          >
            Menu
          </button>
        </div>
      </div>

      {open ? (
        <nav
          id="mobile-nav"
          className="border-t border-line px-4 py-3 md:hidden"
        >
          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-[12px] px-3 py-2.5 text-sm font-semibold ${
                    active
                      ? "bg-[var(--accent-soft)] text-accent"
                      : "text-muted hover:bg-[color-mix(in_srgb,var(--ink)_5%,transparent)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
