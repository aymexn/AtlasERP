'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/navigation';
import { apiFetch } from '@/lib/api';
import { useTranslations, useLocale } from 'next-intl';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export function TenantClient() {
    const t = useTranslations('tenant');
    const ct = useTranslations('common');
    const locale = useLocale();

    console.log(`[TenantClient] useLocale(): ${locale}`);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('atlas_token');
        if (!token) {
            console.warn('[Tenant] No token found. Redirecting to login.');
            router.push('/login');
            return;
        }
        checkTenant();
    }, [router, locale]);

    const checkTenant = async () => {
        try {
            const data = await apiFetch('/tenants/me');
            if (data) {
                router.push('/dashboard');
            }
        } catch (err) {
            // No tenant found yet
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await apiFetch('/tenants', {
                method: 'POST',
                body: JSON.stringify({ name, slug }),
            });
            router.push('/dashboard');
        } catch (err: any) {
            console.error('Tenant creation error:', err);
            setError(err.message || 'Tenant creation failed.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-gray-500 font-bold animate-pulse">{t('initializing')}</div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 font-sans">
            <div className="w-full max-w-lg space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-2xl font-black text-gray-900 tracking-tighter">{ct('title')}<span className="text-blue-600">{ct('brand_suffix')}</span></span>
                    <LanguageSwitcher />
                </div>

                <div className="text-center">
                    <h2 className="text-3xl font-black text-gray-900">{t('title')}</h2>
                    <div className="mt-3 text-gray-500">{t('subtitle')}</div>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md text-sm">
                        {error}
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleCreate}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">{t('name')}</label>
                            <input
                                type="text"
                                required
                                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Example Corp"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">{t('slug')}</label>
                            <input
                                type="text"
                                required
                                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                placeholder="example-corp"
                            />
                            <div className="mt-2 text-xs text-gray-400">{t('slug_hint')}</div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-4 px-4 border border-transparent rounded-lg shadow-lg text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        {loading ? t('finalizing') : t('button')}
                    </button>
                </form>
            </div>
        </div>
    );
}
