# calendar-telegram

A Node.js/TypeScript service that polls Google Calendar and sends upcoming event notifications to a Telegram chat.

## How it works

A cron job fires at a configurable interval. Each run fetches events starting within a lookahead window, sends a Telegram message for any event not yet notified, and records the event ID to prevent re-sending. State is persisted in `data/store.json`.

## Requirements

- Node.js 18+
- A Google Cloud project with the Calendar API enabled
- A Google Service Account with Viewer access to the target calendar
- A Telegram bot (created via @BotFather) added to the target chat

## Setup

**1. Install dependencies**

```bash
npm install
```

**2. Create a Google Service Account**

1. In [Google Cloud Console](https://console.cloud.google.com), go to **APIs & Services → Credentials → Create Credentials → Service Account**.
2. Under the service account, go to **Keys → Add Key → JSON**. Save the file as `service-account-key.json` in the project root.
3. Enable the **Google Calendar API** under **APIs & Services → Library**.
4. In Google Calendar, share the target calendar with the service account email (`name@project.iam.gserviceaccount.com`) — Viewer permission is sufficient.

**3. Create a Telegram bot**

1. Message [@BotFather](https://t.me/BotFather), send `/newbot`, and copy the token.
2. Add the bot to the target group or channel.
3. Get the chat ID: send a message to the chat, then call `https://api.telegram.org/bot<TOKEN>/getUpdates` and look for `chat.id` in the response.

**4. Configure**

```bash
cp .env.example .env
```

Edit `.env` and set the four required variables:

```
GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./service-account-key.json
TELEGRAM_BOT_TOKEN=1234567890:ABCdef...
TELEGRAM_CHAT_ID=-1001234567890
```

See `.env.example` for all optional settings.

## Usage

```bash
npm run dev        # run with ts-node (development)
npm run build      # compile to dist/
npm start          # run compiled output
npm run typecheck  # type-check without emitting
npm test           # run unit tests
npm run clean      # delete dist/
```

## Configuration

| Variable | Required | Default | Description |
|---|---|---|---|
| `GOOGLE_CALENDAR_ID` | yes | — | Calendar ID to read |
| `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` | yes | — | Path to service account JSON key |
| `TELEGRAM_BOT_TOKEN` | yes | — | Bot token from @BotFather |
| `TELEGRAM_CHAT_ID` | yes | — | Target chat or channel ID |
| `CRON_SCHEDULE` | no | `*/15 * * * *` | Poll frequency (cron syntax) |
| `LOOKAHEAD_MINUTES` | no | `60` | How far ahead to look for events |
| `STORE_PATH` | no | `./data/store.json` | Notification state file path |
| `TIMEZONE` | no | `UTC` | IANA timezone for display (e.g. `Africa/Nairobi`) |
| `LOG_LEVEL` | no | `info` | `debug` \| `info` \| `warn` \| `error` |

## Project structure

```
src/
  index.ts       entry point; startup, signal handling
  config.ts      env var loading and validation
  logger.ts      minimal level-filtered logger
  calendar.ts    Google Calendar API client
  telegram.ts    Telegram Bot API client
  formatter.ts   event → Telegram HTML string (pure, no I/O)
  store.ts       persistent JSON store for notified event IDs
  scheduler.ts   cron orchestration
tests/
  formatter.test.ts
data/
  store.json     runtime notification state; tracked in Git as an empty initial file
```

## Testing

The unit tests cover `formatter.ts` and require no credentials:

```bash
npm test
```

The formatter tests require no credentials and run in under 20 seconds.

## Deployment

The service is a long-running Node process. Recommended approaches:

- **PM2**: `pm2 start dist/index.js --name calendar-telegram && pm2 save`
- **systemd**: create a unit file pointing to `node dist/index.js`
- **Docker**: `CMD ["node", "dist/index.js"]` with `data/` on a persistent volume

If deploying to a stateless or ephemeral host (e.g. a serverless platform), replace `src/store.ts` with a Redis or database-backed implementation to avoid losing notification state on container restarts.

## Security notes

- `.env` and `service-account-key.json` are excluded from Git by `.gitignore`.
- The service account is granted read-only calendar access.
- Credentials are never written to logs.
- `TIMEZONE` does not affect security; it only controls display formatting. Event times from the API are always timezone-aware ISO 8601 strings
