export function getAdminIds() {
  const raw = process.env.ADMIN_TG_IDS || "";
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => Number(id))
    .filter((id) => !Number.isNaN(id));
}

export function isAdmin(userId?: number | null) {
  if (!userId) return false;
  const admins = getAdminIds();
  return admins.includes(userId);
}
