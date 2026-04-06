'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from '@/navigation';
import { apiFetch, probeBackendHealth } from '@/lib/api';
import { useLocale, useTranslations } from 'next-intl';
import { AlertCircle, RefreshCw, Loader2, Wifi, WifiOff, CheckCircle2 } from 'lucide-react';

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

    const router = useRouter();
    const pathname = usePathname();
    const locale = useLocale();
    const t = useTranslations('common');

    // ── Auth Check ────────────────────────────────────────────────────────────
    const checkAuth = useCallback(async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('atlas_token') : null;

        if (!token) {
            setPhase('ok');
            return;
        }

        try {
            const tenant = await apiFetch('/tenants/me');

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
            <div className="fixed inset-0 bg-slate-950 z-[9999] flex items-center justify-center">
                <div className="flex flex-col items-center gap-5">
                    <div className="relative">
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/30">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                <path d="M6 16L13 23L26 9" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <div className="absolute -inset-1 rounded-2xl border-2 border-blue-400/30 animate-ping" />
                    </div>
                    <p className="text-sm font-semibold text-slate-400 tracking-widest uppercase animate-pulse">
                        {t('loading')}
                    </p>
                </div>
            </div>
        );
    }

    // ─── Render: Reconnecting / Retrying ──────────────────────────────────────
    if (phase === 'reconnecting' || phase === 'retrying') {
        const delayLabels = ['1s', '3s', '5s'];
        return (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                <div className="w-full max-w-sm bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl p-8 space-y-6">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="h-14 w-14 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                            <Wifi size={26} className="text-amber-400 animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Reconnecting…</h2>
                            <p className="text-sm text-slate-400 mt-1">
                                Attempt {retryAttempt} of 3
                                {retryAttempt > 0 && ` · waiting ${delayLabels[retryAttempt - 1]}`}
                            </p>
                        </div>
                    </div>

                    {/* Progress dots */}
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className={`h-2 w-2 rounded-full transition-all duration-300 ${
                                    i <= retryAttempt ? 'bg-amber-400 scale-125' : 'bg-slate-700'
                                }`}
                            />
                        ))}
                    </div>

                    <p className="text-xs text-slate-500 text-center">
                        Connection lost. Retrying automatically with exponential backoff…
                    </p>
                </div>
            </div>
        );
    }

    // ─── Render: Restored ─────────────────────────────────────────────────────
    if (phase === 'restored') {
        return (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                <div className="w-full max-w-sm bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl p-8">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="h-14 w-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <CheckCircle2 size={28} className="text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Connection Restored</h2>
                            <p className="text-sm text-slate-400 mt-1">Backend is responding normally.</p>
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
            <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl p-8 space-y-6">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className={`h-14 w-14 rounded-xl flex items-center justify-center border ${
                            isCritical
                                ? 'bg-red-500/10 border-red-500/20'
                                : 'bg-orange-500/10 border-orange-500/20'
                        }`}>
                            <WifiOff size={26} className={isCritical ? 'text-red-400' : 'text-orange-400'} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">
                                {isCritical ? '⚠ CRITICAL — Backend Unreachable' : 'Backend Unreachable'}
                            </h2>
                            <p className="text-sm text-slate-400 mt-1">
                                {isCritical
                                    ? 'All retry attempts failed. Start the backend server manually.'
                                    : "Couldn't connect to AtlasERP server. The backend may be down."}
                            </p>
                        </div>
                    </div>

                    {isCritical && (
                        <div className="bg-slate-800 rounded-xl p-4 space-y-2 text-left">
                            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Manual Fix</p>
                            <code className="text-xs text-emerald-400 block">cd AtlasERP/backend</code>
                            <code className="text-xs text-emerald-400 block">npm run start:dev</code>
                        </div>
                    )}

                    <div className="space-y-3">
                        <button
                            onClick={handleManualRetry}
                            disabled={isCritical}
                            className={`w-full px-6 py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                                isCritical
                                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 active:scale-95'
                            }`}
                        >
                            <RefreshCw size={16} />
                            {isCritical
                                ? `Max retries reached (${manualRestarts}/${MAX_MANUAL_RESTARTS})`
                                : `Retry Connection (${manualRestarts}/${MAX_MANUAL_RESTARTS})`}
                        </button>
                        {!isCritical && (
                            <p className="text-xs text-slate-500 text-center">
                                Auto-retry with 1s → 3s → 5s backoff
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
