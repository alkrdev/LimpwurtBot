import type { Command } from "../types.js";
import { command as watch } from "./watch.js";
import { command as when } from "./when.js";
import { faqCommands } from "./faq-entries.js";

export const commands: Command[] = [watch, when, ...faqCommands];
