'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from '@/navigation';
import { apiFetch, probeBackendHealth } from '@/lib/api';
import { useLocale, useTranslations } from 'next-intl';
import { AlertCircle, RefreshCw, Loader2, Wifi, WifiOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';

// ─── Recovery Phase State Machine ────────────────────────────────────────────
type Phase =
    | 'loading'         // Initial auth check
    | 'reconnecting'    // Retry in progress (1st attempt)
    | 'retrying'        // Retry in progress (2nd+ attempt)
    | 'critical'        // Max retries exhausted
    | 'restored'        // Just reconnected — brief success flash
    | 'error'           // Non-network error
    | 'ok';             // Fully authenticated

const MAX_MANUAL_RESTARTS = 3;

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
    const [phase, setPhase] = useState<Phase>('loading');
    const [retryAttempt, setRetryAttempt] = useState(0);
    const [manualRestarts, setManualRestarts] = useState(0);
    const { user, setUser } = useAuth();

    const router = useRouter();
    const pathname = usePathname();
    const locale = useLocale();
    const t = useTranslations('common');
    const rt = useTranslations('recovery');

    // ── Auth Check ────────────────────────────────────────────────────────────
    const checkAuth = useCallback(async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('atlas_token') : null;

        if (!token) {
            setPhase('ok');
            return;
        }

        try {
            const tenant = await apiFetch('/tenants/me');
            if (tenant?.user) {
                setUser(tenant.user);
            }

            if (!tenant && !pathname.includes('/tenant')) {
                router.push('/tenant');
                return;
            }
            if (tenant && pathname.includes('/tenant')) {
                router.push('/dashboard');
                return;
            }

            // Brief "restored" flash if we were recovering
            if (phase === 'reconnecting' || phase === 'retrying') {
                setPhase('restored');
                setTimeout(() => setPhase('ok'), 2000);
            } else {
                setPhase('ok');
            }
        } catch (err: any) {
            if (err.message === 'NETWORK_ERROR' || err.message === 'TIMEOUT') {
                setPhase('critical');
            } else {
                setPhase('error');
            }
        }
    }, [router, pathname, locale, phase]);

    // ── Listen to recovery events from api.ts ─────────────────────────────────
    useEffect(() => {
        const onReconnecting = (e: Event) => {
            const { attempt, maxRetries } = (e as CustomEvent).detail;
            setRetryAttempt(attempt);
            setPhase(attempt === 1 ? 'reconnecting' : 'retrying');
        };

        const onCritical = () => setPhase('critical');

        const onRestored = () => {
            setPhase((current) => {
                if (current === 'reconnecting' || current === 'retrying' || current === 'critical') {
                    return 'restored';
                }
                return current;
            });
        };

        window.addEventListener('atlas:reconnecting', onReconnecting);
        window.addEventListener('atlas:connection-critical', onCritical);
        window.addEventListener('atlas:connection-restored', onRestored);

        return () => {
            window.removeEventListener('atlas:reconnecting', onReconnecting);
            window.removeEventListener('atlas:connection-critical', onCritical);
            window.removeEventListener('atlas:connection-restored', onRestored);
        };
    }, []);

    // ── Initial auth check ────────────────────────────────────────────────────
    useEffect(() => {
        checkAuth();
    }, [router, pathname, locale]);

    // ── Handle "Restored" success flash timeout ────────────────────────────────
    useEffect(() => {
        if (phase === 'restored') {
            const timer = setTimeout(() => setPhase('ok'), 2000);
            return () => clearTimeout(timer);
        }
    }, [phase]);

    // ── Manual retry (with limit) ─────────────────────────────────────────────
    const handleManualRetry = useCallback(async () => {
        if (manualRestarts >= MAX_MANUAL_RESTARTS) return;
        setManualRestarts((c) => c + 1);
        setPhase('reconnecting');
        setRetryAttempt(0);

        // Quick health probe first
        const healthy = await probeBackendHealth();
        if (!healthy) {
            await new Promise((r) => setTimeout(r, 1500));
            setPhase('critical');
            return;
        }

        checkAuth();
    }, [manualRestarts, checkAuth]);

    // ─── Render: Loading ──────────────────────────────────────────────────────
    if (phase === 'loading') {
        return (
            <div className="fixed inset-0 bg-white z-9999 flex items-center justify-center" suppressHydrationWarning>
                <div className="flex flex-col items-center gap-5">
                    <div className="relative">
                        <div className="h-16 w-16 rounded-2xl bg-linear-to-br from-primary to-blue-700 flex items-center justify-center shadow-2xl shadow-primary/20">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                <path d="M6 16L13 23L26 9" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <div className="absolute -inset-1 rounded-2xl border-2 border-primary/20 animate-ping" />
                    </div>
                    <div className="text-xs font-black text-gray-400 tracking-[0.2em] uppercase animate-pulse">
                        {t('loading')}
                    </div>
                </div>
            </div>
        );
    }

    // ─── Render: Reconnecting / Retrying ──────────────────────────────────────
    if (phase === 'reconnecting' || phase === 'retrying') {
        const delayLabels = ['1s', '3s', '5s'];
        return (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-9999 flex items-center justify-center p-4">
                <div className="w-full max-w-sm bg-white border border-gray-100 rounded-2xl shadow-2xl p-8 space-y-6">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="h-14 w-14 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                            <Wifi size={26} className="text-primary animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-gray-900 tracking-tight">{rt('reconnecting')}</h2>
                            <div className="text-sm text-gray-400 font-bold mt-1">
                                {rt('attempt', { attempt: retryAttempt })}
                                {retryAttempt > 0 && ` · ${rt('waiting', { delay: delayLabels[retryAttempt - 1] })}`}
                            </div>
                        </div>
                    </div>

                    {/* Progress dots */}
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className={`h-2 w-2 rounded-full transition-all duration-300 ${
                                    i <= retryAttempt ? 'bg-primary scale-125' : 'bg-gray-200'
                                }`}
                            />
                        ))}
                    </div>

                    <div className="text-[11px] font-bold text-gray-400 text-center uppercase tracking-widest">
                        {rt('lost')}
                    </div>
                </div>
            </div>
        );
    }

    // ─── Render: Restored ─────────────────────────────────────────────────────
    if (phase === 'restored') {
        return (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-9999 flex items-center justify-center p-4">
                <div className="w-full max-w-sm bg-white border border-success/30 rounded-2xl shadow-2xl p-8">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="h-14 w-14 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center">
                            <CheckCircle2 size={28} className="text-success" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-gray-900 tracking-tight">{rt('restored')}</h2>
                            <div className="text-sm text-gray-400 font-bold mt-1">{rt('responding')}</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Render: Critical ─────────────────────────────────────────────────────
    if (phase === 'critical' || phase === 'error') {
        const isCritical = manualRestarts >= MAX_MANUAL_RESTARTS;
        return (
            <div className="fixed inset-0 bg-white/95 backdrop-blur-md z-9999 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-2xl p-8 space-y-6">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className={`h-14 w-14 rounded-xl flex items-center justify-center border ${
                            isCritical
                                ? 'bg-red-50 border-red-100'
                                : 'bg-blue-50 border-blue-100'
                        }`}>
                            <WifiOff size={26} className={isCritical ? 'text-red-500' : 'text-primary'} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-gray-900 tracking-tight">
                                {isCritical ? rt('critical_title') : rt('unreachable')}
                            </h2>
                            <div className="text-sm text-gray-400 font-bold mt-1">
                                {isCritical
                                    ? rt('start_manual')
                                    : rt('down_msg')}
                            </div>
                        </div>
                    </div>
                    {isCritical && (
                        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-left border border-gray-100">
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{rt('manual_fix')}</div>
                            <code className="text-xs text-primary font-bold block">cd AtlasERP/backend</code>
                            <code className="text-xs text-primary font-bold block">npm run start:dev</code>
                        </div>
                    )}

                    <div className="space-y-3">
                        <button
                            onClick={handleManualRetry}
                            disabled={isCritical}
                            className={`w-full px-6 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                                isCritical
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-primary hover:bg-blue-700 text-white shadow-xl shadow-blue-200 active:scale-95'
                            }`}
                        >
                            <RefreshCw size={14} strokeWidth={3} />
                            {isCritical
                                ? rt('max_reached', { count: manualRestarts, max: MAX_MANUAL_RESTARTS })
                                : rt('retry_btn', { count: manualRestarts, max: MAX_MANUAL_RESTARTS })}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <SocketProvider userId={user?.id}>
            {children}
        </SocketProvider>
    );
}

