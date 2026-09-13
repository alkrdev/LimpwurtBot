import { Client, Collection, Events, GatewayIntentBits } from "discord.js";
import { config } from "./config.js";
import { commands } from "./commands/index.js";
import type { Command } from "./types.js";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commandsByName = new Collection<string, Command>(
  commands.map((command) => [command.data.name, command]),
);

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commandsByName.get(interaction.commandName);
  if (!command) {
    console.warn(`No handler registered for command: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing command ${interaction.commandName}:`, error);
    const errorResponse = { content: "Something went wrong running that command.", ephemeral: true };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorResponse);
    } else {
      await interaction.reply(errorResponse);
    }
  }
});

client.login(config.discordToken);
