import { Cron } from 'croner';
import { AppConfig } from './config';
import { fetchUpcomingEvents } from './calendar';
import { hasBeenNotified, markAsNotified } from './store';
import { formatEvent } from './formatter';
import { sendMessage } from './telegram';
import { logger } from './logger';

async function poll(config: AppConfig): Promise<void> {
    logger.debug('Poll cycle started');

    let events;
    try {
        events = await fetchUpcomingEvents(
            config.googleServiceAccountKeyPath,
            config.googleCalendarId,
            config.lookaheadMinutes,
        );
    } catch (err) {
        logger.error(`Failed to fetch calendar events: ${(err as Error).message}`);
        return;
    }

    const newEvents = events.filter((e) => !hasBeenNotified(config.storePath, e.id));

    if (newEvents.length === 0) {
        logger.debug(`Fetched ${events.length} event(s), none new`);
        return;
    }

    logger.info(`Sending ${newEvents.length} new notification(s)`);

    for (const event of newEvents) {
        try {
            await sendMessage(config.telegramBotToken, config.telegramChatId, formatEvent(event, config.timezone));
            markAsNotified(config.storePath, event.id);
            logger.info(`Notified: "${event.summary}" (${event.id})`);
        } catch (err) {
            logger.error(`Failed to notify "${event.summary}": ${(err as Error).message}`);
        }
    }
}

export function startScheduler(config: AppConfig): Cron {
    logger.info(`Scheduler: cron="${config.cronSchedule}", lookahead=${config.lookaheadMinutes}min`);

    void poll(config);

    return new Cron(config.cronSchedule, { protect: true }, () => void poll(config));
}
