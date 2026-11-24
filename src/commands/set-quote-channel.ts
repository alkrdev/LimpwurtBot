import { ChannelType, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types.js";
import { setQuoteChannelId } from "../quotes/store.js";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("set-quote-channel")
    .setDescription("Set the channel where messages quoted with \"Quote message\" are posted")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Channel to post quoted messages in")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true),
    ),

  async execute(interaction) {
    if (!interaction.inCachedGuild()) {
      await interaction.reply({ content: "This can only be used in a server.", flags: MessageFlags.Ephemeral });
      return;
    }

    const channel = interaction.options.getChannel("channel", true);
    setQuoteChannelId(interaction.guildId, channel.id);

    await interaction.reply({
      content: `Quoted messages will now be posted in <#${channel.id}>.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
