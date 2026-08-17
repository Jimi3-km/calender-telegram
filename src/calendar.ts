import { google, calendar_v3 } from 'googleapis';
import { CalendarEvent } from './formatter';

export async function fetchUpcomingEvents(
    keyFilePath: string,
    calendarId: string,
    lookaheadMinutes: number,
): Promise<CalendarEvent[]> {
    const auth = new google.auth.GoogleAuth({
        keyFile: keyFilePath,
        scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });
    const calendar = google.calendar({ version: 'v3', auth });

    const now = new Date();
    const timeMax = new Date(now.getTime() + lookaheadMinutes * 60 * 1000).toISOString();

    const { data } = await calendar.events.list({
        calendarId,
        timeMin: now.toISOString(),
        timeMax,
        singleEvents: true,  // expand recurring events into individual instances
        orderBy: 'startTime',
        maxResults: 50,
    });

    return (data.items ?? [])
        .filter((item): item is calendar_v3.Schema$Event & { id: string; start: calendar_v3.Schema$EventDateTime } =>
            typeof item.id === 'string' && item.id.length > 0 && item.start != null
        )
        .map((item) => {
            const isAllDay = typeof item.start.date === 'string' && !item.start.dateTime;
            const startStr = isAllDay ? (item.start.date as string) : (item.start.dateTime as string);
            const endStr = isAllDay ? (item.end?.date ?? startStr) : (item.end?.dateTime ?? startStr);

            return {
                id: item.id,
                summary: item.summary ?? '(No title)',
                description: item.description ?? undefined,
                location: item.location ?? undefined,
                start: startStr,
                end: endStr,
                isAllDay,
                htmlLink: item.htmlLink ?? undefined,
            };
        });
}
