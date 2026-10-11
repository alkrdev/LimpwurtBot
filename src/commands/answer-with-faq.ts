import {
  ActionRowBuilder,
  ApplicationCommandType,
  ComponentType,
  ContextMenuCommandBuilder,
  MessageFlags,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
} from "discord.js";
import type { MessageCommand } from "../types.js";
import { faqEmbed, findFaqEntry, getFaqEntries, truncate } from "../faq.js";

// Discord select menus hold at most 25 options.
const MAX_OPTIONS = 25;

export const command: MessageCommand = {
  data: new ContextMenuCommandBuilder()
    .setName("Answer with FAQ")
    .setType(ApplicationCommandType.Message)
    // Mods only by default; a server admin can change who sees it via Server Settings -> Integrations.
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const entries = getFaqEntries();
    if (entries.length === 0) {
      await interaction.reply({ content: "There are no FAQ entries yet.", flags: MessageFlags.Ephemeral });
      return;
    }

    const select = new StringSelectMenuBuilder()
      .setCustomId("answer-with-faq")
      .setPlaceholder("Pick an answer")
      .addOptions(
        entries.slice(0, MAX_OPTIONS).map((entry) => ({
          label: truncate(entry.question, 100),
          description: truncate(entry.answer, 100),
          value: entry.key,
        })),
      );

    const target = interaction.targetMessage;
    const response = await interaction.reply({
      content: `Reply to ${target.author}'s message with:`,
      components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)],
      flags: MessageFlags.Ephemeral,
      allowedMentions: { parse: [] },
    });

    const selection = await response
      .awaitMessageComponent({ componentType: ComponentType.StringSelect, time: 60_000 })
      .catch(() => null);

    if (!selection) {
      await interaction.editReply({ content: "Timed out — nothing was sent.", components: [] });
      return;
    }

    const entry = findFaqEntry(selection.values[0]);
    if (!entry) {
      await selection.update({ content: "That FAQ entry no longer exists.", components: [] });
      return;
    }

    const sent = await target.reply({ embeds: [faqEmbed(entry)] }).catch((error) => {
      console.error("Failed to reply with FAQ entry:", error);
      return null;
    });

    await selection.update({
      content: sent
        ? `Answered with "${truncate(entry.question, 100)}".`
        : "Couldn't reply to that message — check that I can send messages and read message history in this channel.",
      components: [],
    });
  },
};
