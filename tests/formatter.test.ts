import { formatEvent, escapeHtml, CalendarEvent } from '../src/formatter';

const timedEvent: CalendarEvent = {
    id: 'abc123',
    summary: 'Team Standup',
    start: '2024-08-19T09:00:00+03:00',
    end: '2024-08-19T09:30:00+03:00',
    isAllDay: false,
    location: 'Conference Room B',
    htmlLink: 'https://calendar.google.com/event?eid=abc123',
};

const allDayEvent: CalendarEvent = {
    id: 'def456',
    summary: 'Company Holiday',
    start: '2024-08-19',
    end: '2024-08-20',
    isAllDay: true,
};

const eventWithSpecialChars: CalendarEvent = {
    id: 'ghi789',
    summary: 'Q&A Session <important>',
    description: 'Discuss sales > targets & plans',
    start: '2024-08-19T14:00:00Z',
    end: '2024-08-19T15:00:00Z',
    isAllDay: false,
};

const longDescriptionEvent: CalendarEvent = {
    id: 'jkl012',
    summary: 'Planning Meeting',
    description: 'x'.repeat(300),
    start: '2024-08-20T10:00:00Z',
    end: '2024-08-20T11:00:00Z',
    isAllDay: false,
};

describe('escapeHtml', () => {
    it('escapes ampersands', () => expect(escapeHtml('a & b')).toBe('a &amp; b'));
    it('escapes less-than', () => expect(escapeHtml('a < b')).toBe('a &lt; b'));
    it('escapes greater-than', () => expect(escapeHtml('a > b')).toBe('a &gt; b'));
    it('escapes multiple special characters', () =>
        expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;'));
    it('leaves plain strings unchanged', () => expect(escapeHtml('Hello World')).toBe('Hello World'));
});

describe('formatEvent — timed event', () => {
    it('wraps title in <b> tags', () => expect(formatEvent(timedEvent, 'UTC')).toContain('<b>Team Standup</b>'));
    it('includes location', () => expect(formatEvent(timedEvent, 'UTC')).toContain('📍 Conference Room B'));
    it('includes calendar link', () => expect(formatEvent(timedEvent, 'UTC')).toContain('https://calendar.google.com/event?eid=abc123'));
    it('includes time line', () => expect(formatEvent(timedEvent, 'UTC')).toContain('⏰'));
});

describe('formatEvent — all-day event', () => {
    it('shows "All day" indicator', () => expect(formatEvent(allDayEvent, 'UTC')).toContain('All day'));
    it('includes the event title', () => expect(formatEvent(allDayEvent, 'UTC')).toContain('Company Holiday'));
    it('omits location line when not provided', () => expect(formatEvent(allDayEvent, 'UTC')).not.toContain('📍'));
});

describe('formatEvent — HTML escaping', () => {
    it('escapes special characters in summary', () => expect(formatEvent(eventWithSpecialChars, 'UTC')).toContain('Q&amp;A Session &lt;important&gt;'));
    it('escapes special characters in description', () => expect(formatEvent(eventWithSpecialChars, 'UTC')).toContain('&gt; targets &amp; plans'));
});

describe('formatEvent — description truncation', () => {
    it('truncates at 200 chars and appends ellipsis', () => {
        const result = formatEvent(longDescriptionEvent, 'UTC');
        const match = result.match(/📝 (.+)/);
        expect(match).not.toBeNull();
        expect(match![1]).toBe('x'.repeat(200) + '…');
    });

    it('does not truncate descriptions at or under 200 chars', () => {
        const result = formatEvent({ ...longDescriptionEvent, description: 'Short description' }, 'UTC');
        expect(result).toContain('Short description');
        expect(result).not.toContain('…');
    });
});
