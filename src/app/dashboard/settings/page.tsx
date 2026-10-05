"use client";

import { Button } from "@/components/ui/Button";
import { clearWorkspace, refreshWorkspace } from "@/lib/persistence";
import { useProjects } from "@/hooks/useProjects";
import { useState } from "react";

export default function SettingsPage() {
  const { projects, contents } = useProjects();
  const [status, setStatus] = useState<string | null>(null);

  function onClear() {
    clearWorkspace();
    refreshWorkspace();
    setStatus("Local workspace cleared");
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">
          Settings
        </p>
        <h1 className="font-display text-4xl tracking-tight text-ink">
          Workspace preferences
        </h1>
        <p className="max-w-2xl text-base text-muted">
          CreatorForge stores projects and saves in your browser. Generation uses
          the server-side `AI_PROVIDER` setting (`mock` or `openai`).
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[14px] border border-line bg-bg-elevated p-5">
          <p className="text-sm text-muted">Projects</p>
          <p className="mt-2 font-display text-3xl text-ink">{projects.length}</p>
        </div>
        <div className="rounded-[14px] border border-line bg-bg-elevated p-5">
          <p className="text-sm text-muted">Saved items</p>
          <p className="mt-2 font-display text-3xl text-ink">{contents.length}</p>
        </div>
      </section>

      <section className="space-y-3 rounded-[14px] border border-line bg-bg-elevated p-5">
        <h2 className="font-display text-2xl text-ink">Danger zone</h2>
        <p className="text-sm text-muted">
          Clearing the workspace removes all local projects and saved content.
          This cannot be undone.
        </p>
        <Button variant="danger" onClick={onClear}>
          Clear local workspace
        </Button>
        {status ? <p className="text-sm text-muted">{status}</p> : null}
      </section>
    </div>
  );
}
