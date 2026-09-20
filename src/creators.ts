import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

export interface Creator {
  name: string;
  url: string;
  series: string[];
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const creatorsPath = path.join(__dirname, "data", "creators.json");

export const creators: Creator[] = JSON.parse(readFileSync(creatorsPath, "utf-8"));

/** Extracts the @handle from a "https://www.youtube.com/@Handle" URL, e.g. "VerfRS". */
export function youtubeHandleFor(creator: Creator): string | undefined {
  const match = creator.url.match(/youtube\.com\/@([^/?#]+)/i);
  return match?.[1];
}
