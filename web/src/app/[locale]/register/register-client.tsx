'use client';

import { useState, useEffect } from 'react';
import { useRouter, Link } from '@/navigation';
import { apiFetch } from '@/lib/api';
import { useTranslations, useLocale } from 'next-intl';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export function RegisterClient() {
    const t = useTranslations('register');
    const ct = useTranslations('common');
    const locale = useLocale();

    console.log(`[RegisterPage Client] useLocale(): ${locale}`);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (localStorage.getItem('atlas_token')) {
            router.push('/dashboard');
        }
    }, [router, locale]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = await apiFetch('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });

            if (data.access_token) {
                localStorage.setItem('atlas_token', data.access_token);
                router.push('/dashboard');
            } else {
                throw new Error('No access token received');
            }
        } catch (err: any) {
            console.error('Registration error:', err);
            setError(err.message || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 font-sans">
            <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-2xl font-black text-gray-900 tracking-tighter">
                        {ct('title')}<span className="text-blue-600">{ct('brand_suffix')}</span>
                    </span>
                    <LanguageSwitcher />
                </div>

                <div className="text-center">
                    <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">{t('title')}</h2>
                    <div className="mt-3 text-gray-500">{t('subtitle')}</div>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md text-sm">
                        <div className="font-bold">{ct('error_title')}</div>
                        <div>{error}</div>
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700">{t('email')}</label>
                            <input
                                type="email"
                                required
                                placeholder="admin@company.com"
                                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700">{t('password')}</label>
                            <input
                                type="password"
                                required
                                placeholder="••••••••"
                                minLength={6}
                                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? t('registering') : t('button')}
                    </button>
                </form>

                <div className="text-center text-sm text-gray-600">
                    {t('have_account')}{' '}
                    <Link href="/login" className="font-bold text-blue-600 hover:text-blue-500 transition-colors">
                        {t('login')}
                    </Link>
                </div>
            </div>
        </div>
    );
}
