import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../types.js";
import { findCreator, getCreators, removeCreator, saveCreator, youtubeHandleFor } from "../creators.js";

function parseSeries(value: string): string[] {
  return value
    .split(",")
    .map((series) => series.trim())
    .filter(Boolean);
}

function urlProblem(url: string): string | undefined {
  return /^https?:\/\/\S+$/i.test(url) ? undefined : "That doesn't look like a link — it should start with https://.";
}

/** Non-YouTube links are allowed in /watch, but the upload poller can only follow @handle links. */
function uploadsNote(url: string): string {
  return youtubeHandleFor({ name: "", url, series: [] })
    ? ""
    : "\nNote: new-upload announcements only work for links like `https://www.youtube.com/@Handle`.";
}

async function add(interaction: ChatInputCommandInteraction): Promise<void> {
  const name = interaction.options.getString("name", true).trim();
  const url = interaction.options.getString("url", true).trim();
  const series = parseSeries(interaction.options.getString("series") ?? "");

  const problem = findCreator(name) ? `**${name}** is already on the list — use \`/manage-creators edit\`.` : urlProblem(url);
  if (problem) {
    await interaction.reply({ content: problem, flags: MessageFlags.Ephemeral });
    return;
  }

  saveCreator({ name, url, series });
  await interaction.reply({ content: `Added **${name}**.${uploadsNote(url)}`, flags: MessageFlags.Ephemeral });
}

async function edit(interaction: ChatInputCommandInteraction): Promise<void> {
  const existing = findCreator(interaction.options.getString("name", true));
  if (!existing) {
    await interaction.reply({ content: "No creator with that name.", flags: MessageFlags.Ephemeral });
    return;
  }

  const url = interaction.options.getString("url")?.trim() ?? existing.url;
  const seriesOption = interaction.options.getString("series");
  const series = seriesOption === null ? existing.series : parseSeries(seriesOption);

  const problem = urlProblem(url);
  if (problem) {
    await interaction.reply({ content: problem, flags: MessageFlags.Ephemeral });
    return;
  }

  saveCreator({ ...existing, url, series });
  await interaction.reply({ content: `Updated **${existing.name}**.${uploadsNote(url)}`, flags: MessageFlags.Ephemeral });
}

async function remove(interaction: ChatInputCommandInteraction): Promise<void> {
  const name = interaction.options.getString("name", true);
  const creator = findCreator(name);
  if (!creator || !removeCreator(creator.name)) {
    await interaction.reply({ content: "No creator with that name.", flags: MessageFlags.Ephemeral });
    return;
  }

  await interaction.reply({ content: `Removed **${creator.name}**.`, flags: MessageFlags.Ephemeral });
}

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("manage-creators")
    .setDescription("Add, edit or remove creators shown in /watch and watched for new uploads")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add a creator")
        .addStringOption((option) => option.setName("name").setDescription("Display name").setRequired(true).setMaxLength(80))
        .addStringOption((option) =>
          option.setName("url").setDescription("Channel link, e.g. https://www.youtube.com/@VerfRS").setRequired(true),
        )
        .addStringOption((option) =>
          option.setName("series").setDescription("Comma-separated, e.g. Extreme Chunk: Kourend"),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("edit")
        .setDescription("Change a creator's link or series (leave an option out to keep it)")
        .addStringOption((option) =>
          option.setName("name").setDescription("Creator to edit").setRequired(true).setAutocomplete(true),
        )
        .addStringOption((option) => option.setName("url").setDescription("New channel link"))
        .addStringOption((option) =>
          option.setName("series").setDescription("New comma-separated series list (replaces the old one)"),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove a creator")
        .addStringOption((option) =>
          option.setName("name").setDescription("Creator to remove").setRequired(true).setAutocomplete(true),
        ),
    ),

  async autocomplete(interaction) {
    const needle = interaction.options.getFocused().toLowerCase();
    await interaction.respond(
      getCreators()
        .filter((creator) => creator.name.toLowerCase().includes(needle))
        .slice(0, 25)
        .map((creator) => ({ name: creator.name, value: creator.name })),
    );
  },

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === "add") await add(interaction);
    else if (subcommand === "edit") await edit(interaction);
    else if (subcommand === "remove") await remove(interaction);
  },
};
