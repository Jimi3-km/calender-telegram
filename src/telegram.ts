import axios, { AxiosError } from 'axios';

type TelegramResponse = { ok: boolean; description?: string };

export async function sendMessage(botToken: string, chatId: string, text: string): Promise<void> {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    try {
        const { data } = await axios.post<TelegramResponse>(url, {
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
        });

        if (!data.ok) {
            throw new Error(`Telegram API returned ok=false: ${data.description ?? 'unknown error'}`);
        }
    } catch (err) {
        if (err instanceof AxiosError) {
            const status = err.response?.status ?? 'no status';
            const desc = (err.response?.data as TelegramResponse | undefined)?.description ?? err.message;
            throw new Error(`[telegram] HTTP ${status}: ${desc}`);
        }
        throw err;
    }
}
