// Daily limit on AI coach requests per business (protects the Claude bill). COACH_DAILY_LIMIT, default 40.
import { db } from "./db";
import { coachMode } from "./coach";

export const dailyLimit = () => Math.max(1, Number(process.env.COACH_DAILY_LIMIT) || 40);

export async function usageToday(businessId: string) {
  return db.usageEvent.count({ where: { businessId, createdAt: { gte: new Date(Date.now() - 86400_000) } } });
}

/** Returns an error message if the business has used today's allowance (live mode only). */
export async function checkAllowance(businessId: string): Promise<string | null> {
  if (coachMode() !== "live") return null;
  const used = await usageToday(businessId);
  return used >= dailyLimit() ? `You've reached today's limit of ${dailyLimit()} coach requests. It resets over the next 24 hours. Your work is saved.` : null;
}

export async function recordUsage(businessId: string, kind: "chat" | "plan") {
  if (coachMode() !== "live") return;
  await db.usageEvent.create({ data: { businessId, kind } });
}
