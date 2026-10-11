import { Client, Events, GatewayIntentBits, MessageFlags } from "discord.js";
import type { InteractionReplyOptions } from "discord.js";
import { config } from "./config.js";
import { getCommands, messageCommands } from "./commands/index.js";
import { registerCommands } from "./register-commands.js";
import { checkCooldown, DEFAULT_COOLDOWN_SECONDS } from "./cooldowns.js";
import { startUploadPolling } from "./uploads/poller.js";
import type { Command, MessageCommand } from "./types.js";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
  startUploadPolling(readyClient);
});

function findCommand(name: string): Command | undefined {
  return getCommands().find((command) => command.data.name === name);
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isAutocomplete()) {
    await findCommand(interaction.commandName)
      ?.autocomplete?.(interaction)
      .catch((error) => console.error(`Error autocompleting command ${interaction.commandName}:`, error));
    return;
  }

  let command: Command | MessageCommand | undefined;
  let run: () => Promise<void>;
  if (interaction.isChatInputCommand()) {
    const slashCommand = findCommand(interaction.commandName);
    command = slashCommand;
    run = () => slashCommand!.execute(interaction);
  } else if (interaction.isMessageContextMenuCommand()) {
    const messageCommand = messageCommands.find((candidate) => candidate.data.name === interaction.commandName);
    command = messageCommand;
    run = () => messageCommand!.execute(interaction);
  } else {
    return;
  }

  if (!command) {
    // e.g. a FAQ shortcut removed moments ago that Discord hasn't dropped from the user's client yet.
    console.warn(`No handler registered for command: ${interaction.commandName}`);
    await interaction.reply({ content: "That command no longer exists.", flags: MessageFlags.Ephemeral });
    return;
  }

  const cooldownSeconds = command.cooldownSeconds ?? DEFAULT_COOLDOWN_SECONDS;
  const remaining = checkCooldown(interaction.commandName, interaction.user.id, cooldownSeconds);
  if (remaining !== null) {
    await interaction.reply({
      content: `Slow down! Try \`${interaction.commandName}\` again in ${remaining}s.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  try {
    await run();
  } catch (error) {
    console.error(`Error executing command ${interaction.commandName}:`, error);
    const errorResponse: InteractionReplyOptions = {
      content: "Something went wrong running that command.",
      flags: MessageFlags.Ephemeral,
    };

    // Showing a modal also counts as replying, and that response can't take a follow-up.
    const respond = interaction.replied || interaction.deferred ? interaction.followUp(errorResponse) : interaction.reply(errorResponse);
    await respond.catch(() => {});
  }
});

async function main() {
  await registerCommands();
  await client.login(config.discordToken);
}

// Railway sends SIGTERM to the old container on every redeploy. Without a handler Node is killed by
// the signal and Railway treats the non-zero exit as a crash. railway.json starts Node directly rather
// than through `npm start`, because npm also receives the signal and exits non-zero on its own.
for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.once(signal, () => {
    console.log(`Received ${signal}, shutting down.`);
    setTimeout(() => process.exit(0), 5000).unref();
    void client.destroy().finally(() => process.exit(0));
  });
}

main().catch((error) => {
  console.error("Failed to start bot:", error);
  process.exit(1);
});
