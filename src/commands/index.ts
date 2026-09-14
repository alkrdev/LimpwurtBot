import type { Command } from "../types.js";
import { command as watch } from "./watch.js";
import { command as faq } from "./faq.js";

export const commands: Command[] = [watch, faq];
