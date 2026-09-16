import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types.js";

const SCHEDULE_CHANNEL_ID = "1519033708424724600";

export const command: Command = {
  data: new SlashCommandBuilder().setName("when").setDescription("Find out when the next stream is"),

  async execute(interaction) {
    await interaction.reply(`Check <#${SCHEDULE_CHANNEL_ID}> for that.`);
  },
};
