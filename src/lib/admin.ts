// Community moderators: emails listed in ADMIN_EMAILS (comma-separated) in the environment.
export function isAdmin(email: string): boolean {
  const list = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.toLowerCase());
}
