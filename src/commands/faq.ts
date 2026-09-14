import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types.js";

interface FaqEntry {
  key: string;
  question: string;
  answer: string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const faqPath = path.join(__dirname, "..", "data", "faq.json");
const faqEntries: FaqEntry[] = JSON.parse(readFileSync(faqPath, "utf-8"));

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("faq")
    .setDescription("Get the answer to a frequently asked question")
    .addStringOption((option) => {
      option.setName("question").setDescription("Which question?").setRequired(true);
      for (const entry of faqEntries) {
        option.addChoices({ name: entry.question, value: entry.key });
      }
      return option;
    }),

  async execute(interaction) {
    const key = interaction.options.getString("question", true);
    const entry = faqEntries.find((e) => e.key === key);

    if (!entry) {
      await interaction.reply({ content: "Couldn't find that question.", ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(entry.question)
      .setDescription(entry.answer);

    await interaction.reply({ embeds: [embed] });
  },
};
