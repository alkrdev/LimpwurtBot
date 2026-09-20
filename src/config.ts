import "dotenv/config";
import path from "node:path";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  discordToken: requireEnv("DISCORD_TOKEN"),
  clientId: requireEnv("CLIENT_ID"),
  // Comma-separated list of guild IDs to register commands to instantly
  // (e.g. production + a test server). Leave empty to register globally.
  guildIds: (process.env.GUILD_ID ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean),

  // Optional: enables the new-upload announcement feature when set.
  youtubeApiKey: process.env.YOUTUBE_API_KEY || undefined,
  uploadPollIntervalMinutes: Number(process.env.UPLOAD_POLL_INTERVAL_MINUTES) || 15,

  // Where persistent bot state (announcement channel, upload tracking) is
  // stored on disk. Point this at a mounted Railway Volume to survive
  // redeploys; otherwise it resets whenever the service restarts.
  stateDir: process.env.STATE_DIR || path.join(process.cwd(), "state"),
};
