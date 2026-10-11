import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { config } from "./config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * A JSON list that admins edit from Discord. Until the first edit it's read from the bundled seed in
 * src/data; after that it lives in the state dir, which must be on a mounted volume for edits to
 * survive redeploys.
 */
export function createListStore<T>(fileName: string) {
  const statePath = path.join(config.stateDir, fileName);
  const seedPath = path.join(__dirname, "data", fileName);
  let items: T[] | undefined;

  return {
    getAll(): T[] {
      items ??= JSON.parse(readFileSync(existsSync(statePath) ? statePath : seedPath, "utf-8")) as T[];
      return items;
    },

    saveAll(next: T[]): void {
      mkdirSync(config.stateDir, { recursive: true });
      writeFileSync(statePath, JSON.stringify(next, null, 2));
      items = next;
    },
  };
}
