'use client';

import { useState, useEffect } from 'react';
import { useRouter, Link } from '@/navigation';
import { apiFetch } from '@/lib/api';
import { useTranslations, useLocale } from 'next-intl';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, Building2, FileText, User, Phone } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { signIn } from 'next-auth/react';

export function RegisterClient() {
    const t = useTranslations('register');
    const ct = useTranslations('common');
    const locale = useLocale();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [authError, setAuthError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Dynamic RTL detection
    const isRtl = locale === 'ar';

    // Zod register schema
    const registerSchema = z.object({
        companyName: z.string().min(2, isRtl ? 'يجب أن يحتوي اسم الشركة على حرفين على الأقل' : 'Le nom de l\'entreprise doit contenir au moins 2 caractères'),
        nif: z.string().regex(/^\d{15}$/, isRtl ? 'يجب أن يتكون الرقم التعريف الضريبي NIF من 15 رقماً' : 'Le NIF doit contenir exactement 15 chiffres'),
        nis: z.string().regex(/^\d{15}$/, isRtl ? 'يجب أن يتكون رقم التعريف الإحصائي NIS من 15 رقماً' : 'Le NIS doit contenir exactement 15 chiffres'),
        rc: z.string().regex(/^\d{2}\/\d{2}-\d{7}[A-Z]\d{2}$/, isRtl ? 'صيغة السجل التجari غير صالحة (00/00-0000000B15)' : 'Format du RC invalide. Attendu: 00/00-0000000B15'),
        ai: z.string().optional(),
        companyEmail: z.string().email(isRtl ? 'البريد الإلكتروني للشركة غير صالح' : 'Email de l\'entreprise invalide'),
        companyPhone: z.string().optional(),
        
        adminName: z.string().min(2, isRtl ? 'يجب أن يحتوي الاسم الكامل على حرفين على الأقل' : 'Le nom complet doit contenir au moins 2 caractères'),
        adminEmail: z.string().email(isRtl ? 'البريد الإلكتروني للمسؤول غير صالح' : 'Email de l\'administrateur invalide'),
        adminPhone: z.string().regex(/^\+213\d{8,9}$/, isRtl ? 'يجب أن يبدأ الهاتف بـ +213 ويتبعه 8 أو 9 أرقام' : 'Téléphone invalide. Attendu: +213XXXXXXXXX'),
        password: z.string().min(8, isRtl ? 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل' : 'Le mot de passe doit contenir au moins 8 caractères'),
        confirmPassword: z.string().min(8, isRtl ? 'تأكيد كلمة المرور مطلوب' : 'La confirmation du mot de passe est requise')
    }).refine((data) => data.password === data.confirmPassword, {
        message: isRtl ? 'كلمتا المرور غير متطابقتين' : 'Les mots de passe ne correspondent pas',
        path: ['confirmPassword']
    });

    type RegisterFormValues = z.infer<typeof registerSchema>;

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            companyName: '',
            nif: '',
            nis: '',
            rc: '',
            ai: '',
            companyEmail: '',
            companyPhone: '',
            adminName: '',
            adminEmail: '',
            adminPhone: '',
            password: '',
            confirmPassword: ''
        }
    });

    useEffect(() => {
        if (localStorage.getItem('atlas_token')) {
            router.push('/dashboard');
        }
    }, [router, locale]);

    const onSubmit = async (values: RegisterFormValues) => {
        setLoading(true);
        setAuthError('');

        const payload = {
            company: {
                name: values.companyName,
                nif: values.nif,
                rc: values.rc,
                nis: values.nis,
                ai: values.ai || null,
                email: values.companyEmail,
                phone: values.companyPhone || null
            },
            admin: {
                name: values.adminName,
                email: values.adminEmail,
                password: values.password
            }
        };

        try {
            const data = await apiFetch('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (data?.success) {
                toast.success(t('success_message'));
                
                // 1. Authenticate with NestJS Backend to get jwt atlas_token
                try {
                    const loginData = await apiFetch('/auth/login', {
                        method: 'POST',
                        body: JSON.stringify({
                            email: values.adminEmail,
                            password: values.password
                        })
                    });

                    if (loginData?.access_token) {
                        localStorage.setItem('atlas_token', loginData.access_token);
                        document.cookie = `atlas_token=${loginData.access_token}; path=/; max-age=86400; SameSite=Lax`;
                    }
                } catch (loginErr) {
                    console.error('Auto-login backend authentication failed:', loginErr);
                }

                // 2. Sync session with NextAuth in Next.js frontend
                await signIn('credentials', {
                    email: values.adminEmail,
                    password: values.password,
                    redirect: true,
                    callbackUrl: `/${locale}/dashboard`
                });
            } else {
                throw new Error(isRtl ? 'فشل إنشاء الحساب' : 'Échec de l\'inscription');
            }
        } catch (err: any) {
            console.error('Registration error:', err);
            setAuthError(err.message || (isRtl ? 'حدث خطأ أثناء التسجيل' : 'Une erreur est survenue lors de l\'inscription'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
            className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50/30 p-4 py-12 overflow-hidden" 
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

            {/* Registration Card */}
            <Card className="w-full max-w-2xl shadow-2xl border border-slate-100/80 bg-white/90 backdrop-blur-md z-10 rounded-[2.5rem] overflow-hidden transition-all duration-300">
                <CardContent className="p-8 space-y-6">
                    {/* Branding */}
                    <div className="flex flex-col items-center text-center space-y-2">
                        <span className="text-3xl font-black text-slate-900 tracking-tight select-none">
                            Atlas<span className="text-[#1a56db] font-light">{ct('brand_suffix')}</span>
                        </span>
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{t('title')}</h2>
                        <p className="text-xs text-slate-400 font-medium">{t('subtitle')}</p>
                    </div>

                    {/* Registration Errors */}
                    {authError && (
                        <Alert className="bg-rose-50 border-rose-200 text-rose-800 rounded-xl flex items-start gap-3 p-4">
                            <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                            <AlertDescription className="text-xs font-semibold leading-relaxed">
                                {authError}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Registration Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        
                        {/* SECTION 1 — Informations de l'Entreprise */}
                        <div className="space-y-4">
                            <div className={`flex items-center gap-2 pb-2 border-b border-slate-100 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <Building2 size={16} className="text-blue-600" />
                                <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase">
                                    {t('section1_title')}
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Raison Sociale */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 block px-1">
                                        {t('companyName')} *
                                    </label>
                                    <div className="relative">
                                        <div className={`pointer-events-none absolute inset-y-0 flex items-center ${isRtl ? 'right-0 pr-4' : 'left-0 pl-4'}`}>
                                            <Building2 className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Sarl Alpha Digit"
                                            className={`block w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white py-2.5 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-200 font-medium ${
                                                isRtl ? 'pr-10.5 pl-4 text-right' : 'pl-10.5 pr-4 text-left'
                                            }`}
                                            {...register('companyName')}
                                        />
                                    </div>
                                    {errors.companyName && (
                                        <p className="text-[11px] font-bold text-rose-600 px-1">{errors.companyName.message}</p>
                                    )}
                                </div>

                                {/* Article d'Imposition */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 block px-1">
                                        {t('ai')}
                                    </label>
                                    <div className="relative">
                                        <div className={`pointer-events-none absolute inset-y-0 flex items-center ${isRtl ? 'right-0 pr-4' : 'left-0 pl-4'}`}>
                                            <FileText className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="16234567890"
                                            className={`block w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white py-2.5 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-200 font-medium ${
                                                isRtl ? 'pr-10.5 pl-4 text-right' : 'pl-10.5 pr-4 text-left'
                                            }`}
                                            {...register('ai')}
                                        />
                                    </div>
                                    {errors.ai && (
                                        <p className="text-[11px] font-bold text-rose-600 px-1">{errors.ai.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* NIF */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 block px-1">
                                        {t('nif')} *
                                    </label>
                                    <div className="relative">
                                        <div className={`pointer-events-none absolute inset-y-0 flex items-center ${isRtl ? 'right-0 pr-4' : 'left-0 pl-4'}`}>
                                            <FileText className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            maxLength={15}
                                            placeholder="000116090000123"
                                            className={`block w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white py-2.5 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-200 font-medium ${
                                                isRtl ? 'pr-10.5 pl-4 text-right' : 'pl-10.5 pr-4 text-left'
                                            }`}
                                            {...register('nif')}
                                        />
                                    </div>
                                    {errors.nif && (
                                        <p className="text-[11px] font-bold text-rose-600 px-1">{errors.nif.message}</p>
                                    )}
                                </div>

                                {/* NIS */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 block px-1">
                                        {t('nis')} *
                                    </label>
                                    <div className="relative">
                                        <div className={`pointer-events-none absolute inset-y-0 flex items-center ${isRtl ? 'right-0 pr-4' : 'left-0 pl-4'}`}>
                                            <FileText className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            maxLength={15}
                                            placeholder="123456789012345"
                                            className={`block w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white py-2.5 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-200 font-medium ${
                                                isRtl ? 'pr-10.5 pl-4 text-right' : 'pl-10.5 pr-4 text-left'
                                            }`}
                                            {...register('nis')}
                                        />
                                    </div>
                                    {errors.nis && (
                                        <p className="text-[11px] font-bold text-rose-600 px-1">{errors.nis.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* RC */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 block px-1">
                                        {t('rc')} *
                                    </label>
                                    <div className="relative">
                                        <div className={`pointer-events-none absolute inset-y-0 flex items-center ${isRtl ? 'right-0 pr-4' : 'left-0 pl-4'}`}>
                                            <FileText className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="23/00-1234567B15"
                                            className={`block w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white py-2.5 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-200 font-medium ${
                                                isRtl ? 'pr-10.5 pl-4 text-right' : 'pl-10.5 pr-4 text-left'
                                            }`}
                                            {...register('rc')}
                                        />
                                    </div>
                                    {errors.rc && (
                                        <p className="text-[11px] font-bold text-rose-600 px-1">{errors.rc.message}</p>
                                    )}
                                </div>

                                {/* Company Email */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 block px-1">
                                        {t('companyEmail')} *
                                    </label>
                                    <div className="relative">
                                        <div className={`pointer-events-none absolute inset-y-0 flex items-center ${isRtl ? 'right-0 pr-4' : 'left-0 pl-4'}`}>
                                            <Mail className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="email"
                                            placeholder="contact@company.com"
                                            className={`block w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white py-2.5 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-200 font-medium ${
                                                isRtl ? 'pr-10.5 pl-4 text-right' : 'pl-10.5 pr-4 text-left'
                                            }`}
                                            {...register('companyEmail')}
                                        />
                                    </div>
                                    {errors.companyEmail && (
                                        <p className="text-[11px] font-bold text-rose-600 px-1">{errors.companyEmail.message}</p>
                                    )}
                                </div>
                            </div>

                            {/* Company Phone */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 block px-1">
                                    {t('companyPhone')}
                                </label>
                                <div className="relative">
                                    <div className={`pointer-events-none absolute inset-y-0 flex items-center ${isRtl ? 'right-0 pr-4' : 'left-0 pl-4'}`}>
                                        <Phone className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="+21321000000"
                                        className={`block w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white py-2.5 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-200 font-medium ${
                                            isRtl ? 'pr-10.5 pl-4 text-right' : 'pl-10.5 pr-4 text-left'
                                        }`}
                                        {...register('companyPhone')}
                                    />
                                </div>
                                {errors.companyPhone && (
                                    <p className="text-[11px] font-bold text-rose-600 px-1">{errors.companyPhone.message}</p>
                                )}
                            </div>
                        </div>

                        {/* SECTION 2 — Compte Administrateur */}
                        <div className="space-y-4 pt-2">
                            <div className={`flex items-center gap-2 pb-2 border-b border-slate-100 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <User size={16} className="text-blue-600" />
                                <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase">
                                    {t('section2_title')}
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Nom Complet */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 block px-1">
                                        {t('adminName')} *
                                    </label>
                                    <div className="relative">
                                        <div className={`pointer-events-none absolute inset-y-0 flex items-center ${isRtl ? 'right-0 pr-4' : 'left-0 pl-4'}`}>
                                            <User className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Mohamed Belkacem"
                                            className={`block w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white py-2.5 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-200 font-medium ${
                                                isRtl ? 'pr-10.5 pl-4 text-right' : 'pl-10.5 pr-4 text-left'
                                            }`}
                                            {...register('adminName')}
                                        />
                                    </div>
                                    {errors.adminName && (
                                        <p className="text-[11px] font-bold text-rose-600 px-1">{errors.adminName.message}</p>
                                    )}
                                </div>

                                {/* Email Administrateur */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 block px-1">
                                        {t('adminEmail')} *
                                    </label>
                                    <div className="relative">
                                        <div className={`pointer-events-none absolute inset-y-0 flex items-center ${isRtl ? 'right-0 pr-4' : 'left-0 pl-4'}`}>
                                            <Mail className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="email"
                                            placeholder="admin@company.com"
                                            className={`block w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white py-2.5 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-200 font-medium ${
                                                isRtl ? 'pr-10.5 pl-4 text-right' : 'pl-10.5 pr-4 text-left'
                                            }`}
                                            {...register('adminEmail')}
                                        />
                                    </div>
                                    {errors.adminEmail && (
                                        <p className="text-[11px] font-bold text-rose-600 px-1">{errors.adminEmail.message}</p>
                                    )}
                                </div>
                            </div>

                            {/* Téléphone Administrateur */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 block px-1">
                                    {t('adminPhone')} *
                                </label>
                                <div className="relative">
                                    <div className={`pointer-events-none absolute inset-y-0 flex items-center ${isRtl ? 'right-0 pr-4' : 'left-0 pl-4'}`}>
                                        <Phone className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="+213550123456"
                                        className={`block w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white py-2.5 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-200 font-medium ${
                                            isRtl ? 'pr-10.5 pl-4 text-right' : 'pl-10.5 pr-4 text-left'
                                        }`}
                                        {...register('adminPhone')}
                                    />
                                </div>
                                {errors.adminPhone && (
                                    <p className="text-[11px] font-bold text-rose-600 px-1">{errors.adminPhone.message}</p>
                                )}
                            </div>

                            {/* Passwords Side by Side */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Mot de Passe */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 block px-1">
                                        {t('password')} *
                                    </label>
                                    <div className="relative">
                                        <div className={`pointer-events-none absolute inset-y-0 flex items-center ${isRtl ? 'right-0 pr-4' : 'left-0 pl-4'}`}>
                                            <Lock className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            className={`block w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white py-2.5 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-200 font-medium ${
                                                isRtl ? 'pr-10.5 pl-10 text-right' : 'pl-10.5 pr-10 text-left'
                                            }`}
                                            {...register('password')}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className={`absolute inset-y-0 flex items-center px-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer ${
                                                isRtl ? 'left-0' : 'right-0'
                                            }`}
                                        >
                                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="text-[11px] font-bold text-rose-600 px-1">{errors.password.message}</p>
                                    )}
                                </div>

                                {/* Confirmation de Mot de Passe */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 block px-1">
                                        {t('confirmPassword')} *
                                    </label>
                                    <div className="relative">
                                        <div className={`pointer-events-none absolute inset-y-0 flex items-center ${isRtl ? 'right-0 pr-4' : 'left-0 pl-4'}`}>
                                            <Lock className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            className={`block w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white py-2.5 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-200 font-medium ${
                                                isRtl ? 'pr-10.5 pl-10 text-right' : 'pl-10.5 pr-10 text-left'
                                            }`}
                                            {...register('confirmPassword')}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className={`absolute inset-y-0 flex items-center px-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer ${
                                                isRtl ? 'left-0' : 'right-0'
                                            }`}
                                        >
                                            {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                    {errors.confirmPassword && (
                                        <p className="text-[11px] font-bold text-rose-600 px-1">{errors.confirmPassword.message}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Submit button and legal note */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            {/* Legal Note */}
                            <p className="text-[10px] leading-relaxed text-slate-400 font-medium text-center">
                                {t('legal_note')}
                            </p>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-blue-500/25 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>{t('registering')}</span>
                                    </>
                                ) : (
                                    <span>{t('button')}</span>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Bottom Login Link */}
                    <div className="text-center text-xs font-semibold text-slate-500 pt-2 border-t border-slate-100">
                        {t('have_account')}{' '}
                        <Link href="/login" className="font-bold text-blue-600 hover:text-blue-700 transition-colors">
                            {t('login')}
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
