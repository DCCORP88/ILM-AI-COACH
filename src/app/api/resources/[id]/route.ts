import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getResource } from "@/lib/data";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await getCurrentUser();
  if (!u) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await params;
  const r = await getResource(u, id);
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = `# ${r.title}\n\n_Version ${r.versions[0]?.version ?? 1} · ${r.status}_\n\n${r.versions[0]?.content ?? ""}\n`;
  return new NextResponse(body, { headers: { "Content-Type": "text/markdown; charset=utf-8", "Content-Disposition": `attachment; filename="resource-${r.id}.md"` } });
}
