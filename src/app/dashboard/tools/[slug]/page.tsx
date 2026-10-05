import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getToolBySlug } from "@/data/tools";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  return {
    title: tool?.name ?? "Tool",
  };
}

export default async function ToolSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  if (tool.status === "available") {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Badge tone="soon">Coming soon</Badge>
      <h1 className="font-display text-4xl tracking-tight text-ink">
        {tool.name}
      </h1>
      <p className="text-base leading-relaxed text-muted">{tool.description}</p>
      <p className="rounded-[14px] border border-line bg-bg-elevated p-5 text-sm text-muted">
        This tool is on the roadmap. Explore available generators while we finish
        the next CreatorForge experience.
      </p>
      <Link href="/dashboard/tools">
        <Button variant="secondary">Back to tools</Button>
      </Link>
    </div>
  );
}
