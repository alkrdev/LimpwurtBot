import type { Command, MessageCommand } from "../types.js";
import { command as watch } from "./watch.js";
import { command as when } from "./when.js";
import { command as setUploadChannel } from "./set-upload-channel.js";
import { command as faq } from "./faq.js";
import { command as manageFaq } from "./manage-faq.js";
import { command as manageCreators } from "./manage-creators.js";
import { command as answerWithFaq } from "./answer-with-faq.js";
import { faqShortcutCommands } from "./faq-entries.js";

const builtInCommands: Command[] = [watch, when, setUploadChannel, faq, manageFaq, manageCreators];

export const messageCommands: MessageCommand[] = [answerWithFaq];

/** Built fresh each call, since FAQ shortcut commands change when admins edit the FAQ. */
export function getCommands(): Command[] {
  return [...builtInCommands, ...faqShortcutCommands()];
}

/** Names FAQ entries can't use, because the bot's own commands already have them. */
export function builtInCommandNames(): string[] {
  return builtInCommands.map((command) => command.data.name);
}
