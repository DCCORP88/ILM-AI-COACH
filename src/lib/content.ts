import "server-only";
import fs from "node:fs";
import path from "node:path";

// Loads approved (or, in the prototype, draft) coaching content from the server-side coaching/ folder.
// Content is selected explicitly per request; it is never shipped to the browser.

type WorkflowEntry = { id: string; file: string; version: string; status: string; categories: string[]; keywords: string[] };
type Manifest = { core: { file: string; version: string; status: string }; workflows: WorkflowEntry[] };

const ROOT = path.join(process.cwd(), "coaching");

function allowed(status: string): boolean {
  const level = process.env.COACH_CONTENT_LEVEL ?? "approved";
  return status === "approved" || (level === "draft" && status === "draft");
}

function loadManifest(): Manifest {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "manifest.json"), "utf8"));
}

function readFile(rel: string): string {
  const full = path.join(ROOT, rel);
  if (!full.startsWith(ROOT)) throw new Error("Invalid content path");
  return fs.readFileSync(full, "utf8");
}

export type SelectedContent = { core: string | null; coreRef: string | null; workflows: { id: string; ref: string; text: string }[] };

/** Picks the core instructions plus up to 3 workflows relevant to the project category and message. */
export function selectContent(projectCategory: string, message: string): SelectedContent {
  const manifest = loadManifest();
  const core = allowed(manifest.core.status) ? readFile(manifest.core.file) : null;
  const text = message.toLowerCase();
  const scored = manifest.workflows
    .filter((w) => allowed(w.status))
    .map((w) => ({
      w,
      score: (w.categories.includes(projectCategory) ? 10 : 0) + w.keywords.filter((k) => text.includes(k)).length,
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  return {
    core,
    coreRef: core ? `${manifest.core.file} v${manifest.core.version} (${manifest.core.status})` : null,
    workflows: scored.map(({ w }) => ({ id: w.id, ref: `${w.file} v${w.version} (${w.status})`, text: readFile(w.file) })),
  };
}
