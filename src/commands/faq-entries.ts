import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types.js";

interface FaqEntry {
  key: string;
  question: string;
  answer: string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const faqPath = path.join(__dirname, "..", "data", "faq.json");
const faqEntries: FaqEntry[] = JSON.parse(readFileSync(faqPath, "utf-8"));

// Publicly visible replies; every other FAQ entry replies ephemerally.
const PUBLIC_ENTRY_KEYS = new Set(["old-streams"]);

export const faqCommands: Command[] = faqEntries.map((entry) => ({
  data: new SlashCommandBuilder().setName(entry.key).setDescription(entry.question.slice(0, 100)),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(entry.question)
      .setDescription(entry.answer);

    await interaction.reply({ embeds: [embed], flags: PUBLIC_ENTRY_KEYS.has(entry.key) ? undefined : MessageFlags.Ephemeral });
  },
}));
