import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types.js";
import { isPaused, setPaused } from "../uploads/store.js";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("upload-announcements")
    .setDescription("Pause or resume new creator video announcements")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) => sub.setName("pause").setDescription("Stop posting new video announcements"))
    .addSubcommand((sub) => sub.setName("resume").setDescription("Start posting new video announcements again"))
    .addSubcommand((sub) => sub.setName("status").setDescription("Show whether announcements are paused")),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    let content: string;

    if (subcommand === "pause") {
      setPaused(true);
      content =
        "New video announcements are paused. Videos uploaded while paused won't be posted when you resume.";
    } else if (subcommand === "resume") {
      setPaused(false);
      content = "New video announcements are back on.";
    } else {
      content = isPaused() ? "New video announcements are paused." : "New video announcements are on.";
    }

    await interaction.reply({ content, flags: MessageFlags.Ephemeral });
  },
};
