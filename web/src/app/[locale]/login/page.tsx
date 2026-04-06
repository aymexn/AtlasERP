import { setRequestLocale } from 'next-intl/server';
import { LoginClient } from './login-client';

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);

    return <LoginClient />;
}
