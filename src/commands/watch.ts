import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types.js";
import { creators } from "../creators.js";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("watch")
    .setDescription("List creators from the community worth checking out"),

  async execute(interaction) {
    if (creators.length === 0) {
      await interaction.reply({
        content: "No creators are configured yet. Ask an admin to add some!",
        ephemeral: true,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("Go give these creators some love")
      .setDescription(
        creators
          .map((creator) => `• [${creator.name}](${creator.url}) — ${creator.series.join(", ")}`)
          .join("\n"),
      );

    await interaction.reply({ embeds: [embed] });
  },
};
