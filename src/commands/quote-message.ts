import {
  ActionRowBuilder,
  ApplicationCommandType,
  ButtonBuilder,
  ButtonStyle,
  ContextMenuCommandBuilder,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js";
import type { MessageCommand } from "../types.js";
import { getQuoteChannelId } from "../quotes/store.js";

// Discord's embed description limit.
const MAX_DESCRIPTION = 4096;

function clip(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

export const command: MessageCommand = {
  data: new ContextMenuCommandBuilder()
    .setName("Quote message")
    .setType(ApplicationCommandType.Message)
    // Mods only by default; a server admin can change who sees it via Server Settings -> Integrations.
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      await interaction.reply({ content: "This can only be used in a server.", flags: MessageFlags.Ephemeral });
      return;
    }

    const quoteChannelId = getQuoteChannelId(interaction.guildId);
    if (!quoteChannelId) {
      await interaction.reply({
        content: "No quote channel is set yet. An admin can pick one with `/set-quote-channel`.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const quoteChannel = await interaction.client.channels.fetch(quoteChannelId).catch(() => null);
    if (!quoteChannel?.isSendable()) {
      await interaction.reply({
        content: `I can't post in <#${quoteChannelId}> — it may have been deleted, or I'm missing permissions there.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const target = interaction.targetMessage;
    const authorName = target.member?.displayName ?? target.author.displayName;
    const image = target.attachments.find((attachment) => attachment.contentType?.startsWith("image/"));
    const otherAttachments = target.attachments.filter((attachment) => attachment.id !== image?.id);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setAuthor({ name: authorName, iconURL: target.author.displayAvatarURL(), url: target.url })
      .setDescription(clip(target.content || "*(no text)*", MAX_DESCRIPTION))
      .addFields({
        name: "Source",
        value: `${target.author} in <#${target.channelId}> · [Jump to message](${target.url})`,
      })
      .setFooter({ text: `Quoted by ${interaction.user.displayName}` })
      .setTimestamp(target.createdAt);

    if (image) embed.setImage(image.url);
    if (otherAttachments.size > 0) {
      embed.addFields({
        name: "Attachments",
        value: clip(otherAttachments.map((attachment) => `[${attachment.name}](${attachment.url})`).join("\n"), 1024),
      });
    }

    const jumpButton = new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel("Jump to message").setURL(target.url);

    const sent = await quoteChannel
      .send({
        embeds: [embed],
        components: [new ActionRowBuilder<ButtonBuilder>().addComponents(jumpButton)],
        allowedMentions: { parse: [] },
      })
      .catch((error) => {
        console.error("Failed to post quote:", error);
        return null;
      });

    await interaction.reply({
      content: sent
        ? `Quoted ${target.author}'s message in <#${quoteChannelId}>: ${sent.url}`
        : `Couldn't post in <#${quoteChannelId}> — check that I can view the channel, send messages and embed links there.`,
      flags: MessageFlags.Ephemeral,
      allowedMentions: { parse: [] },
    });
  },
};
