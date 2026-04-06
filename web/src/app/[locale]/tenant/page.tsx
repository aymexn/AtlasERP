import { setRequestLocale } from 'next-intl/server';
import { TenantClient } from './tenant-client';

export default async function TenantPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);

    return <TenantClient />;
}
