# Implementation Notes

A few implementation choices were made to keep the service simple and suitable for a small deployment.

- **Google Service Account authentication** is used instead of interactive OAuth. The service runs as a background process, so a Service Account avoids interactive login and token management. The target calendar only needs to be shared with the Service Account.

- **Local JSON state storage** is used to track notified event IDs. This keeps the service lightweight and is suitable for a server with persistent storage. A database or Redis-backed store would be more appropriate for a stateless deployment.

- **Cron-based polling** is used instead of webhooks. The service checks for upcoming events at a configurable interval, keeping the implementation simple without requiring a publicly accessible endpoint.

- **Telegram HTML formatting** is used for readable messages and simpler escaping than MarkdownV2.

- **Timezone is configurable** through `TIMEZONE`, allowing the service to be used with calendars in different regions without changing the code.

- **Notification state is saved only after a successful Telegram request**, so a failed send is not recorded as completed.