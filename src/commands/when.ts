import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types.js";

const WHEN_CHANNEL_ID = "1519033708424724600";
const ALLOWED_ROLE_IDS = ["817352481624293386", "1112708029704585236"];

export const command: Command = {
  data: new SlashCommandBuilder().setName("when").setDescription("\"When?\" — right here"),

  cooldownSeconds: 30,

  async execute(interaction) {
    const hasAllowedRole =
      interaction.inCachedGuild() &&
      interaction.member.roles.cache.some((role) => ALLOWED_ROLE_IDS.includes(role.id));

    if (!hasAllowedRole) {
      await interaction.reply({
        content: "You don't have permission to use this command.",
        ephemeral: true,
      });
      return;
    }

    await interaction.reply(`Check <#${WHEN_CHANNEL_ID}> for that.`);
  },
};
