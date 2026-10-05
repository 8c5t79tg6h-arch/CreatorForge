import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { tools } from "@/data/tools";

export const metadata = {
  title: "Tools",
};

export default function ToolsPage() {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">
          Tools
        </p>
        <h1 className="font-display text-4xl tracking-tight text-ink">
          Generator catalog
        </h1>
        <p className="max-w-2xl text-base text-muted">
          Four generators for ideas, prompts, Roblox plans, and a full 30-day
          publishing calendar.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {tools.map((tool) => (
          <Link
            key={tool.slug}
            href={tool.href}
            className="rounded-[14px] border border-line bg-bg-elevated p-6 transition hover:border-accent/35 hover:shadow-[var(--shadow)]"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-2xl text-ink">{tool.name}</h2>
              <Badge tone={tool.status === "available" ? "accent" : "soon"}>
                {tool.status === "available" ? "Available" : "Soon"}
              </Badge>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {tool.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
