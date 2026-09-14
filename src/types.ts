import type { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder } from "discord.js";

export interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  /** Per-user cooldown in seconds before this command can be run again. Defaults to DEFAULT_COOLDOWN_SECONDS. */
  cooldownSeconds?: number;
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
}
