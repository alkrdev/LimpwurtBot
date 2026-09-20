import { REST, Routes } from "discord.js";
import { config } from "./config.js";
import { commands } from "./commands/index.js";

export async function registerCommands(): Promise<void> {
  const body = commands.map((command) => command.data.toJSON());
  const rest = new REST().setToken(config.discordToken);

  if (config.guildIds.length === 0) {
    console.log(`Registering ${body.length} command(s) globally...`);
    const result = (await rest.put(Routes.applicationCommands(config.clientId), { body })) as unknown[];
    console.log(`Successfully registered ${result.length} command(s).`);
    return;
  }

  for (const guildId of config.guildIds) {
    console.log(`Registering ${body.length} command(s) to guild ${guildId}...`);
    const result = (await rest.put(Routes.applicationGuildCommands(config.clientId, guildId), {
      body,
    })) as unknown[];
    console.log(`Successfully registered ${result.length} command(s) to guild ${guildId}.`);
  }
}
