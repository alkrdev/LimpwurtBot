import { REST, Routes } from "discord.js";
import { config } from "./config.js";
import { commands } from "./commands/index.js";

const body = commands.map((command) => command.data.toJSON());

const rest = new REST().setToken(config.discordToken);

async function main() {
  const target = config.guildId
    ? Routes.applicationGuildCommands(config.clientId, config.guildId)
    : Routes.applicationCommands(config.clientId);

  console.log(
    `Deploying ${body.length} command(s) ${config.guildId ? `to guild ${config.guildId}` : "globally"}...`,
  );

  const result = (await rest.put(target, { body })) as unknown[];

  console.log(`Successfully deployed ${result.length} command(s).`);
}

main().catch((error) => {
  console.error("Failed to deploy commands:", error);
  process.exit(1);
});
