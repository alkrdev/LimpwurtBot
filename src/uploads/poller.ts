import type { Client } from "discord.js";
import { ChannelType } from "discord.js";
import { config } from "../config.js";
import { creators, youtubeHandleFor } from "../creators.js";
import { getAllAnnouncementChannelIds, getCreatorState, setCreatorState } from "./store.js";
import { fetchLatestVideos, resolveUploadsPlaylistId } from "./youtube.js";

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function isToday(isoDate: string): boolean {
  return typeof isoDate === "string" && isoDate.slice(0, 10) === todayUtc(); // upcoming streams have no publish date yet
}

function buildMessage(creatorName: string, videoIds: string[]): string {
  const urls = videoIds.map((id) => `https://www.youtube.com/watch?v=${id}`);
  if (urls.length === 1) return `${creatorName} just posted a new video: ${urls[0]}`;
  return `${creatorName} posted ${urls.length} new videos today:\n${urls.join("\n")}`;
}

async function checkCreator(client: Client, creator: (typeof creators)[number]): Promise<void> {
  const apiKey = config.youtubeApiKey;
  if (!apiKey) return;

  const handle = youtubeHandleFor(creator);
  if (!handle) return;

  const state = getCreatorState(creator.name);

  let uploadsPlaylistId = state.uploadsPlaylistId;
  if (!uploadsPlaylistId) {
    uploadsPlaylistId = await resolveUploadsPlaylistId(apiKey, handle);
    if (!uploadsPlaylistId) {
      console.warn(`Could not resolve YouTube channel for ${creator.name} (@${handle})`);
      return;
    }
  }

  const latestVideos = await fetchLatestVideos(apiKey, uploadsPlaylistId, 10);
  const todaysIds = latestVideos
    .filter((video) => isToday(video.publishedAt))
    .map((video) => video.videoId)
    .reverse(); // oldest first, so the message lists them in upload order

  const date = todayUtc();

  if (!state.initialized || !state.today) {
    // First time seeing this creator (or first run of the daily-message format): treat whatever is
    // already out today as known, without posting, so we never dump their back-catalog or repeat
    // announcements the previous format already made.
    setCreatorState(creator.name, {
      uploadsPlaylistId,
      initialized: true,
      today: { date, videoIds: todaysIds, messages: {} },
    });
    return;
  }

  const today = state.today.date === date ? state.today : { date, videoIds: [], messages: {} };

  const hasNewVideo = todaysIds.some((id) => !today.videoIds.includes(id));
  // Rebuilding from the playlist each time means a video that gets deleted or privated (e.g. a
  // re-upload) drops out of the message on the next edit.
  const videoIds = todaysIds.filter((id) => today.videoIds.includes(id) || hasNewVideo);

  const listChanged =
    videoIds.length !== today.videoIds.length || videoIds.some((id, i) => id !== today.videoIds[i]);

  if (hasNewVideo || (listChanged && Object.keys(today.messages).length > 0 && videoIds.length > 0)) {
    const content = buildMessage(creator.name, videoIds);
    const messages: Record<string, string> = {};

    for (const channelId of getAllAnnouncementChannelIds()) {
      const channel = await client.channels.fetch(channelId).catch(() => null);
      if (channel?.type !== ChannelType.GuildText) continue;

      const existingId = today.messages[channelId];
      const edited = existingId
        ? await channel.messages.edit(existingId, content).catch(() => null)
        : null;

      if (edited) {
        messages[channelId] = edited.id;
        continue;
      }

      if (!hasNewVideo) continue; // don't repost a deleted announcement just because a video was removed

      const sent = await channel.send(content).catch((error) => {
        console.error(`Failed to send upload announcement to channel ${channelId}:`, error);
        return null;
      });
      if (sent) messages[channelId] = sent.id;
    }

    setCreatorState(creator.name, {
      uploadsPlaylistId,
      initialized: true,
      today: { date, videoIds, messages },
    });
    return;
  }

  setCreatorState(creator.name, {
    uploadsPlaylistId,
    initialized: true,
    today: { ...today, videoIds: listChanged ? videoIds : today.videoIds },
  });
}

async function checkAllCreators(client: Client): Promise<void> {
  for (const creator of creators) {
    try {
      await checkCreator(client, creator);
    } catch (error) {
      console.error(`Failed checking uploads for ${creator.name}:`, error);
    }
  }
}

export function startUploadPolling(client: Client): void {
  if (!config.youtubeApiKey) {
    console.warn("YOUTUBE_API_KEY not set — upload announcements are disabled.");
    return;
  }

  void checkAllCreators(client);
  setInterval(() => void checkAllCreators(client), config.uploadPollIntervalMinutes * 60 * 1000);
}
