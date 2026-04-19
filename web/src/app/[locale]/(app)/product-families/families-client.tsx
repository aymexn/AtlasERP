'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { familiesService, ProductFamily } from '@/services/families';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    FolderTree,
    X,
    Loader2,
    AlertCircle
} from 'lucide-react';

import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';

export default function FamiliesClient() {
    const t = useTranslations('product_families');
    const ct = useTranslations('common');
    const tt = useTranslations('toast');

    const [families, setFamilies] = useState<ProductFamily[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentFamily, setCurrentFamily] = useState<Partial<ProductFamily> | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadFamilies();
    }, []);

    const loadFamilies = async () => {
        try {
            const data = await familiesService.list();
            setFamilies(data);
        } catch (err) {
            console.error('Failed to load families', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(ct('delete_confirm'))) return;
        try {
            await familiesService.delete(id);
            setFamilies(families.filter(f => f.id !== id));
        } catch (err) {
            alert(tt('error'));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            if (currentFamily?.id) {
                const updated = await familiesService.update(currentFamily.id, currentFamily);
                setFamilies(families.map(f => f.id === updated.id ? updated : f));
            } else {
                const created = await familiesService.create(currentFamily || {});
                setFamilies([created, ...families]);
            }
            setIsModalOpen(false);
            setCurrentFamily(null);
        } catch (err: any) {
            setError(err.message || tt('error'));
        } finally {
            setSubmitting(false);
        }
    };

    const filteredFamilies = families.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = [
        {
            header: t('fields.code'),
            accessor: (f: ProductFamily) => (
                <span className="font-mono text-xs font-bold text-gray-400 px-2 py-1 bg-gray-100 rounded-lg">
                    {f.code || ct('none')}
                </span>
            )
        },
        {
            header: t('fields.name'),
            accessor: (f: ProductFamily) => (
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: f.colorBadge || '#F3F4F6', color: f.colorBadge ? '#FFF' : '#3B82F6' }}>
                        <FolderTree size={16} />
                    </div>
                    <span className="font-bold text-gray-900">{f.name}</span>
                </div>
            )
        },
        {
            header: t('fields.parent'),
            accessor: (f: ProductFamily) => (
                f.parent ? (
                    <span className="inline-flex items-center gap-1.5 text-blue-600 font-bold bg-blue-50 px-2.5 py-1 rounded-full text-[11px] uppercase tracking-wide">
                        <FolderTree size={12} />
                        {f.parent.name}
                    </span>
                ) : (
                    <span className="text-gray-300 text-xs font-medium">{t('root')}</span>
                )
            )
        },
        {
            header: t('fields.description'),
            accessor: (f: ProductFamily) => <span className="text-gray-500 font-medium truncate max-w-[200px] block">{f.description || '—'}</span>
        },
        {
            header: ct('actions'),
            align: 'right' as const,
            accessor: (f: ProductFamily) => (
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setCurrentFamily(f);
                            setIsModalOpen(true);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg border border-transparent hover:border-blue-100 shadow-sm transition-all"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(f.id);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg border border-transparent hover:border-red-100 shadow-sm transition-all"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="animate-spin text-blue-600" size={40} />
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{ct('loading')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <PageHeader 
                title={t('title')}
                subtitle={t('subtitle')}
                action={{
                    label: t('add'),
                    onClick: () => { setCurrentFamily({ sortOrder: 0 }); setIsModalOpen(true); },
                    icon: Plus
                }}
            />

            <div className="space-y-4">
                <div className="relative group max-w-md">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                    <input 
                        type="text" 
                        placeholder={t('search')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-16 pr-6 py-4 bg-white border border-gray-100 rounded-[2rem] outline-none focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all font-bold shadow-sm"
                    />
                </div>

                <DataTable 
                    data={filteredFamilies}
                    columns={columns}
                    onRowClick={(f) => {
                        setCurrentFamily(f);
                        setIsModalOpen(true);
                    }}
                />
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-[2rem] w-full max-w-xl relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h2 className="text-2xl font-black text-gray-900 tracking-tighter">
                                {currentFamily?.id ? t('edit') : t('add')}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-3">
                                    <AlertCircle size={18} />
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('fields.name')}</label>
                                    <input
                                        required
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-blue-200 focus:bg-white transition-all font-bold"
                                        value={currentFamily?.name || ''}
                                        onChange={(e) => setCurrentFamily({ ...currentFamily, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('fields.code')}</label>
                                    <input
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-blue-200 focus:bg-white transition-all font-mono font-bold"
                                        value={currentFamily?.code || ''}
                                        placeholder="E.g. ELEC"
                                        onChange={(e) => setCurrentFamily({ ...currentFamily, code: e.target.value.toUpperCase() })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('fields.parent')}</label>
                                    <select
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-blue-200 focus:bg-white transition-all font-bold"
                                        value={currentFamily?.parentId || ''}
                                        onChange={(e) => setCurrentFamily({ ...currentFamily, parentId: e.target.value || undefined })}
                                    >
                                        <option value="">{t('no_parent')}</option>
                                        {families
                                            .filter(f => f.id !== currentFamily?.id) // Prevent self-parenting
                                            .map(f => (
                                                <option key={f.id} value={f.id}>{f.name}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('fields.sort_order')}</label>
                                    <input
                                        type="number"
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-blue-200 focus:bg-white transition-all font-bold"
                                        value={currentFamily?.sortOrder || 0}
                                        onChange={(e) => setCurrentFamily({ ...currentFamily, sortOrder: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('fields.color')}</label>
                                <div className="flex gap-3 flex-wrap">
                                    {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#6366F1', '#EC4899', '#8B5CF6'].map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setCurrentFamily({ ...currentFamily, colorBadge: color })}
                                            className={`w-10 h-10 rounded-xl transition-all ${currentFamily?.colorBadge === color ? 'ring-4 ring-blue-100 scale-110' : 'hover:scale-105'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                    <button
                                        type="button"
                                            onClick={() => setCurrentFamily({ ...currentFamily, colorBadge: undefined })}
                                            className={`px-4 h-10 rounded-xl bg-gray-100 text-[10px] font-black uppercase tracking-widest ${!currentFamily?.colorBadge ? 'ring-4 ring-gray-100' : ''}`}
                                    >
                                        {ct('none')}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('fields.description')}</label>
                                    <textarea
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-blue-200 focus:bg-white transition-all font-medium h-24 resize-none"
                                        value={currentFamily?.description || ''}
                                        onChange={(e) => setCurrentFamily({ ...currentFamily, description: e.target.value })}
                                    />
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <input
                                        type="checkbox"
                                        id="familyIsActive"
                                        className="w-5 h-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500"
                                        checked={currentFamily?.isActive ?? true}
                                        onChange={(e) => setCurrentFamily({ ...currentFamily, isActive: e.target.checked })}
                                    />
                                    <label htmlFor="familyIsActive" className="text-sm font-bold text-gray-700 cursor-pointer">
                                        {t('fields.is_active')}
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-8 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-all active:scale-95"
                                >
                                    {ct('cancel')}
                                </button>
                                <button
                                    disabled={submitting}
                                    className="flex-[2] bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-blue-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 className="animate-spin" size={20} /> : ct('save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
