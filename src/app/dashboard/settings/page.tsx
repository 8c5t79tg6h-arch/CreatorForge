"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getToolHrefForKind } from "@/data/tools";
import { useProjects } from "@/hooks/useProjects";
import {
  clearWorkspace,
  getWorkspaceSnapshot,
  migrateWorkspace,
  refreshWorkspace,
  replaceWorkspace,
  type WorkspaceSnapshot,
} from "@/lib/persistence";

export default function SettingsPage() {
  const { projects, contents } = useProjects();
  const [status, setStatus] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const unassigned = contents.filter((item) => item.projectId === null);

  function onClear() {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "Clear all local projects and saved content? This cannot be undone.",
      )
    ) {
      return;
    }
    clearWorkspace();
    refreshWorkspace();
    setStatus("Local workspace cleared");
  }

  function onExport() {
    const snapshot = getWorkspaceSnapshot();
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `creatorforge-workspace-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus("Exported workspace JSON");
  }

  async function onImport(file: File | null) {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const snapshot: WorkspaceSnapshot = migrateWorkspace(parsed);
      replaceWorkspace(snapshot);
      setStatus(
        `Imported ${snapshot.projects.length} projects and ${snapshot.contents.length} saves`,
      );
    } catch {
      setStatus("Import failed — choose a valid CreatorForge workspace JSON");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
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
        <h2 className="font-display text-2xl text-ink">Backup</h2>
        <p className="text-sm text-muted">
          Export a JSON backup of local projects and saves, or restore one on
          this device.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onExport}>
            Export workspace
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            Import workspace
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => onImport(e.target.files?.[0] ?? null)}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Unassigned saves</h2>
        {unassigned.length === 0 ? (
          <p className="text-sm text-muted">
            No unassigned saves. Choose a project when saving from a tool.
          </p>
        ) : (
          unassigned.map((content) => {
            const href = getToolHrefForKind(content.kind);
            return (
              <article
                key={content.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-line bg-bg-elevated p-4"
              >
                <div>
                  <h3 className="font-display text-lg text-ink">{content.title}</h3>
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
          })
        )}
      </section>

      <section className="space-y-3 rounded-[14px] border border-line bg-bg-elevated p-5">
        <h2 className="font-display text-2xl text-ink">Danger zone</h2>
        <p className="text-sm text-muted">
          Clearing the workspace removes all local projects and saved content.
          Export a backup first if you might need it.
        </p>
        <Button variant="danger" onClick={onClear}>
          Clear local workspace
        </Button>
        {status ? <p className="text-sm text-muted">{status}</p> : null}
      </section>
    </div>
  );
}
