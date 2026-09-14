export const DEFAULT_COOLDOWN_SECONDS = 3;

const lastUsedAt = new Map<string, number>();

/**
 * Checks whether a user is currently on cooldown for a command. If not,
 * records this usage as the new cooldown start. Returns the remaining
 * cooldown in seconds if the user must wait, or null if the call is allowed.
 */
export function checkCooldown(
  commandName: string,
  userId: string,
  cooldownSeconds: number,
): number | null {
  const key = `${commandName}:${userId}`;
  const now = Date.now();
  const expiresAt = lastUsedAt.get(key);

  if (expiresAt && expiresAt > now) {
    return Math.ceil((expiresAt - now) / 1000);
  }

  lastUsedAt.set(key, now + cooldownSeconds * 1000);
  return null;
}
