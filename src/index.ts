import { loadConfig } from './config';
import { startScheduler } from './scheduler';
import { logger } from './logger';

async function main(): Promise<void> {
    let config;
    try {
        config = loadConfig();
    } catch (err) {
        process.stderr.write((err as Error).message + '\n');
        process.exit(1);
    }

    logger.setLevel(config.logLevel);
    logger.info('Calendar → Telegram notifier starting');
    logger.info(`Calendar:  ${config.googleCalendarId}`);
    logger.info(`Chat ID:   ${config.telegramChatId}`);
    logger.info(`Schedule:  ${config.cronSchedule}`);
    logger.info(`Lookahead: ${config.lookaheadMinutes} min`);
    logger.info(`Timezone:  ${config.timezone}`);
    logger.info(`Store:     ${config.storePath}`);

    const job = startScheduler(config);

    const shutdown = (signal: string) => {
        logger.info(`${signal} received — stopping`);
        job.stop();
        process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
}

void main();
