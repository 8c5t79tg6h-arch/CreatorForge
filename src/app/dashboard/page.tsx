"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getAvailableTools, getToolHrefForKind } from "@/data/tools";
import { useProjects } from "@/hooks/useProjects";

export default function DashboardPage() {
  const available = getAvailableTools();
  const { contents } = useProjects();
  const recent = contents.slice(0, 5);

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">
          Overview
        </p>
        <h1 className="font-display text-4xl tracking-tight text-ink">
          Your creator workspace
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted">
          Jump into a generator, save outputs into projects, and keep recent
          work one click away.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[14px] border border-line bg-bg-elevated p-5 shadow-[var(--shadow)]">
          <p className="text-sm text-muted">Available tools</p>
          <p className="mt-2 font-display text-3xl text-ink">{available.length}</p>
        </div>
        <div className="rounded-[14px] border border-line bg-bg-elevated p-5 shadow-[var(--shadow)]">
          <p className="text-sm text-muted">Saved items</p>
          <p className="mt-2 font-display text-3xl text-ink">{contents.length}</p>
        </div>
        <div className="rounded-[14px] border border-line bg-bg-elevated p-5 shadow-[var(--shadow)]">
          <p className="text-sm text-muted">Storage</p>
          <p className="mt-2 font-display text-3xl text-ink">Browser</p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-ink">Quick start</h2>
            <p className="mt-1 text-sm text-muted">
              Open a tool and generate something useful in under a minute.
            </p>
          </div>
          <Link href="/dashboard/tools">
            <Button variant="secondary" size="sm">
              All tools
            </Button>
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {available.map((tool) => (
            <Link
              key={tool.slug}
              href={tool.href}
              className="rounded-[14px] border border-line bg-bg-elevated p-5 transition hover:border-accent/40 hover:shadow-[var(--shadow)]"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-lg text-ink">{tool.name}</h3>
                <Badge tone="accent">Available</Badge>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {tool.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-ink">Recent saves</h2>
            <p className="mt-1 text-sm text-muted">
              Local browser saves from your generators.
            </p>
          </div>
          <Link href="/dashboard/projects">
            <Button variant="secondary" size="sm">
              Projects
            </Button>
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="rounded-[14px] border border-line bg-bg-elevated p-5 text-sm text-muted">
            Nothing saved yet. Generate from a tool and hit Save.
          </p>
        ) : (
          <div className="space-y-3">
            {recent.map((content) => {
              const href = getToolHrefForKind(content.kind);
              return (
                <article
                  key={content.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-line bg-bg-elevated p-4"
                >
                  <div>
                    <h3 className="font-display text-lg text-ink">
                      {content.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted">
                      {new Date(content.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="warm">{content.kind}</Badge>
                    {href ? (
                      <Link href={href}>
                        <Button size="sm" variant="secondary">
                          Open tool
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
