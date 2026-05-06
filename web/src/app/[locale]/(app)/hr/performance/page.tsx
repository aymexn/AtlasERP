import { setRequestLocale } from 'next-intl/server';
import PerformanceClient from './performance-client';

export default async function PerformancePage({
    params
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);

    return <PerformanceClient />;
}
