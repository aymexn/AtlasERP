import { setRequestLocale } from 'next-intl/server';
import LeavesClient from './leaves-client';

export default async function LeavesPage({
    params
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);

    return <LeavesClient />;
}
