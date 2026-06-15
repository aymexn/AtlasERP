import { setRequestLocale } from 'next-intl/server';
import { LoginContainer } from './login-container';

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);

    return <LoginContainer />;
}
