import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  ContextMenuCommandBuilder,
  MessageContextMenuCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

export interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;
  /** Per-user cooldown in seconds before this command can be run again. Defaults to DEFAULT_COOLDOWN_SECONDS. */
  cooldownSeconds?: number;
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
  autocomplete?(interaction: AutocompleteInteraction): Promise<void>;
}

/** A command in the "Apps" menu when right-clicking a message. */
export interface MessageCommand {
  data: ContextMenuCommandBuilder;
  cooldownSeconds?: number;
  execute(interaction: MessageContextMenuCommandInteraction): Promise<void>;
}
