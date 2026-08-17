import * as fs from 'fs';
import * as path from 'path';

type Store = { notifiedEventIds: string[] };

function read(storePath: string): Store {
    try {
        if (!fs.existsSync(storePath)) return { notifiedEventIds: [] };
        const parsed = JSON.parse(fs.readFileSync(storePath, 'utf-8')) as Partial<Store>;
        return { notifiedEventIds: Array.isArray(parsed.notifiedEventIds) ? parsed.notifiedEventIds : [] };
    } catch {
        console.warn(`[store] Could not read ${storePath}, starting fresh.`);
        return { notifiedEventIds: [] };
    }
}

// Atomic write via temp file + rename to prevent corruption on abrupt shutdown.
function write(storePath: string, data: Store): void {
    const dir = path.dirname(storePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tmp = `${storePath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmp, storePath);
}

export function hasBeenNotified(storePath: string, eventId: string): boolean {
    return read(storePath).notifiedEventIds.includes(eventId);
}

export function markAsNotified(storePath: string, eventId: string): void {
    const data = read(storePath);
    if (!data.notifiedEventIds.includes(eventId)) {
        data.notifiedEventIds.push(eventId);
        write(storePath, data);
    }
}
