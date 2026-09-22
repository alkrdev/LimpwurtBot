import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { config } from "../config.js";

interface CreatorUploadState {
  uploadsPlaylistId?: string;
  lastVideoId?: string;
  /** Today's announcement for this creator, which gets edited as more videos come out the same day. */
  today?: {
    /** UTC date (YYYY-MM-DD) this entry is for. */
    date: string;
    /** Videos included in the announcement, oldest first. */
    videoIds: string[];
    /** channelId -> messageId of the posted announcement. */
    messages: Record<string, string>;
  };
  /** True once we've established a baseline for this creator, so we never announce their entire back-catalog. */
  initialized: boolean;
}

interface StoreData {
  /** guildId -> channelId to post upload announcements in. */
  announcementChannels: Record<string, string>;
  /** creator name -> tracking state. */
  creators: Record<string, CreatorUploadState>;
}

const storePath = path.join(config.stateDir, "uploads.json");

function load(): StoreData {
  if (!existsSync(storePath)) {
    return { announcementChannels: {}, creators: {} };
  }
  return JSON.parse(readFileSync(storePath, "utf-8"));
}

function save(data: StoreData): void {
  mkdirSync(config.stateDir, { recursive: true });
  writeFileSync(storePath, JSON.stringify(data, null, 2));
}

export function getAnnouncementChannelId(guildId: string): string | undefined {
  return load().announcementChannels[guildId];
}

export function setAnnouncementChannelId(guildId: string, channelId: string): void {
  const data = load();
  data.announcementChannels[guildId] = channelId;
  save(data);
}

export function getAllAnnouncementChannelIds(): string[] {
  return Object.values(load().announcementChannels);
}

export function getCreatorState(creatorName: string): CreatorUploadState {
  return load().creators[creatorName] ?? { initialized: false };
}

export function setCreatorState(creatorName: string, state: CreatorUploadState): void {
  const data = load();
  data.creators[creatorName] = state;
  save(data);
}
