import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getAvailableTools, tools } from "@/data/tools";

export const metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  const available = getAvailableTools();

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
          Jump into a generator, save outputs into projects, and keep your
          publish queue organized.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[14px] border border-line bg-bg-elevated p-5 shadow-[var(--shadow)]">
          <p className="text-sm text-muted">Available tools</p>
          <p className="mt-2 font-display text-3xl text-ink">{available.length}</p>
        </div>
        <div className="rounded-[14px] border border-line bg-bg-elevated p-5 shadow-[var(--shadow)]">
          <p className="text-sm text-muted">Coming soon</p>
          <p className="mt-2 font-display text-3xl text-ink">
            {tools.length - available.length}
          </p>
        </div>
        <div className="rounded-[14px] border border-line bg-bg-elevated p-5 shadow-[var(--shadow)]">
          <p className="text-sm text-muted">Local saves</p>
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

        <div className="grid gap-3 md:grid-cols-3">
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
    </div>
  );
}
