import { getRequestConfig } from 'next-intl/server';
import { routing } from '../navigation';
import fr from '../../messages/fr.json';
import ar from '../../messages/ar.json';
import en from '../../messages/en.json';

const messageMap: Record<string, any> = { fr, ar, en };

export default getRequestConfig(async ({ requestLocale }) => {
    // In next-intl v4, the locale is available via requestLocale
    let activeLocale = await requestLocale;

    // Fallback to cookie if locale is not provided (e.g., API routes)
    if (!activeLocale) {
        const { cookies } = await import('next/headers');
        const cookieStore = await cookies();
        activeLocale = cookieStore.get('NEXT_LOCALE')?.value;
    }

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
