import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '../../navigation';

// Manual imports as a fallback for getMessages()
import fr from '../../../messages/fr.json';
import ar from '../../../messages/ar.json';
import en from '../../../messages/en.json';

const messageMap: Record<string, any> = { fr, ar, en };

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Use manual map to ensure correct messages are provided
  const messages = messageMap[locale] || fr;
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <main dir={direction} className="min-h-screen">
        {children}
      </main>
    </NextIntlClientProvider>
  );
}
