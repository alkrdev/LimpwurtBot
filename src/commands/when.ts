import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types.js";

const WHEN_CHANNEL_ID = "1519033708424724600";

export const command: Command = {
  data: new SlashCommandBuilder().setName("when").setDescription("\"When?\" — right here"),

  async execute(interaction) {
    await interaction.reply(`Check <#${WHEN_CHANNEL_ID}> for that.`);
  },
};
