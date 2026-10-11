# Feature ideas

## Definitely doing

- [x] **`/faq` with autocomplete.** Replace one-top-level-command-per-entry with a single `/faq topic:<autocomplete>` that searches both `question` and `answer`. Keep a few popular entries as shortcuts if wanted. Fixes the scaling problem where every new FAQ entry adds another command.
- [x] **"Answer with FAQ" message context menu.** Right-click a message → pick a FAQ entry → the bot replies to that message (pinging the person who asked). Faster for mods than typing a command.
- [x] **Manage FAQ and creators from Discord.** `/faq-add`, `/faq-remove`, `/creator-add` etc., persisted to the state dir like `src/uploads/store.ts` does, so content changes don't need a commit and redeploy.

## Builds on what's already there

- **Filter `/watch` by series / `/creator` lookup.** Use the unused `series` field in `creators.json`. `/creator name:Verf` shows their series, channel link and latest upload (`lastVideoId` is already tracked).
- **Livestream detection.** Post "🔴 X is live now" via YouTube's `liveBroadcastContent` (or Twitch, if any creators stream there).
- **Opt-in ping roles for announcements.** Members self-assign e.g. `@Fray-uploads` via a button or `/notify creator:Fray`; announcements mention that role.

## Community and engagement

- **Chunk roll predictions.** Mods open a prediction with buttons for candidate chunks; the bot announces who guessed right and keeps a leaderboard.
- **Auto-answer common questions.** When a message matches a FAQ pattern, suggest the answer (privately or with a "Was this your question?" button). Rate-limit per channel using `src/cooldowns.ts`.
- **`/progress` chunk count.** Current unlocked chunk count and most recent unlock, set by a mod with `/set-chunk`.
- **OSRS Wiki lookup.** `/wiki item:<name>` returns an embed with image, examine text and drop sources from the Weird Gloop API.
- **Hiscores / collection log lookup.** `/hiscores player:<name>` via the official OSRS hiscores endpoint.

## Admin and quality of life

- **Grant `/when` to a role via a command.** Currently admin-only until permissions are changed by hand.
- **`/status` health check.** Uptime, last successful YouTube poll, API quota errors. The poller currently fails silently.
- **Durable state.** Check that Railway has a volume mounted for the state dir; without one, redeploys wipe `uploads.json` and the announcement channel setting. Consider SQLite if state grows.
