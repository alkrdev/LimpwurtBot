import { EmbedBuilder } from "discord.js";
import { createListStore } from "./list-store.js";

export interface FaqEntry {
  /** Also the name of the entry's own shortcut slash command, e.g. "old-streams". */
  key: string;
  question: string;
  answer: string;
  /** Reply visibly to everyone instead of only to the person asking. */
  public?: boolean;
}

/** Slash command names must be 1-32 lowercase letters, digits, dashes or underscores. */
export const FAQ_KEY_PATTERN = /^[a-z0-9_-]{1,32}$/;

const store = createListStore<FaqEntry>("faq.json");

export function getFaqEntries(): FaqEntry[] {
  return store.getAll();
}

export function findFaqEntry(key: string): FaqEntry | undefined {
  return store.getAll().find((entry) => entry.key === key);
}

/** Adds the entry, or replaces the existing one with the same key. */
export function saveFaqEntry(entry: FaqEntry): void {
  const entries = store.getAll();
  const index = entries.findIndex((existing) => existing.key === entry.key);
  store.saveAll(index === -1 ? [...entries, entry] : entries.map((existing, i) => (i === index ? entry : existing)));
}

export function removeFaqEntry(key: string): boolean {
  const entries = store.getAll();
  const remaining = entries.filter((entry) => entry.key !== key);
  if (remaining.length === entries.length) return false;
  store.saveAll(remaining);
  return true;
}

/** Entries whose key, question or answer contains the query, best matches (key/question) first. */
export function searchFaqEntries(query: string): FaqEntry[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return store.getAll();

  const inTitle = (entry: FaqEntry) =>
    entry.key.includes(needle) || entry.question.toLowerCase().includes(needle);

  return [
    ...store.getAll().filter(inTitle),
    ...store.getAll().filter((entry) => !inTitle(entry) && entry.answer.toLowerCase().includes(needle)),
  ];
}

export function faqEmbed(entry: FaqEntry): EmbedBuilder {
  return new EmbedBuilder().setColor(0x5865f2).setTitle(entry.question).setDescription(entry.answer);
}

/** Shortens text to fit Discord's length limits for choice names, select options, etc. */
export function truncate(text: string, max: number): string {
  const singleLine = text.replace(/\s+/g, " ").trim();
  return singleLine.length <= max ? singleLine : `${singleLine.slice(0, max - 1)}…`;
}
