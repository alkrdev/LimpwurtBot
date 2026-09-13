# LimpwurtBot

Discord bot for the community server. Built with [discord.js](https://discord.js.org/) v14 and TypeScript.

## Commands

- `/watch` — replies with a few creators from the community worth checking out, picked randomly from [src/data/creators.json](src/data/creators.json).

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Discord application at the [Developer Portal](https://discord.com/developers/applications), add a Bot user, and copy the **token** and **application (client) ID**.

3. Copy `.env.example` to `.env` and fill in the values:

   ```bash
   cp .env.example .env
   ```

   - `DISCORD_TOKEN` — the bot token.
   - `CLIENT_ID` — the application ID.
   - `GUILD_ID` — (optional, dev only) a server ID to register commands to instantly. Leave blank to register commands globally (takes up to ~1 hour to propagate, use this for production).

4. Invite the bot to your server using an OAuth2 URL with the `bot` and `applications.commands` scopes, and at minimum the "Send Messages" and "Use Slash Commands" permissions.

5. Register the slash commands with Discord:

   ```bash
   npm run deploy-commands
   ```

   This is only needed for local development so you don't have to keep restarting the bot to test command changes — in production the bot registers commands itself on every boot (see below).

6. Run the bot:

   ```bash
   npm run dev
   ```

## Editing the creator list

Edit [src/data/creators.json](src/data/creators.json) — an array of `{ "name": "...", "url": "..." }` objects. No restart is required for the file to be picked up on the next deploy/restart of the bot process (it's read at boot).

## Project structure

```
src/
  commands/       one file per slash command, plus an index.ts barrel
  data/           static data (creator list)
  config.ts       environment variable loading/validation
  types.ts        shared Command interface
  index.ts        bot entrypoint (login + interaction handling)
  deploy-commands.ts  registers slash commands with Discord's API
```

Adding a new command: create `src/commands/foo.ts` exporting a `Command` (see `watch.ts` for the shape), add it to the array in `src/commands/index.ts`, then run `npm run deploy-commands` again.

## Building for production

```bash
npm run build
npm start
```

`npm run build` compiles TypeScript to `dist/` and copies `src/data` alongside it.

## Hosting on Railway

Railway works well for this out of the box:

1. Push this repo to GitHub and create a new Railway project from it (or `railway init` via the CLI).
2. Railway auto-detects Node via Nixpacks and will run `npm install`, then `npm run build`, then `npm start` (Nixpacks picks these up from `package.json` automatically — no extra config needed).
3. Set the environment variables (`DISCORD_TOKEN`, `CLIENT_ID`, and optionally `GUILD_ID`) in the Railway project's **Variables** tab.
4. Since this bot only uses Gateway events (no HTTP server), Railway will still keep the process alive as a background worker — no need to expose a port.
5. The bot re-registers its slash commands automatically every time it starts up (see `src/index.ts`), so a normal Railway deploy is enough to pick up new/changed commands — no separate step needed in production.

### Alternatives to Railway

Railway is a solid default for a small always-on bot like this — simple git-push deploys, cheap for low traffic. A few other options worth knowing about:

- **Fly.io** — similar deploy experience, slightly more configuration (a `fly.toml`), generous free allowance, good if you want more control over region/scaling.
- **A cheap VPS (Hetzner, DigitalOcean) + PM2/systemd** — cheapest long-term for a single small bot, but you own patching/uptime/restarts yourself.
- **Render** — background worker service type, comparable to Railway, slightly slower cold-starts on lower tiers.

For a single small Discord bot, Railway or Fly.io are both good calls — Railway is the easier of the two to get running in the first few minutes.
