import { Client, Collection, Events, GatewayIntentBits, MessageFlags } from "discord.js";
import type { InteractionReplyOptions } from "discord.js";
import { config } from "./config.js";
import { commands } from "./commands/index.js";
import { registerCommands } from "./register-commands.js";
import { checkCooldown, DEFAULT_COOLDOWN_SECONDS } from "./cooldowns.js";
import { startUploadPolling } from "./uploads/poller.js";
import type { Command } from "./types.js";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commandsByName = new Collection<string, Command>(
  commands.map((command) => [command.data.name, command]),
);

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
  startUploadPolling(readyClient);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commandsByName.get(interaction.commandName);
  if (!command) {
    console.warn(`No handler registered for command: ${interaction.commandName}`);
    return;
  }

  const cooldownSeconds = command.cooldownSeconds ?? DEFAULT_COOLDOWN_SECONDS;
  const remaining = checkCooldown(interaction.commandName, interaction.user.id, cooldownSeconds);
  if (remaining !== null) {
    await interaction.reply({
      content: `Slow down! Try \`/${interaction.commandName}\` again in ${remaining}s.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing command ${interaction.commandName}:`, error);
    const errorResponse: InteractionReplyOptions = {
      content: "Something went wrong running that command.",
      flags: MessageFlags.Ephemeral,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorResponse);
    } else {
      await interaction.reply(errorResponse);
    }
  }
});

async function main() {
  await registerCommands();
  await client.login(config.discordToken);
}

main().catch((error) => {
  console.error("Failed to start bot:", error);
  process.exit(1);
});
