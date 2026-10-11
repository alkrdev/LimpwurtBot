import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types.js";
import { faqEmbed, findFaqEntry, getFaqEntries } from "../faq.js";

/** One shortcut slash command per FAQ entry, e.g. /old-streams. */
export function faqShortcutCommands(): Command[] {
  return getFaqEntries().map((entry) => ({
    data: new SlashCommandBuilder().setName(entry.key).setDescription(entry.question.slice(0, 100)),

    async execute(interaction) {
      // Look the entry up again so edits made since the commands were built are picked up.
      const current = findFaqEntry(entry.key);
      if (!current) {
        await interaction.reply({ content: "That FAQ entry has been removed.", flags: MessageFlags.Ephemeral });
        return;
      }

      await interaction.reply({
        embeds: [faqEmbed(current)],
        flags: current.public ? undefined : MessageFlags.Ephemeral,
      });
    },
  }));
}
