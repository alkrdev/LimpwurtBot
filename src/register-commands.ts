import { REST, Routes } from "discord.js";
import { config } from "./config.js";
import { commands } from "./commands/index.js";

export async function registerCommands(): Promise<void> {
  const body = commands.map((command) => command.data.toJSON());
  const rest = new REST().setToken(config.discordToken);

  const target = config.guildId
    ? Routes.applicationGuildCommands(config.clientId, config.guildId)
    : Routes.applicationCommands(config.clientId);

  console.log(
    `Registering ${body.length} command(s) ${config.guildId ? `to guild ${config.guildId}` : "globally"}...`,
  );

  const result = (await rest.put(target, { body })) as unknown[];

  console.log(`Successfully registered ${result.length} command(s).`);
}
