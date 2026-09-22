import { ChannelType, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types.js";
import { setAnnouncementChannelId } from "../uploads/store.js";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("set-upload-channel")
    .setDescription("Set the channel where new creator video announcements are posted")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Channel to post new upload announcements in")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true),
    ),

  async execute(interaction) {
    if (!interaction.inCachedGuild()) {
      await interaction.reply({ content: "This can only be used in a server.", flags: MessageFlags.Ephemeral });
      return;
    }

    const channel = interaction.options.getChannel("channel", true);
    setAnnouncementChannelId(interaction.guildId, channel.id);

    await interaction.reply({
      content: `New video announcements will now be posted in <#${channel.id}>.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
