import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types.js";

interface Creator {
  name: string;
  url: string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const creatorsPath = path.join(__dirname, "..", "data", "creators.json");
const creators: Creator[] = JSON.parse(readFileSync(creatorsPath, "utf-8"));

const SUGGESTIONS_PER_CALL = 3;

function pickRandom<T>(items: T[], count: number): T[] {
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("watch")
    .setDescription("Get a few creators from the community worth checking out"),

  async execute(interaction) {
    if (creators.length === 0) {
      await interaction.reply({
        content: "No creators are configured yet. Ask an admin to add some!",
        ephemeral: true,
      });
      return;
    }

    const picks = pickRandom(creators, Math.min(SUGGESTIONS_PER_CALL, creators.length));

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("Go give these creators some love")
      .setDescription(picks.map((creator) => `• [${creator.name}](${creator.url})`).join("\n"));

    await interaction.reply({ embeds: [embed] });
  },
};
