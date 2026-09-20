import type { Client } from "discord.js";
import { ChannelType } from "discord.js";
import { config } from "../config.js";
import { creators, youtubeHandleFor } from "../creators.js";
import { getAllAnnouncementChannelIds, getCreatorState, setCreatorState } from "./store.js";
import { fetchLatestVideos, resolveUploadsPlaylistId, type VideoSummary } from "./youtube.js";

function isToday(isoDate: string): boolean {
  const now = new Date();
  const published = new Date(isoDate);
  return (
    published.getUTCFullYear() === now.getUTCFullYear() &&
    published.getUTCMonth() === now.getUTCMonth() &&
    published.getUTCDate() === now.getUTCDate()
  );
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

  const latestVideos = await fetchLatestVideos(apiKey, uploadsPlaylistId, 5);
  if (latestVideos.length === 0) {
    setCreatorState(creator.name, { ...state, uploadsPlaylistId, initialized: true });
    return;
  }

  if (!state.initialized) {
    // First time seeing this creator: record the current newest video as the
    // baseline without announcing anything, so we never dump their back-catalog.
    setCreatorState(creator.name, {
      uploadsPlaylistId,
      lastVideoId: latestVideos[0].videoId,
      initialized: true,
    });
    return;
  }

  const newVideos: VideoSummary[] = [];
  for (const video of latestVideos) {
    if (video.videoId === state.lastVideoId) break;
    newVideos.push(video);
  }
  newVideos.reverse(); // oldest of the new batch first, so announcements post in upload order

  for (const video of newVideos) {
    if (!isToday(video.publishedAt)) continue; // skip anything not published today

    const videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
    const message = `${creator.name} just posted a new video: ${videoUrl}`;

    for (const channelId of getAllAnnouncementChannelIds()) {
      const channel = await client.channels.fetch(channelId).catch(() => null);
      if (channel?.type === ChannelType.GuildText) {
        await channel.send(message).catch((error) => {
          console.error(`Failed to send upload announcement to channel ${channelId}:`, error);
        });
      }
    }
  }

  setCreatorState(creator.name, { uploadsPlaylistId, lastVideoId: latestVideos[0].videoId, initialized: true });
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
