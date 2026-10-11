import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types.js";
import { faqEmbed, findFaqEntry, searchFaqEntries, truncate } from "../faq.js";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("faq")
    .setDescription("Look up an answer to a frequently asked question")
    .addStringOption((option) =>
      option
        .setName("topic")
        .setDescription("Start typing to search the questions and answers")
        .setRequired(true)
        .setAutocomplete(true),
    ),

  async autocomplete(interaction) {
    const matches = searchFaqEntries(interaction.options.getFocused());
    await interaction.respond(
      matches.slice(0, 25).map((entry) => ({ name: truncate(entry.question, 100), value: entry.key })),
    );
  },

  async execute(interaction) {
    const topic = interaction.options.getString("topic", true);
    // Picking a suggestion sends its key; sending typed text without picking one falls back to the best match.
    const entry = findFaqEntry(topic) ?? searchFaqEntries(topic)[0];

    if (!entry) {
      await interaction.reply({
        content: `No FAQ entry matches "${truncate(topic, 100)}".`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.reply({ embeds: [faqEmbed(entry)], flags: entry.public ? undefined : MessageFlags.Ephemeral });
  },
};
