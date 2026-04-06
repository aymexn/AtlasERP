import { setRequestLocale } from 'next-intl/server';
import ReceptionsClient from './receptions-client';

export default async function ReceptionsPage({
    params
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);

    return <ReceptionsClient />;
}
