'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { 
    Building2, 
    Save, 
    Loader2, 
    MapPin, 
    Phone, 
    Hash,
    CreditCard,
    Mail,
    Globe
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function SettingsPage() {
    const t = useTranslations('settings');
    const ct = useTranslations('common');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        nif: '',
        rc: '',
        ai: '',
        rib: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        logoUrl: ''
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const data = await apiFetch('/tenants/me');
            if (data) {
                setFormData({
                    name: data.name || '',
                    nif: data.nif || '',
                    rc: data.rc || '',
                    ai: data.ai || '',
                    rib: data.rib || '',
                    address: data.address || '',
                    phone: data.phone || '',
                    email: data.email || '',
                    website: data.website || '',
                    logoUrl: data.logoUrl || ''
                });
            }
        } catch (err) {
            toast.error(ct('error'));
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await apiFetch('/tenants/me', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            toast.success(ct('save_success'));
        } catch (err) {
            toast.error(ct('error'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="animate-spin text-blue-600" size={32} />
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{ct('loading')}</div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <PageHeader 
                title={t('title')}
                subtitle={t('subtitle')}
            />

            <div className="max-w-4xl space-y-8">
                {/* Language Selection Card */}
                <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/20 space-y-6">
                    <div className="flex items-center gap-3 pb-6 border-b border-gray-50">
                        <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                            <Globe size={24} />
                        </div>
                        <div>
                            <h2 className="font-black text-xl text-gray-900 tracking-tight uppercase">{t('language.title')}</h2>
                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{t('language.subtitle')}</div>
                        </div>
                    </div>
                    <div className="max-w-xs">
                        <LanguageSwitcher />
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/20 space-y-8">
                        <div className="flex items-center gap-3 pb-6 border-b border-gray-50">
                            <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                                <Building2 size={24} />
                            </div>
                            <h2 className="font-black text-xl text-gray-900 tracking-tight uppercase">{t('company.title')}</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                                    <Building2 size={12} className="text-blue-600" />
                                    {t('company.fields.name')}
                                </label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-[1.25rem] outline-none focus:bg-white focus:border-blue-600 transition-all font-bold text-gray-900 shadow-inner"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                                    <Hash size={12} className="text-blue-600" />
                                    {t('company.fields.nif')}
                                </label>
                                <input 
                                    type="text" 
                                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-[1.25rem] outline-none focus:bg-white focus:border-blue-600 transition-all font-bold text-gray-900 shadow-inner"
                                    value={formData.nif}
                                    onChange={e => setFormData({ ...formData, nif: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                                    <Hash size={12} className="text-blue-600" />
                                    {t('company.fields.rc')}
                                </label>
                                <input 
                                    type="text" 
                                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-[1.25rem] outline-none focus:bg-white focus:border-blue-600 transition-all font-bold text-gray-900 shadow-inner"
                                    value={formData.rc}
                                    onChange={e => setFormData({ ...formData, rc: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                                    <Hash size={12} className="text-blue-600" />
                                    {t('company.fields.ai')}
                                </label>
                                <input 
                                    type="text" 
                                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-[1.25rem] outline-none focus:bg-white focus:border-blue-600 transition-all font-bold text-gray-900 shadow-inner"
                                    value={formData.ai}
                                    onChange={e => setFormData({ ...formData, ai: e.target.value })}
                                />
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                                    <CreditCard size={12} className="text-blue-600" />
                                    RIB
                                </label>
                                <input 
                                    type="text" 
                                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-[1.25rem] outline-none focus:bg-white focus:border-blue-600 transition-all font-bold text-gray-900 shadow-inner"
                                    value={formData.rib}
                                    onChange={e => setFormData({ ...formData, rib: e.target.value })}
                                    placeholder="Ex: 002 00012 1234567890 12"
                                />
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                                    <MapPin size={12} className="text-blue-600" />
                                    {t('company.fields.address')}
                                </label>
                                <textarea 
                                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-[1.25rem] outline-none focus:bg-white focus:border-blue-600 transition-all font-bold text-gray-900 shadow-inner min-h-[100px]"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                                    <Phone size={12} className="text-blue-600" />
                                    {t('company.fields.phone')}
                                </label>
                                <input 
                                    type="text" 
                                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-[1.25rem] outline-none focus:bg-white focus:border-blue-600 transition-all font-bold text-gray-900 shadow-inner"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                                    <Mail size={12} className="text-blue-600" />
                                    {t('company.fields.email')}
                                </label>
                                <input 
                                    type="email" 
                                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-[1.25rem] outline-none focus:bg-white focus:border-blue-600 transition-all font-bold text-gray-900 shadow-inner"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full flex items-center justify-center gap-4 py-6 bg-blue-600 text-white rounded-4xl font-black uppercase tracking-[0.2em] text-md shadow-2xl shadow-blue-200 hover:shadow-blue-300 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="animate-spin" /> : <><Save size={24} />{t('company.save')}</>}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
