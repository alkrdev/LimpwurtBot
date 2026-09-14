import type { Command } from "../types.js";
import { command as watch } from "./watch.js";
import { faqCommands } from "./faq-entries.js";

export const commands: Command[] = [watch, ...faqCommands];
