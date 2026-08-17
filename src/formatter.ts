// Telegram HTML parse mode supports: <b>, <i>, <code>, <pre>, <a href>.
// All user-supplied strings must be escaped before insertion.

export interface CalendarEvent {
    id: string;
    summary: string;
    description?: string;
    location?: string;
    start: string;  // ISO 8601 datetime, or YYYY-MM-DD for all-day
    end: string;
    isAllDay: boolean;
    htmlLink?: string;
}

export function escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatTime(date: Date, timezone: string): string {
    const opts: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    };
    try {
        return date.toLocaleString('en-US', opts);
    } catch {
        return date.toLocaleString('en-US', { ...opts, timeZone: 'UTC' });
    }
}

// Parses YYYY-MM-DD as a local date to avoid UTC-offset shifting the displayed day.
function formatAllDayDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export function formatEvent(event: CalendarEvent, timezone: string): string {
    const title = escapeHtml(event.summary || '(No title)');

    let timeStr: string;
    if (event.isAllDay) {
        timeStr = `All day · ${formatAllDayDate(event.start)}`;
    } else {
        const start = new Date(event.start);
        const end = new Date(event.end);
        const endTime = end.toLocaleString('en-US', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false });
        timeStr = `${formatTime(start, timezone)} – ${endTime}`;
    }

    const lines = [
        `📅 <b>${title}</b>`,
        `⏰ ${escapeHtml(timeStr)}`,
    ];

    if (event.location) lines.push(`📍 ${escapeHtml(event.location)}`);

    if (event.description) {
        const desc = event.description.trim();
        lines.push(`📝 ${escapeHtml(desc.length > 200 ? desc.slice(0, 200) + '…' : desc)}`);
    }

    if (event.htmlLink) lines.push(`🔗 <a href="${event.htmlLink}">View in Calendar</a>`);

    return lines.join('\n');
}
