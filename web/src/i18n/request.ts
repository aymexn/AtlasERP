import { getRequestConfig } from 'next-intl/server';
import { routing } from '../navigation';
import fr from '../../messages/fr.json';
import ar from '../../messages/ar.json';
import en from '../../messages/en.json';

const messageMap: Record<string, any> = { fr, ar, en };

export default getRequestConfig(async ({ locale }) => {
    // In next-intl v4, locale might be a string or a promise
    let activeLocale = await locale;

    console.log(`[getRequestConfig] RECEIVED LOCALE: "${activeLocale}"`);

    // Fallback if still undefined or invalid
    if (!activeLocale || !routing.locales.includes(activeLocale as any)) {
        console.warn(`[getRequestConfig] Falling back to default: ${routing.defaultLocale}`);
        activeLocale = routing.defaultLocale;
    }

    return {
        locale: activeLocale,
        messages: messageMap[activeLocale]
    };
});
