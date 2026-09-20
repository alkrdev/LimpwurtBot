const API_BASE = "https://www.googleapis.com/youtube/v3";

export interface VideoSummary {
  videoId: string;
  title: string;
  publishedAt: string;
}

/** Looks up the "uploads" playlist ID for a channel from its @handle. */
export async function resolveUploadsPlaylistId(
  apiKey: string,
  handle: string,
): Promise<string | undefined> {
  const url = new URL(`${API_BASE}/channels`);
  url.searchParams.set("part", "contentDetails");
  url.searchParams.set("forHandle", handle);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`YouTube API error resolving handle @${handle}: ${response.status}`);
  }

  const data = (await response.json()) as {
    items?: { contentDetails: { relatedPlaylists: { uploads: string } } }[];
  };

  return data.items?.[0]?.contentDetails.relatedPlaylists.uploads;
}

/** Fetches the most recent videos in a playlist, newest first. */
export async function fetchLatestVideos(
  apiKey: string,
  playlistId: string,
  maxResults = 5,
): Promise<VideoSummary[]> {
  const url = new URL(`${API_BASE}/playlistItems`);
  url.searchParams.set("part", "snippet,contentDetails");
  url.searchParams.set("playlistId", playlistId);
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("key", apiKey);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`YouTube API error fetching playlist ${playlistId}: ${response.status}`);
  }

  const data = (await response.json()) as {
    items?: {
      snippet: { title: string; resourceId: { videoId: string } };
      contentDetails: { videoPublishedAt: string };
    }[];
  };

  return (data.items ?? []).map((item) => ({
    videoId: item.snippet.resourceId.videoId,
    title: item.snippet.title,
    publishedAt: item.contentDetails.videoPublishedAt,
  }));
}
