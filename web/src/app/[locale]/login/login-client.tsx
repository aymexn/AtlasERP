'use client';

import { useState, useEffect } from 'react';
import { useRouter, Link } from '@/navigation';
import { apiFetch } from '@/lib/api';
import { useTranslations, useLocale } from 'next-intl';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signIn } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function LoginClient() {
    const t = useTranslations('login');
    const ct = useTranslations('common');
    const locale = useLocale();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [authError, setAuthError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Dynamic RTL detection
    const isRtl = locale === 'ar';

    // Zod login schema
    const loginSchema = z.object({
        email: z.string().email(isRtl ? 'البريد الإلكتروني غير صالح' : 'Adresse email invalide'),
        password: z.string().min(1, isRtl ? 'كلمة المرور مطلوبة' : 'Le mot de passe est requis')
    });

    type LoginFormValues = z.infer<typeof loginSchema>;

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: ''
        }
    });

    useEffect(() => {
        if (localStorage.getItem('atlas_token')) {
            router.push('/dashboard');
        }
    }, [router, locale]);

    const onSubmit = async (values: LoginFormValues) => {
        setLoading(true);
        setAuthError('');

        try {
            // 1. Authenticate with NestJS Backend to get jwt atlas_token
            const data = await apiFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    email: values.email,
                    password: values.password
                })
            });

            if (data?.access_token) {
                // Store in cookie and localStorage for backend API compatibility
                localStorage.setItem('atlas_token', data.access_token);
                document.cookie = `atlas_token=${data.access_token}; path=/; max-age=86400; SameSite=Lax`;
            } else {
                throw new Error('No access token received');
            }

            // 2. Sync session with NextAuth in Next.js frontend
            const signInResult = await signIn('credentials', {
                email: values.email,
                password: values.password,
                redirect: false
            });

            if (signInResult?.error) {
                console.error('NextAuth sync error:', signInResult.error);
                // We proceed since atlas_token was successfully set, but alert if needed
            }

            router.push('/dashboard');
        } catch (err: any) {
            console.error('Login error:', err);
            if (err.status === 401) {
                setAuthError(t('invalid_credentials'));
            } else {
                setAuthError(err.message || (isRtl ? 'حدث خطأ أثناء الاتصال' : 'Une erreur de connexion est survenue'));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
            className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50/30 p-4 overflow-hidden" 
            dir={isRtl ? 'rtl' : 'ltr'}
            suppressHydrationWarning
        >
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/10 blur-[120px]" />
            </div>

            {/* Language Switcher pill in top corner */}
            <div className={`absolute top-6 z-10 ${isRtl ? 'left-6' : 'right-6'}`} suppressHydrationWarning>
                <LanguageSwitcher />
            </div>

            {/* Login Card */}
            <Card className="w-full max-w-md shadow-2xl border border-slate-100/80 bg-white/90 backdrop-blur-md z-10 rounded-[2rem] overflow-hidden transition-all duration-300">
                <CardContent className="p-8 space-y-6">
                    {/* Branding */}
                    <div className="flex flex-col items-center text-center space-y-2">
                        <span className="text-3xl font-black text-slate-900 tracking-tight select-none">
                            Atlas<span className="text-[#1a56db] font-light">{ct('brand_suffix')}</span>
                        </span>
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{t('title')}</h2>
                        <p className="text-xs text-slate-400 font-medium">{t('subtitle')}</p>
                    </div>

                    {/* Authentication Errors */}
                    {authError && (
                        <Alert className="bg-rose-50 border-rose-200 text-rose-800 rounded-xl flex items-start gap-3 p-4">
                            <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                            <AlertDescription className="text-xs font-semibold leading-relaxed">
                                {authError}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Email Address */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 block px-1">
                                {t('email')}
                            </label>
                            <div className="relative">
                                <div className={`pointer-events-none absolute inset-y-0 flex items-center ${isRtl ? 'right-0 pr-4.5' : 'left-0 pl-4.5'}`}>
                                    <Mail className="h-4 w-4 text-slate-400" />
                                </div>
                                <input
                                    type="email"
                                    placeholder="admin@company.com"
                                    className={`block w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white py-3 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-200 font-medium ${
                                        isRtl ? 'pr-11 pl-4 text-right' : 'pl-11 pr-4 text-left'
                                    } ${errors.email ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10' : ''}`}
                                    {...register('email')}
                                />
                            </div>
                            {errors.email && (
                                <p className="text-[11px] font-bold text-rose-600 px-1">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <div className={`flex justify-between items-center px-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <label className="text-xs font-bold text-slate-700 block">
                                    {t('password')}
                                </label>
                                <Link 
                                    href="/login" 
                                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                                >
                                    {t('forgot_password')}
                                </Link>
                            </div>
                            <div className="relative">
                                <div className={`pointer-events-none absolute inset-y-0 flex items-center ${isRtl ? 'right-0 pr-4.5' : 'left-0 pl-4.5'}`}>
                                    <Lock className="h-4 w-4 text-slate-400" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className={`block w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white py-3 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-200 font-medium ${
                                        isRtl ? 'pr-11 pl-11 text-right' : 'pl-11 pr-11 text-left'
                                    } ${errors.password ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10' : ''}`}
                                    {...register('password')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={`absolute inset-y-0 flex items-center px-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer ${
                                        isRtl ? 'left-0' : 'right-0'
                                    }`}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-[11px] font-bold text-rose-600 px-1">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>{t('authenticating')}</span>
                                    </>
                                ) : (
                                    <span>{t('button')}</span>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Bottom Registration Link */}
                    <div className="text-center text-xs font-semibold text-slate-500 pt-2 border-t border-slate-100">
                        {t('no_account')}{' '}
                        <Link href="/register" className="font-bold text-blue-600 hover:text-blue-700 transition-colors">
                            {t('register')}
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
