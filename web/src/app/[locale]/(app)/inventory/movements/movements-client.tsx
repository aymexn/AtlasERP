'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { formatCurrency } from '@/lib/formatters';
import { inventoryService, StockMovement } from '@/services/inventory';
import { productsService, Product } from '@/services/products';
import { apiFetch } from '@/lib/api';
import {
    Plus,
    Search,
    ClipboardList,
    ArrowUpRight,
    ArrowDownLeft,
    RefreshCw,
    Truck,
    Settings2,
    Package,
    Calendar,
    User,
    Hash,
    Filter,
    X,
    Loader2,
    CheckCircle2,
    AlertCircle,
    PackageSearch,
    Calculator
} from 'lucide-react';

export default function MovementsClient() {
    const t = useTranslations('inventory');
    const ct = useTranslations('common');
    const tt = useTranslations('toast');
    const locale = useLocale();

    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    
    const [newMovement, setNewMovement] = useState<Partial<StockMovement>>({
        type: 'IN',
        quantity: 1,
        date: new Date().toISOString().split('T')[0]
    });
    const [warehouses, setWarehouses] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [movementsData, productsData, warehousesData] = await Promise.all([
                inventoryService.listMovements(),
                productsService.list(),
                apiFetch('/warehouses') // Mocking or assuming this exists
            ]);
            setMovements(movementsData || []);
            setProducts(productsData || []);
            setWarehouses(warehousesData || []);
        } catch (err) {
            console.error('Failed to load inventory data', err);
            // Fallback for warehouses if endpoint doesn't exist yet
            setWarehouses([{ id: 'default', name: t('movements.main_warehouse') }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            const created = await inventoryService.createMovement(newMovement);
            setMovements([created, ...movements]);
            setIsModalOpen(false);
            setNewMovement({
                type: 'IN',
                quantity: 1,
                date: new Date().toISOString().split('T')[0]
            });
            // Reload products to get updated stock
            const updatedProducts = await productsService.list();
            setProducts(updatedProducts);
        } catch (err: any) {
            setError(err.message || tt('error'));
        } finally {
            setSubmitting(false);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'IN': return <ArrowDownLeft className="text-emerald-500" />;
            case 'OUT': return <ArrowUpRight className="text-red-500" />;
            case 'TRANSFER': return <Truck className="text-blue-500" />;
            case 'ADJUSTMENT': return <Settings2 className="text-orange-500" />;
            default: return <ClipboardList className="text-gray-500" />;
        }
    };

    const filteredMovements = movements.filter(m => 
        m.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.reason?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="animate-spin text-blue-600" size={40} />
                <p className="text-sm font-black text-gray-500 uppercase tracking-widest">{ct('loading')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tighter">{t('movements.title')}</h1>
                    <p className="text-gray-500 font-medium">{t('subtitle')}</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-gray-200 transition-all active:scale-95"
                >
                    <Plus size={20} />
                    {t('movements.add')}
                </button>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex flex-wrap items-center justify-between gap-4">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder={t('movements.search_placeholder')}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-blue-200 focus:bg-white transition-all text-sm font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('movements.fields.date')}</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('movements.fields.reference')}</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('movements.fields.type')}</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('movements.fields.product')}</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('movements.fields.quantity')}</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('movements.fields.total_cost')}</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('movements.fields.created_by')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {filteredMovements.map((m) => (
                                <tr key={m.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-gray-500 font-medium">
                                            <Calendar size={14} className="text-gray-300" />
                                            {new Date(m.createdAt).toLocaleDateString(locale)}
                                            <span className="text-[10px] opacity-50">{new Date(m.createdAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 font-mono text-xs font-black text-gray-900 uppercase">
                                        <div className="flex items-center gap-2">
                                            <Hash size={14} className="text-gray-300" />
                                            {m.reference}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center">
                                                {getTypeIcon(m.type)}
                                            </div>
                                            <span className="font-bold text-gray-700">{t(`movements.types.${m.type}`)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900">{m.product?.name}</span>
                                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">{m.product?.sku}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`font-black text-lg ${['IN', 'ADJUSTMENT'].includes(m.type) ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {['IN', 'ADJUSTMENT'].includes(m.type) ? '+' : '-'}{m.quantity}
                                            <span className="text-[10px] ml-1 uppercase text-gray-400">{m.unit}</span>
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 font-bold text-gray-900">
                                        {formatCurrency(Number(m.totalCost), locale)}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2 text-gray-500 font-medium">
                                            <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                                <User size={12} />
                                            </div>
                                            <span className="text-xs truncate max-w-[120px]">{m.user?.email.split('@')[0]}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredMovements.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-50 animate-pulse"></div>
                                                <div className="relative h-20 w-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl border border-gray-200 shadow-sm flex items-center justify-center text-gray-400">
                                                    <ClipboardList size={40} className="text-gray-300" />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-base font-black text-gray-900 tracking-tight">{t('movements.no_movements_title')}</h3>
                                                <p className="text-sm font-medium text-gray-500 max-w-[250px] mx-auto">
                                                    {t('movements.no_movements_desc')}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setIsModalOpen(true)}
                                                className="mt-2 px-6 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-colors"
                                            >
                                                + {t('movements.add')}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Creation Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-[3rem] w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
                        {/* Modal Header */}
                        <div className="p-8 pb-6 flex items-center justify-between border-b border-gray-50 bg-gray-50/30">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-gray-900 text-white flex items-center justify-center shadow-lg shadow-gray-200">
                                    <Plus size={28} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tighter">{t('movements.add')}</h2>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">Nouvelle transaction de stock</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors bg-white p-2.5 rounded-2xl shadow-sm border border-gray-50">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[75vh]">
                            <div className="p-8 space-y-8">
                                {error && (
                                    <div className="p-5 bg-red-50 border border-red-100 rounded-3xl text-red-600 text-sm font-bold flex items-center gap-3 animate-in shake duration-300">
                                        <AlertCircle size={20} />
                                        {error}
                                    </div>
                                )}

                                {/* Section 1: Identification */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Hash size={16} className="text-blue-600" />
                                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Identification du flux</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 md:col-span-1 space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('movements.fields.reference')}</label>
                                            <div className="relative group">
                                                <input
                                                    required
                                                    placeholder="MVMT-0000"
                                                    className="w-full px-5 py-4 bg-gray-50 border border-transparent group-hover:border-blue-100 focus:border-blue-400 focus:bg-white rounded-2xl outline-none transition-all font-mono font-black text-gray-900 uppercase tracking-widest"
                                                    value={newMovement.reference || ''}
                                                    onChange={(e) => setNewMovement({ ...newMovement, reference: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="col-span-2 md:col-span-1 space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('movements.fields.date')}</label>
                                            <div className="relative group">
                                                <Calendar size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors" />
                                                <input
                                                    type="date"
                                                    required
                                                    className="w-full pl-14 pr-5 py-4 bg-gray-50 border border-transparent group-hover:border-blue-100 focus:border-blue-400 focus:bg-white rounded-2xl outline-none transition-all font-black text-gray-900"
                                                    value={newMovement.date?.split('T')[0]}
                                                    onChange={(e) => setNewMovement({ ...newMovement, date: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Product Selection */}
                                <div className="space-y-4 bg-blue-50/30 p-6 rounded-4xl border border-blue-50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <PackageSearch size={16} className="text-blue-600" />
                                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Article & Destination</h4>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('movements.fields.product')}</label>
                                        <select
                                            required
                                            className="w-full px-5 py-4 bg-white border border-transparent hover:border-blue-200 focus:border-blue-400 rounded-2xl outline-none transition-all font-black text-blue-600 shadow-sm appearance-none cursor-pointer"
                                            value={newMovement.productId || ''}
                                            onChange={(e) => {
                                                const p = products.find(prod => prod.id === e.target.value);
                                                setNewMovement({ 
                                                    ...newMovement, 
                                                    productId: e.target.value,
                                                    unit: p?.unit || 'PCS',
                                                    unitCost: Number(p?.standardCost || 0)
                                                });
                                            }}
                                        >
                                            <option value="">{t('movements.select_product')}</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('movements.fields.type')}</label>
                                            <select
                                                required
                                                className="w-full px-5 py-4 bg-white border border-transparent hover:border-blue-200 focus:border-blue-400 rounded-2xl outline-none transition-all font-black"
                                                value={newMovement.type}
                                                onChange={(e) => setNewMovement({ ...newMovement, type: e.target.value as any })}
                                            >
                                                <option value="IN">{t('movements.types.IN')}</option>
                                                <option value="OUT">{t('movements.types.OUT')}</option>
                                                <option value="ADJUSTMENT">{t('movements.types.ADJUSTMENT')}</option>
                                                <option value="TRANSFER">{t('movements.types.TRANSFER')}</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            {newMovement.type !== 'TRANSFER' ? (
                                                <>
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('movements.warehouse')}</label>
                                                    <select
                                                        required
                                                        className="w-full px-5 py-4 bg-white border border-transparent hover:border-blue-200 focus:border-blue-400 rounded-2xl outline-none transition-all font-black"
                                                        value={newMovement.warehouseId || ''}
                                                        onChange={(e) => setNewMovement({ ...newMovement, warehouseId: e.target.value })}
                                                    >
                                                        <option value="">{t('movements.select_warehouse')}</option>
                                                        {warehouses.map(w => (
                                                            <option key={w.id} value={w.id}>{w.name}</option>
                                                        ))}
                                                    </select>
                                                </>
                                            ) : (
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('movements.source_warehouse')}</label>
                                                    <select
                                                        required
                                                        className="w-full px-5 py-3 bg-white border border-transparent hover:border-blue-200 focus:border-blue-400 rounded-xl outline-none transition-all font-black text-xs"
                                                        value={newMovement.warehouseFromId || ''}
                                                        onChange={(e) => setNewMovement({ ...newMovement, warehouseFromId: e.target.value })}
                                                    >
                                                        <option value="">{t('movements.from')}</option>
                                                        {warehouses.map(w => (
                                                            <option key={w.id} value={w.id}>{w.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {newMovement.type === 'TRANSFER' && (
                                        <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('movements.dest_warehouse')}</label>
                                            <select
                                                required
                                                className="w-full px-5 py-4 bg-white border border-transparent hover:border-blue-200 focus:border-blue-400 rounded-2xl outline-none transition-all font-black"
                                                value={newMovement.warehouseToId || ''}
                                                onChange={(e) => setNewMovement({ ...newMovement, warehouseToId: e.target.value })}
                                            >
                                                <option value="">{t('movements.select_warehouse')}</option>
                                                {warehouses.map(w => (
                                                    <option key={w.id} value={w.id}>{w.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                {/* Section 3: Values & Quantities */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <RefreshCw size={16} className="text-emerald-600" />
                                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Valeurs & Quantités</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('movements.fields.quantity')}</label>
                                            <div className="relative group">
                                                <input
                                                    type="number"
                                                    step="0.001"
                                                    required
                                                    className="w-full px-5 py-4 bg-gray-50 border border-transparent group-hover:border-blue-100 focus:border-blue-400 focus:bg-white rounded-2xl outline-none transition-all font-black text-2xl"
                                                    value={newMovement.quantity}
                                                    onChange={(e) => setNewMovement({ ...newMovement, quantity: parseFloat(e.target.value) || 0 })}
                                                />
                                                <div className="absolute right-5 top-1/2 -translate-y-1/2 px-3 py-1 bg-white rounded-lg text-[10px] font-black uppercase text-gray-400 border border-gray-100 shadow-sm">
                                                    {newMovement.unit || 'PCS'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('movements.fields.unit_cost')}</label>
                                            <div className="relative group">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="w-full px-5 py-4 bg-gray-50 border border-transparent group-hover:border-blue-100 focus:border-blue-400 focus:bg-white rounded-2xl outline-none transition-all font-black text-xl text-blue-600"
                                                    value={newMovement.unitCost || 0}
                                                    onChange={(e) => setNewMovement({ ...newMovement, unitCost: parseFloat(e.target.value) || 0 })}
                                                />
                                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">DZD</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Calculated Summary */}
                                    <div className="p-6 bg-emerald-50/20 border border-emerald-100/50 rounded-4xl flex items-center justify-between">
                                        <div>
                                            <h5 className="text-[10px] font-black text-emerald-600 tracking-widest uppercase mb-1">{t('movements.fields.total_cost')}</h5>
                                            <p className="text-3xl font-black text-emerald-700 tracking-tighter">
                                                {formatCurrency((Number(newMovement.quantity) || 0) * (Number(newMovement.unitCost) || 0), locale)}
                                            </p>
                                        </div>
                                        <div className="h-14 w-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                                            <Calculator size={28} />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 4: Comments */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('movements.fields.reason')}</label>
                                    <textarea
                                        placeholder="Commentaires ou notes sur le mouvement..."
                                        className="w-full px-5 py-4 bg-gray-50 border border-transparent hover:border-blue-100 focus:border-blue-400 focus:bg-white rounded-2xl outline-none transition-all font-medium h-24 resize-none"
                                        value={newMovement.reason || ''}
                                        onChange={(e) => setNewMovement({ ...newMovement, reason: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="p-8 pt-0 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-8 py-4 rounded-3xl font-bold text-gray-400 hover:bg-gray-100 transition-all active:scale-95 border border-gray-100"
                                >
                                    {ct('cancel')}
                                </button>
                                <button
                                    disabled={submitting}
                                    className="flex-2 bg-gray-900 overflow-hidden relative hover:bg-black disabled:bg-gray-300 text-white px-8 py-4 rounded-3xl font-black shadow-2xl shadow-gray-200 transition-all active:scale-95 flex items-center justify-center gap-3 border-b-4 border-gray-700 active:border-b-0 group"
                                >
                                    {submitting ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : (
                                        <>
                                            <CheckCircle2 size={20} className="group-hover:scale-110 transition-transform" />
                                            <span className="tracking-tight uppercase text-xs">{ct('save')}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
