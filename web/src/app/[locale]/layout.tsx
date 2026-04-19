import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '../../navigation';

// Manual imports for French-only production
import fr from '../../../messages/fr.json';

const messageMap: Record<string, any> = { fr };

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (locale !== 'fr') {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Use manual map to ensure correct messages are provided
  const messages = messageMap.fr;
  const direction = 'ltr';

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
        <main dir={direction} className="min-h-screen text-foreground selection:bg-primary/20 bg-gray-50/50">
          {children}
        </main>
    </NextIntlClientProvider>
  );
}
