import { createListStore } from "./list-store.js";

export interface Creator {
  name: string;
  url: string;
  series: string[];
}

const store = createListStore<Creator>("creators.json");

export function getCreators(): Creator[] {
  return store.getAll();
}

export function findCreator(name: string): Creator | undefined {
  const needle = name.toLowerCase();
  return store.getAll().find((creator) => creator.name.toLowerCase() === needle);
}

/** Adds the creator, or replaces the existing one with the same name. */
export function saveCreator(creator: Creator): void {
  const creators = store.getAll();
  const index = creators.findIndex((existing) => existing.name.toLowerCase() === creator.name.toLowerCase());
  store.saveAll(
    index === -1 ? [...creators, creator] : creators.map((existing, i) => (i === index ? creator : existing)),
  );
}

export function removeCreator(name: string): boolean {
  const creators = store.getAll();
  const remaining = creators.filter((creator) => creator.name.toLowerCase() !== name.toLowerCase());
  if (remaining.length === creators.length) return false;
  store.saveAll(remaining);
  return true;
}

/** Extracts the @handle from a "https://www.youtube.com/@Handle" URL, e.g. "VerfRS". */
export function youtubeHandleFor(creator: Creator): string | undefined {
  const match = creator.url.match(/youtube\.com\/@([^/?#]+)/i);
  return match?.[1];
}
