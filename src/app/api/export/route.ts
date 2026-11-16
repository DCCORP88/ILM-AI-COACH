import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const u = await getCurrentUser();
  if (!u) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const b = { businessId: u.businessId };
  const [community, communityPosts, communityComments] = await Promise.all([
    db.communityMember.findUnique({ where: b }),
    db.communityPost.findMany({ where: b }),
    db.communityComment.findMany({ where: b }),
  ]);
  const [business, profile, projects, messages, tasks, decisions, resources, metrics, goals, checkIns, steps] = await Promise.all([
    db.business.findUnique({ where: { id: u.businessId }, select: { id: true, name: true, createdAt: true } }),
    db.businessProfile.findUnique({ where: b }),
    db.project.findMany({ where: b }),
    db.message.findMany({ where: b, orderBy: { createdAt: "asc" } }),
    db.task.findMany({ where: b }),
    db.decision.findMany({ where: b }),
    db.resource.findMany({ where: b, include: { versions: true } }),
    db.metricEntry.findMany({ where: b }),
    db.goal.findMany({ where: b }),
    db.checkIn.findMany({ where: b }),
    db.programStep.findMany({ where: b }),
  ]);
  const body = JSON.stringify({ exportedAt: new Date().toISOString(), account: { email: u.email }, business, profile, projects, messages, tasks, decisions, resources, metrics, goals, checkIns, programSteps: steps, community, communityPosts, communityComments }, null, 2);
  return new NextResponse(body, {
    headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="beauty-coach-export-${new Date().toISOString().slice(0, 10)}.json"` },
  });
}
