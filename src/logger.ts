type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

let currentLevel: LogLevel = 'info';

function log(level: LogLevel, message: string): void {
    if (LEVELS[level] < LEVELS[currentLevel]) return;
    const line = `${new Date().toISOString()} [${level.toUpperCase().padEnd(5)}] ${message}`;
    (level === 'error' || level === 'warn' ? process.stderr : process.stdout).write(line + '\n');
}

export const logger = {
    debug: (msg: string) => log('debug', msg),
    info: (msg: string) => log('info', msg),
    warn: (msg: string) => log('warn', msg),
    error: (msg: string) => log('error', msg),
    setLevel: (level: LogLevel) => { currentLevel = level; },
};
