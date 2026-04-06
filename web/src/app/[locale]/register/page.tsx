import { setRequestLocale } from 'next-intl/server';
import { RegisterClient } from './register-client';

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);

    return <RegisterClient />;
}
