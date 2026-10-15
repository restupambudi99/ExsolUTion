/** IDs come from the verified Sites request identity, never from a tool argument or email field. */
export function isStudioAdministrator(userId: string | null | undefined, environment: { STUDIO_ADMIN_USER_IDS?: string }) {
  if (!userId || !environment.STUDIO_ADMIN_USER_IDS) return false;
  return environment.STUDIO_ADMIN_USER_IDS.split(",").map((id) => id.trim()).filter(Boolean).includes(userId);
}
