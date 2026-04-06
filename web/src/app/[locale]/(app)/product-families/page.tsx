import { setRequestLocale } from 'next-intl/server';
import FamiliesClient from './families-client';

export default async function FamiliesPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);

    return <FamiliesClient />;
}
