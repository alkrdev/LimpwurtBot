import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { config } from "../config.js";

interface StoreData {
  /** guildId -> channelId that quoted messages are posted in. */
  quoteChannels: Record<string, string>;
}

const storePath = path.join(config.stateDir, "quotes.json");

function load(): StoreData {
  if (!existsSync(storePath)) {
    return { quoteChannels: {} };
  }
  return JSON.parse(readFileSync(storePath, "utf-8"));
}

function save(data: StoreData): void {
  mkdirSync(config.stateDir, { recursive: true });
  writeFileSync(storePath, JSON.stringify(data, null, 2));
}

export function getQuoteChannelId(guildId: string): string | undefined {
  return load().quoteChannels[guildId];
}

export function setQuoteChannelId(guildId: string, channelId: string): void {
  const data = load();
  data.quoteChannels[guildId] = channelId;
  save(data);
}
