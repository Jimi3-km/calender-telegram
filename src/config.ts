import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config();

export interface AppConfig {
    googleCalendarId: string;
    googleServiceAccountKeyPath: string;
    telegramBotToken: string;
    telegramChatId: string;
    cronSchedule: string;
    lookaheadMinutes: number;
    storePath: string;
    timezone: string;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
}

function requireEnv(name: string): string {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(
            `[config] Missing required environment variable: ${name}\n` +
            `  → Copy .env.example to .env and fill in your values.`
        );
    }
    return value;
}

function optionalEnv(name: string, fallback: string): string {
    return process.env[name]?.trim() || fallback;
}

export function loadConfig(): AppConfig {
    const errors: string[] = [];
    let googleCalendarId = '';
    let googleServiceAccountKeyPath = '';
    let telegramBotToken = '';
    let telegramChatId = '';

    try { googleCalendarId = requireEnv('GOOGLE_CALENDAR_ID'); } catch (e) { errors.push((e as Error).message); }
    try { googleServiceAccountKeyPath = requireEnv('GOOGLE_SERVICE_ACCOUNT_KEY_PATH'); } catch (e) { errors.push((e as Error).message); }
    try { telegramBotToken = requireEnv('TELEGRAM_BOT_TOKEN'); } catch (e) { errors.push((e as Error).message); }
    try { telegramChatId = requireEnv('TELEGRAM_CHAT_ID'); } catch (e) { errors.push((e as Error).message); }

    if (errors.length > 0) {
        throw new Error(
            `\n\n❌  Configuration errors — service cannot start:\n\n` +
            errors.map((e) => `  • ${e}`).join('\n') +
            `\n\nSee .env.example for documentation on each variable.\n`
        );
    }

    const resolvedKeyPath = path.resolve(process.cwd(), googleServiceAccountKeyPath);
    if (!fs.existsSync(resolvedKeyPath)) {
        throw new Error(
            `[config] Service Account key file not found: ${resolvedKeyPath}\n` +
            `  → Set GOOGLE_SERVICE_ACCOUNT_KEY_PATH to the correct path in your .env`
        );
    }

    const lookaheadRaw = optionalEnv('LOOKAHEAD_MINUTES', '60');
    const lookaheadMinutes = parseInt(lookaheadRaw, 10);
    if (isNaN(lookaheadMinutes) || lookaheadMinutes < 1) {
        throw new Error(`[config] LOOKAHEAD_MINUTES must be a positive integer, got: "${lookaheadRaw}"`);
    }

    const logLevel = optionalEnv('LOG_LEVEL', 'info') as AppConfig['logLevel'];
    if (!['debug', 'info', 'warn', 'error'].includes(logLevel)) {
        throw new Error(`[config] LOG_LEVEL must be one of: debug, info, warn, error. Got: "${logLevel}"`);
    }

    return {
        googleCalendarId,
        googleServiceAccountKeyPath: resolvedKeyPath,
        telegramBotToken,
        telegramChatId,
        cronSchedule: optionalEnv('CRON_SCHEDULE', '*/15 * * * *'),
        lookaheadMinutes,
        storePath: path.resolve(process.cwd(), optionalEnv('STORE_PATH', './data/store.json')),
        timezone: optionalEnv('TIMEZONE', 'UTC'),
        logLevel,
    };
}
