import {
  CheckboxBuilder,
  LabelBuilder,
  MessageFlags,
  ModalBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../types.js";
import type { FaqEntry } from "../faq.js";
import { FAQ_KEY_PATTERN, findFaqEntry, removeFaqEntry, saveFaqEntry, searchFaqEntries, truncate } from "../faq.js";
import { config } from "../config.js";
import { registerCommands } from "../register-commands.js";
import { builtInCommandNames } from "./index.js";

const MODAL_TIMEOUT_MS = 15 * 60_000;

function entryModal(customId: string, title: string, existing?: FaqEntry): ModalBuilder {
  const modal = new ModalBuilder().setCustomId(customId).setTitle(title);

  if (!existing) {
    modal.addLabelComponents(
      new LabelBuilder()
        .setLabel("Command name")
        .setDescription("Lowercase letters, digits and dashes, e.g. old-streams → /old-streams")
        .setTextInputComponent(
          new TextInputBuilder().setCustomId("key").setStyle(TextInputStyle.Short).setMaxLength(32).setRequired(true),
        ),
    );
  }

  const question = new TextInputBuilder()
    .setCustomId("question")
    .setStyle(TextInputStyle.Short)
    .setMaxLength(100) // also the shortcut command's description, which is capped at 100
    .setRequired(true);
  const answer = new TextInputBuilder()
    .setCustomId("answer")
    .setStyle(TextInputStyle.Paragraph)
    .setMaxLength(4000)
    .setRequired(true);
  if (existing) {
    question.setValue(existing.question);
    answer.setValue(existing.answer);
  }

  return modal.addLabelComponents(
    new LabelBuilder().setLabel("Question").setTextInputComponent(question),
    new LabelBuilder().setLabel("Answer").setTextInputComponent(answer),
    new LabelBuilder()
      .setLabel("Show publicly")
      .setDescription("Unticked, only the person who asked sees the answer")
      .setCheckboxComponent(new CheckboxBuilder().setCustomId("public").setDefault(existing?.public ?? false)),
  );
}

async function promptForEntry(interaction: ChatInputCommandInteraction, title: string, existing?: FaqEntry) {
  const customId = `manage-faq:${interaction.id}`;
  await interaction.showModal(entryModal(customId, title, existing));

  const submitted = await interaction
    .awaitModalSubmit({ time: MODAL_TIMEOUT_MS, filter: (i) => i.customId === customId })
    .catch(() => null);
  if (!submitted) return null;

  const { fields } = submitted;
  const entry: FaqEntry = {
    key: existing?.key ?? fields.getTextInputValue("key").trim().toLowerCase(),
    question: fields.getTextInputValue("question").trim(),
    answer: fields.getTextInputValue("answer").trim(),
  };
  if (fields.getCheckbox("public")) entry.public = true;

  return { submitted, entry };
}

/** Re-registers slash commands so FAQ shortcut commands match the entries. Returns a note for the reply. */
async function syncShortcutCommands(): Promise<string> {
  try {
    await registerCommands();
    return config.guildIds.length === 0 ? " Shortcut commands can take up to an hour to update everywhere." : "";
  } catch (error) {
    console.error("Failed to re-register commands after FAQ change:", error);
    return " ⚠️ Couldn't update the shortcut commands; they'll refresh the next time the bot restarts.";
  }
}

async function add(interaction: ChatInputCommandInteraction): Promise<void> {
  const result = await promptForEntry(interaction, "Add FAQ entry");
  if (!result) return;
  const { submitted, entry } = result;

  const problem = !FAQ_KEY_PATTERN.test(entry.key)
    ? `\`${entry.key}\` isn't a valid command name — use 1–32 lowercase letters, digits, dashes or underscores.`
    : builtInCommandNames().includes(entry.key)
      ? `\`/${entry.key}\` is already one of the bot's own commands.`
      : findFaqEntry(entry.key)
        ? `There's already a FAQ entry called \`${entry.key}\` — use \`/manage-faq edit\` to change it.`
        : undefined;

  if (problem) {
    await submitted.reply({
      content: `${problem}\n\nHere's what you wrote, so it isn't lost:\n>>> **${entry.question}**\n${entry.answer}`.slice(0, 2000),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  saveFaqEntry(entry);
  // Re-registering can take a few seconds, longer than Discord waits for a first response.
  await submitted.deferReply({ flags: MessageFlags.Ephemeral });
  const note = await syncShortcutCommands();
  await submitted.editReply(`Added \`/${entry.key}\` — "${entry.question}".${note}`);
}

async function edit(interaction: ChatInputCommandInteraction): Promise<void> {
  const existing = findFaqEntry(interaction.options.getString("key", true));
  if (!existing) {
    await interaction.reply({ content: "No FAQ entry with that name.", flags: MessageFlags.Ephemeral });
    return;
  }

  const result = await promptForEntry(interaction, `Edit /${existing.key}`, existing);
  if (!result) return;
  const { submitted, entry } = result;

  saveFaqEntry(entry);
  await submitted.deferReply({ flags: MessageFlags.Ephemeral });
  // The question doubles as the shortcut command's description.
  const note = entry.question === existing.question ? "" : await syncShortcutCommands();
  await submitted.editReply(`Updated \`/${entry.key}\`.${note}`);
}

async function remove(interaction: ChatInputCommandInteraction): Promise<void> {
  const key = interaction.options.getString("key", true);
  if (!removeFaqEntry(key)) {
    await interaction.reply({ content: "No FAQ entry with that name.", flags: MessageFlags.Ephemeral });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const note = await syncShortcutCommands();
  await interaction.editReply(`Removed \`/${key}\`.${note}`);
}

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("manage-faq")
    .setDescription("Add, edit or remove FAQ entries")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) => sub.setName("add").setDescription("Add a FAQ entry; it also gets its own /command"))
    .addSubcommand((sub) =>
      sub
        .setName("edit")
        .setDescription("Change a FAQ entry's question, answer or visibility")
        .addStringOption((option) =>
          option.setName("key").setDescription("Entry to edit").setRequired(true).setAutocomplete(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Delete a FAQ entry and its /command")
        .addStringOption((option) =>
          option.setName("key").setDescription("Entry to remove").setRequired(true).setAutocomplete(true),
        ),
    ),

  async autocomplete(interaction) {
    const matches = searchFaqEntries(interaction.options.getFocused());
    await interaction.respond(
      matches.slice(0, 25).map((entry) => ({ name: truncate(`/${entry.key} — ${entry.question}`, 100), value: entry.key })),
    );
  },

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === "add") await add(interaction);
    else if (subcommand === "edit") await edit(interaction);
    else if (subcommand === "remove") await remove(interaction);
  },
};
