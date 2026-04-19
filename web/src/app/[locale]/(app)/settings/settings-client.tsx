'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/navigation';
import { 
    Building2, 
    Globe, 
    Save, 
    User, 
    Fingerprint, 
    MapPin, 
    Phone, 
    CreditCard,
    Mail,
    Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { settingsService } from '@/services/settings';

export default function SettingsClient() {
    const t = useTranslations('settings');
    const ct = useTranslations('common');
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const [activeTab, setActiveTab] = useState('enterprise');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        nif: '',
        rc: '',
        ai: '',
        rib: '',
        address: '',
        phone: '',
        email: ''
    });

    const languages = [
        { code: 'fr', name: 'Français', flag: '🇫🇷' },
        { code: 'ar', name: 'العربية', flag: '🇩🇿' },
        { code: 'en', name: 'English', flag: '🇺🇸' }
    ];

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const data = await settingsService.getCompany();
                if (data) {
                    setFormData({
                        name: data.name || '',
                        nif: data.nif || '',
                        rc: data.rc || '',
                        ai: data.ai || '',
                        rib: data.rib || '',
                        address: data.address || '',
                        phone: data.phone || '',
                        email: data.email || ''
                    });
                }
            } catch (error) {
                toast.error(ct('toast.error'));
            } finally {
                setIsLoading(false);
            }
        };
        loadSettings();
    }, []);

    const handleLanguageChange = (newLocale: string) => {
        router.push(pathname, { locale: newLocale });
        toast.success(ct('save_success'));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await settingsService.updateCompany(formData);
            toast.success(ct('save_success'));
        } catch (error) {
            toast.error(ct('toast.error'));
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter">{t('title')}</h1>
                <div className="text-slate-500 font-medium">{t('subtitle')}</div>
            </div>

            <div className="flex gap-8">
                {/* Sidemenu Tabs */}
                <div className="w-64 shrink-0 space-y-2">
                    <button 
                        onClick={() => setActiveTab('enterprise')}
                        className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all font-bold text-sm ${activeTab === 'enterprise' ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'text-slate-500 hover:bg-gray-100'}`}
                    >
                        <Building2 size={18} />
                        {t('tabs.enterprise')}
                    </button>
                    <button 
                        onClick={() => setActiveTab('language')}
                        className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all font-bold text-sm ${activeTab === 'language' ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'text-slate-500 hover:bg-gray-100'}`}
                    >
                        <Globe size={18} />
                        {t('tabs.language')}
                    </button>
                </div>

                {/* Content Card */}
                <div className="flex-1 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-10">
                    {activeTab === 'enterprise' && (
                        <div className="space-y-12 animate-in fade-in duration-300">
                            {/* Identity Section */}
                            <div className="space-y-8">
                                <div className="flex items-center gap-3">
                                    <div className="h-6 w-1 bg-blue-600 rounded-full" />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                        {t('company.title')}
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{t('company.fields.name')}</label>
                                        <div className="relative group">
                                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors" size={16} />
                                            <input
                                                type="text"
                                                className="w-full pl-12 pr-6 py-4 bg-gray-50/50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-600 transition-all font-bold text-sm shadow-sm"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{t('company.fields.nif')}</label>
                                            <input
                                                type="text"
                                                className="w-full px-5 py-4 bg-gray-50/50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-600 transition-all font-bold text-sm shadow-sm"
                                                value={formData.nif}
                                                onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{t('company.fields.rc')}</label>
                                            <input
                                                type="text"
                                                className="w-full px-5 py-4 bg-gray-50/50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-600 transition-all font-bold text-sm shadow-sm"
                                                value={formData.rc}
                                                onChange={(e) => setFormData({ ...formData, rc: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{t('company.fields.ai')}</label>
                                            <input
                                                type="text"
                                                className="w-full px-5 py-4 bg-gray-50/50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-600 transition-all font-bold text-sm shadow-sm"
                                                value={formData.ai}
                                                onChange={(e) => setFormData({ ...formData, ai: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{t('company.fields.rib')}</label>
                                            <input
                                                type="text"
                                                className="w-full px-5 py-4 bg-gray-50/50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-600 transition-all font-bold text-sm shadow-sm"
                                                value={formData.rib}
                                                onChange={(e) => setFormData({ ...formData, rib: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Communication Section */}
                            <div className="space-y-8">
                                <div className="flex items-center gap-3">
                                    <div className="h-6 w-1 bg-blue-600 rounded-full" />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Communication & Location</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{t('company.fields.phone')}</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors" size={16} />
                                            <input
                                                type="text"
                                                className="w-full pl-12 pr-6 py-4 bg-gray-50/50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-600 transition-all font-bold text-sm shadow-sm"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{t('company.fields.address')}</label>
                                        <div className="relative group">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors" size={16} />
                                            <input
                                                type="text"
                                                className="w-full pl-12 pr-6 py-4 bg-gray-50/50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-600 transition-all font-bold text-sm shadow-sm"
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full md:w-auto px-12 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-200 active:scale-95 flex items-center justify-center gap-4 disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                {t('company.save')}
                            </button>
                        </div>
                    )}

                    {activeTab === 'language' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            <div className="grid grid-cols-1 gap-6">
                                {languages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => handleLanguageChange(lang.code)}
                                        className={`flex items-center justify-between p-8 rounded-4xl border-2 transition-all group ${locale === lang.code ? 'border-blue-600 bg-blue-50/30' : 'border-gray-50 hover:border-blue-200 bg-gray-50/50'}`}
                                    >
                                        <div className="flex items-center gap-8">
                                            <span className="text-4xl group-hover:scale-110 transition-transform">{lang.flag}</span>
                                            <div className="text-left">
                                                <div className="font-black text-xl text-slate-900 tracking-tight">{lang.name}</div>
                                                <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">{lang.code}</div>
                                            </div>
                                        </div>
                                        {locale === lang.code && (
                                            <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
                                                <Save size={18} />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
