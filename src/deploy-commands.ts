import { registerCommands } from "./register-commands.js";

registerCommands().catch((error) => {
  console.error("Failed to deploy commands:", error);
  process.exit(1);
});
