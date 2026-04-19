'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { formatCurrency } from '@/lib/formatters';
import { productsService, Product } from '@/services/products';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Package,
    Factory,
    AlertCircle,
    X,
    Loader2,
    Filter,
    Layers,
    Tag,
    BarChart3,
    CheckCircle2,
    History,
    PackageSearch,
    Calculator,
    Settings2,
    ChevronLeft,
    Coins,
    TrendingDown,
    Activity,
    ListTree,
    Save
} from 'lucide-react';
import { familiesService, ProductFamily } from '@/services/families';
import { Link } from '@/navigation';
import { downloadPdf } from '@/lib/download-pdf';
import { Download, Percent } from 'lucide-react';

type TabType = 'general' | 'pricing' | 'stock' | 'formula';

export default function ProductsClient() {
    const t = useTranslations('products');
    const ct = useTranslations('common');
    const tt = useTranslations('toast');
    const st = useTranslations('products.article_types');
    const locale = useLocale();

    const [products, setProducts] = useState<Product[]>([]);
    const [families, setFamilies] = useState<ProductFamily[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFamilyId, setSelectedFamilyId] = useState<string>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Partial<Product> | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('general');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [stockFilter, setStockFilter] = useState<'all' | 'low'>('all');

    // Formula State
    const [formulas, setFormulas] = useState<any[]>([]);
    const [formula, setFormula] = useState<any>(null);
    const [isFormulaListView, setIsFormulaListView] = useState(true);
    const [loadingFormula, setLoadingFormula] = useState(false);

    useEffect(() => {
        loadProducts();
    }, []);

    useEffect(() => {
        if (activeTab === 'formula' && currentProduct?.id) {
            loadFormulas(currentProduct.id);
        }
    }, [activeTab, currentProduct?.id]);

    const loadProducts = async () => {
        try {
            const [productsData, familiesData] = await Promise.all([
                productsService.list(),
                familiesService.list()
            ]);
            setProducts(productsData || []);
            setFamilies(familiesData || []);
        } catch (err) {
            console.error('Failed to load products', err);
        } finally {
            setLoading(false);
        }
    };

    const loadFormulas = async (productId: string) => {
        setLoadingFormula(true);
        try {
            const data = await productsService.getProductFormulas(productId);
            setFormulas(data || []);
            setIsFormulaListView(true);
            setFormula(null);
        } catch (err) {
            console.error('Failed to load formulas', err);
        } finally {
            setLoadingFormula(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(ct('delete_confirm'))) return;
        try {
            await productsService.delete(id);
            setProducts(products.filter(p => p.id !== id));
        } catch (err) {
            alert(tt('error'));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            if (currentProduct?.id) {
                const updated = await productsService.update(currentProduct.id, currentProduct);
                setProducts(products.map(p => p.id === updated.id ? updated : p));
            } else {
                const created = await productsService.create({
                    ...currentProduct,
                    articleType: currentProduct?.articleType || 'FINISHED_PRODUCT',
                    unit: currentProduct?.unit || 'PCS',
                    isActive: currentProduct?.isActive ?? true
                });
                setProducts([created, ...products]);
            }
            setIsModalOpen(false);
            setCurrentProduct(null);
            setActiveTab('general');
        } catch (err: any) {
            setError(err.message || tt('error'));
        } finally {
            setSubmitting(false);
        }
    };

    const isProductionReady = (p: Product) => {
        if (p.articleType !== 'FINISHED_PRODUCT' && p.articleType !== 'SEMI_FINISHED') return 'N/A';
        // This is a simplified check since we don't have all formulas for all products here
        // In a real scenario, the backend would return a 'isReady' flag
        if (p.standardCost === 0 && p.purchasePriceHt === 0) return 'MISSING_COST';
        return 'READY';
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.family?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFamily = selectedFamilyId === 'all' || p.familyId === selectedFamilyId;
        const matchesStock = stockFilter === 'all' || p.stockQuantity <= (p.minStock || 0);
        return matchesSearch && matchesFamily && matchesStock;
    });

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
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tighter">{t('title')}</h1>
                    <p className="text-muted-foreground font-medium">{t('subtitle')}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            downloadPdf(productsService.getInventoryPdfUrl(), 'inventaire.pdf');
                        }}
                        className="flex items-center gap-2 bg-white border border-gray-200 text-blue-600 px-6 py-3 rounded-2xl font-bold shadow-sm transition-all hover:bg-gray-50 active:scale-95"
                    >
                        <Download size={20} />
                        {ct('inventory_export')}
                    </button>
                    <button
                        onClick={() => {
                            setCurrentProduct({
                                articleType: 'FINISHED_PRODUCT',
                                unit: 'PCS',
                                taxRate: 0.19,
                                isActive: true,
                                salePriceHt: 0,
                                standardCost: 0,
                                purchasePriceHt: 0,
                                stockQuantity: 0,
                                minStock: 5
                            });
                            setIsModalOpen(true);
                            setActiveTab('general');
                        }}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-blue-200 transition-all active:scale-95"
                    >
                        <Plus size={20} />
                        {t('add')}
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: t('stats.total'), value: products.length, variant: 'primary', icon: Package },
                    { label: t('stats.finished'), value: products.filter(p => p.articleType === 'FINISHED_PRODUCT').length, variant: 'success', icon: CheckCircle2 },
                    { label: t('stats.raw'), value: products.filter(p => p.articleType === 'RAW_MATERIAL').length, variant: 'secondary', icon: Layers },
                    { label: t('stats.low_stock'), value: products.filter(p => p.stockQuantity <= (p.minStock || 0)).length, variant: 'warning', icon: AlertCircle }
                ].map((stat, i) => (
                    <div key={i} className="bg-card p-6 rounded-3xl border border-border shadow-sm flex items-center justify-between transition-all hover:border-primary/20 group">
                        <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-2xl font-black text-foreground">{stat.value}</p>
                        </div>
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg shadow-black/5 ${
                            stat.variant === 'primary' ? 'bg-blue-600/10 text-blue-600' :
                            stat.variant === 'success' ? 'bg-emerald-600/10 text-emerald-600' :
                            stat.variant === 'secondary' ? 'bg-blue-600/10 text-blue-600' :
                            'bg-amber-600/10 text-amber-600'
                        }`}>
                            <stat.icon size={24} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Table Area */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex flex-wrap items-center justify-between gap-4">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder={t('search')}
                            className="w-full pl-12 pr-4 py-3 bg-muted border border-border rounded-2xl outline-none focus:border-primary/20 focus:bg-card transition-all text-sm font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <Filter size={18} className="text-muted-foreground" />
                        <select
                            className="px-4 py-3 bg-muted border border-border rounded-2xl outline-none focus:border-primary/20 focus:bg-card transition-all text-sm font-bold text-muted-foreground"
                            value={selectedFamilyId}
                            onChange={(e) => setSelectedFamilyId(e.target.value)}
                        >
                            <option value="all">{t('all_families')}</option>
                            {families.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                        <select
                            className="px-4 py-3 bg-muted border border-border rounded-2xl outline-none focus:border-primary/20 focus:bg-card transition-all text-sm font-bold text-muted-foreground"
                            value={stockFilter}
                            onChange={(e) => setStockFilter(e.target.value as any)}
                        >
                            <option value="all">{t('filters.all_stock')}</option>
                            <option value="low">{t('filters.low_stock')}</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('fields.type')}</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('fields.name')}</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('fields.code')}</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('fields.family')}</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('fields.readiness.label')}</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('fields.price_ttc')}</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('fields.status.label')}</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('fields.stock')}</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">{ct('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {filteredProducts.map((p) => (
                                <tr key={p.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-6 py-5">
                                        <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-tighter ${
                                            p.articleType === 'FINISHED_PRODUCT' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                            p.articleType === 'RAW_MATERIAL' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                            p.articleType === 'SERVICE' ? 'bg-slate-50 text-slate-700 border border-slate-100' : 'bg-gray-50 text-gray-700 border border-gray-100'
                                        }`}>
                                            {t(`article_types.${p.articleType}`)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-foreground">{p.name}</span>
                                            {p.secondaryName && <span className="text-[10px] text-muted-foreground font-medium">{p.secondaryName}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 font-mono text-xs font-black text-gray-400">{p.sku}</td>
                                    <td className="px-6 py-5">
                                        {p.family ? (
                                            <span className="text-blue-700 font-bold text-xs">
                                                {p.family.name}
                                            </span>
                                        ) : (
                                            <span className="text-gray-300">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-5">
                                        {p.articleType === 'FINISHED_PRODUCT' || p.articleType === 'SEMI_FINISHED' ? (
                                            <div className="flex items-center gap-1.5">
                                                <div className={`h-2 w-2 rounded-full ${isProductionReady(p) === 'READY' ? 'bg-blue-600 animate-pulse' :
                                                    isProductionReady(p) === 'MISSING_COST' ? 'bg-amber-500' : 'bg-gray-300'
                                                    }`} />
                                                <span className={`text-[10px] font-black uppercase tracking-tight ${isProductionReady(p) === 'READY' ? 'text-blue-700' :
                                                    isProductionReady(p) === 'MISSING_COST' ? 'text-amber-700' : 'text-gray-400'
                                                    }`}>
                                                    {isProductionReady(p) === 'READY' ? t('fields.readiness.ready') :
                                                        isProductionReady(p) === 'MISSING_COST' ? t('fields.readiness.missing_cost') :
                                                            t('fields.readiness.missing_formula')}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">{t('fields.readiness.not_manufacturable')}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 font-black text-blue-600">
                                        {formatCurrency(Number(p.salePriceHt) * (1 + Number(p.taxRate)), locale)}
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-tighter ${p.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                                            {p.isActive ? t('fields.status.active') : t('fields.status.inactive')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-black ${p.stockQuantity <= (p.minStock || 0) ? 'text-amber-600' : 'text-blue-600'}`}>
                                                {p.stockQuantity} <span className="text-[10px] font-medium text-gray-400 uppercase">{p.unit}</span>
                                            </span>
                                            {p.stockQuantity <= (p.minStock || 0) && <AlertCircle size={14} className="text-orange-500" />}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {(p.articleType === 'FINISHED_PRODUCT' || p.articleType === 'SEMI_FINISHED') && (
                                                <Link 
                                                    href={`/manufacturing/orders` as any}
                                                    className="p-2 text-gray-400 hover:text-primary hover:bg-white rounded-lg border border-transparent hover:border-blue-100/50 shadow-sm transition-all"
                                                    title={t('create_order')}
                                                >
                                                    <Factory size={16} />
                                                </Link>
                                            )}
                                            <button
                                                onClick={() => { setCurrentProduct(p); setIsModalOpen(true); setActiveTab('general'); }}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg border border-transparent hover:border-blue-100 shadow-sm transition-all"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(p.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg border border-transparent hover:border-red-100 shadow-sm transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredProducts.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                                        {t('no_products')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className={`bg-card rounded-4xl w-full ${activeTab === 'formula' ? 'max-w-6xl' : 'max-w-2xl'} relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 transition-all border border-border`}>
                        {/* Modal Header */}
                        <div className="p-8 pb-4 flex items-center justify-between border-b border-border bg-muted/30">
                            <div>
                                <h2 className="text-2xl font-black text-foreground tracking-tighter">
                                    {currentProduct?.id ? t('edit') : t('add')}
                                </h2>
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">
                                    {currentProduct?.sku || t('new_product')}
                                </p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors bg-card p-2 rounded-xl border border-border shadow-sm">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex px-8 mt-4 gap-6 border-b border-gray-50">
                            {[
                                { id: 'general', label: t('tabs.general'), icon: Tag },
                                { id: 'pricing', label: t('tabs.pricing'), icon: BarChart3 },
                                { id: 'stock', label: t('tabs.stock'), icon: Package },
                                { id: 'formula', label: t('tabs.formula'), icon: History },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabType)}
                                    className={`flex items-center gap-2 py-4 border-b-2 transition-all font-bold text-sm ${activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    <tab.icon size={16} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-3">
                                    <AlertCircle size={18} />
                                    {error}
                                </div>
                            )}

                            {activeTab === 'general' && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('fields.name')}</label>
                                            <input
                                                required
                                                className="w-full px-5 py-3 bg-gray-100/50 border border-gray-100 rounded-2xl outline-none focus:border-blue-200 focus:bg-white transition-all font-bold"
                                                value={currentProduct?.name || ''}
                                                onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('fields.secondary_name')}</label>
                                            <input
                                                className="w-full px-5 py-3 bg-gray-100/50 border border-gray-100 rounded-2xl outline-none focus:border-blue-200 focus:bg-white transition-all font-medium"
                                                value={currentProduct?.secondaryName || ''}
                                                onChange={(e) => setCurrentProduct({ ...currentProduct, secondaryName: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('fields.code')}</label>
                                            <input
                                                required
                                                className="w-full px-5 py-3 bg-gray-100/50 border border-gray-100 rounded-2xl outline-none focus:border-blue-200 focus:bg-white transition-all font-mono font-black"
                                                value={currentProduct?.sku || ''}
                                                onChange={(e) => setCurrentProduct({ ...currentProduct, sku: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('fields.type')}</label>
                                            <select
                                                required
                                                className="w-full px-5 py-3 bg-gray-100/50 border border-gray-100 rounded-2xl outline-none focus:border-blue-200 focus:bg-white transition-all font-bold"
                                                value={currentProduct?.articleType || 'FINISHED_PRODUCT'}
                                                onChange={(e) => setCurrentProduct({ ...currentProduct, articleType: e.target.value as any })}
                                            >
                                                <option value="FINISHED_PRODUCT">{t('article_types.FINISHED_PRODUCT')}</option>
                                                <option value="SEMI_FINISHED">{t('article_types.SEMI_FINISHED')}</option>
                                                <option value="RAW_MATERIAL">{t('article_types.RAW_MATERIAL')}</option>
                                                <option value="PACKAGING">{t('article_types.PACKAGING')}</option>
                                                <option value="CONSUMABLE">{t('article_types.CONSUMABLE')}</option>
                                                <option value="SERVICE">{t('article_types.SERVICE')}</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('fields.family')}</label>
                                            <select
                                                className="w-full px-5 py-3 bg-gray-100/50 border border-gray-100 rounded-2xl outline-none focus:border-blue-200 focus:bg-white transition-all font-bold"
                                                value={currentProduct?.familyId || ''}
                                                onChange={(e) => setCurrentProduct({ ...currentProduct, familyId: e.target.value || undefined })}
                                            >
                                                <option value="">{ct('no_family')}</option>
                                                {families.map(f => (
                                                    <option key={f.id} value={f.id}>{f.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:bg-white">
                                        <input
                                            type="checkbox"
                                            id="isActive"
                                            className="w-5 h-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500"
                                            checked={currentProduct?.isActive ?? true}
                                            onChange={(e) => setCurrentProduct({ ...currentProduct, isActive: e.target.checked })}
                                        />
                                        <label htmlFor="isActive" className="text-sm font-bold text-gray-700 cursor-pointer select-none">
                                            {t('fields.status.active')}
                                        </label>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'pricing' && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('fields.salePriceHt')}</label>
                                            <input
                                                required
                                                type="number"
                                                step="0.01"
                                                className="w-full px-5 py-3 bg-blue-50/30 border border-blue-100 rounded-2xl outline-none focus:border-blue-300 focus:bg-white transition-all font-black text-blue-600"
                                                value={currentProduct?.salePriceHt === 0 ? '' : currentProduct?.salePriceHt}
                                                placeholder="0.00"
                                                onChange={(e) => setCurrentProduct({ ...currentProduct, salePriceHt: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('fields.taxRate')}</label>
                                            <div className="relative">
                                                <input
                                                    required
                                                    type="number"
                                                    step="0.01"
                                                    className="w-full pl-5 pr-12 py-3 bg-gray-100/50 border border-gray-100 rounded-2xl outline-none focus:border-blue-200 focus:bg-white transition-all font-bold"
                                                    value={currentProduct?.taxRate ? (currentProduct.taxRate * 100).toFixed(0) : ''}
                                                    placeholder="19"
                                                    onChange={(e) => setCurrentProduct({ ...currentProduct, taxRate: (parseFloat(e.target.value) || 0) / 100 })}
                                                />
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm">%</div>
                                            </div>
                                        </div>
                                        <div className="col-span-2 p-5 bg-blue-600 rounded-3xl shadow-xl shadow-blue-100 flex items-center justify-between text-white">
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{t('fields.price_ttc')}</span>
                                            <span className="text-3xl font-black">
                                                {formatCurrency((Number(currentProduct?.salePriceHt) || 0) * (1 + (Number(currentProduct?.taxRate) ?? 0.19)), locale)}
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('fields.purchase_price')}</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="w-full px-5 py-3 bg-gray-100/50 border border-gray-100 rounded-2xl outline-none focus:border-blue-200 focus:bg-white transition-all font-bold text-gray-700"
                                                value={currentProduct?.purchasePriceHt || 0}
                                                onChange={(e) => setCurrentProduct({ ...currentProduct, purchasePriceHt: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('fields.standardCost')}</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="w-full px-5 py-3 bg-gray-100/50 border border-gray-100 rounded-2xl outline-none focus:border-blue-200 focus:bg-white transition-all font-black text-red-600"
                                                value={currentProduct?.standardCost || 0}
                                                onChange={(e) => setCurrentProduct({ ...currentProduct, standardCost: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'stock' && (
                                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('fields.stock')}</label>
                                            <div className="flex flex-col gap-4">
                                                <div className="flex-1 px-5 py-4 bg-blue-50/50/30 border border-blue-100/50 rounded-2xl">
                                                    <span className="text-3xl font-black text-primary">
                                                        {currentProduct?.stockQuantity || 0}
                                                        <span className="text-xs ml-2 uppercase text-gray-400 font-bold">{currentProduct?.unit || 'PCS'}</span>
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                                    <input
                                                        type="checkbox"
                                                        id="trackStock"
                                                        className="w-5 h-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        checked={currentProduct?.trackStock ?? true}
                                                        onChange={(e) => setCurrentProduct({ ...currentProduct, trackStock: e.target.checked })}
                                                    />
                                                    <label htmlFor="trackStock" className="text-sm font-bold text-gray-700 cursor-pointer">
                                                        {t('fields.track_stock')}
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('fields.value') as any || 'Valeur Stock'}</label>
                                            <div className="flex-1 px-5 py-4 bg-blue-50/30 border border-blue-100 rounded-2xl">
                                                <span className="text-3xl font-black text-blue-600">
                                                    {formatCurrency((Number(currentProduct?.stockQuantity) || 0) * (Number(currentProduct?.standardCost) || 0), locale)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('fields.min_stock')}</label>
                                            <input
                                                required
                                                type="number"
                                                className="w-full px-5 py-3 bg-gray-100/50 border border-gray-100 rounded-2xl outline-none focus:border-blue-200 focus:bg-white transition-all font-bold"
                                                value={currentProduct?.minStock || 0}
                                                onChange={(e) => setCurrentProduct({ ...currentProduct, minStock: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('fields.unit')}</label>
                                            <input
                                                required
                                                className="w-full px-5 py-3 bg-gray-100/50 border border-gray-100 rounded-2xl outline-none focus:border-blue-200 focus:bg-white transition-all font-black uppercase"
                                                value={currentProduct?.unit || 'PCS'}
                                                onChange={(e) => setCurrentProduct({ ...currentProduct, unit: e.target.value.toUpperCase() })}
                                            />
                                        </div>
                                    </div>

                                    {/* Movement History Mini Table */}
                                    {currentProduct?.id && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                    <History size={14} />
                                                    {t('movements.history' as any) || 'Historique des Mouvements'}
                                                </h4>
                                                <Link 
                                                    href="/inventory/movements" 
                                                    className="text-[10px] font-black text-blue-600 uppercase hover:underline"
                                                >
                                                    {ct('view_all' as any) || 'Tout voir'}
                                                </Link>
                                            </div>
                                            <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-3xl overflow-hidden">
                                                <table className="w-full text-left border-collapse">
                                                    <thead className="bg-gray-50 sticky top-0">
                                                        <tr>
                                                            <th className="px-4 py-2 text-[9px] font-black text-gray-400 uppercase">{ct('date' as any) || 'Date'}</th>
                                                            <th className="px-4 py-2 text-[9px] font-black text-gray-400 uppercase">{ct('type' as any) || 'Type'}</th>
                                                            <th className="px-4 py-2 text-[9px] font-black text-gray-400 uppercase text-right">{ct('qty' as any) || 'Qté'}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {/* This will usually be loaded when tab opens, but for now placeholder or mini-list */}
                                                        {products.find(p => p.id === currentProduct.id)?.stockMovements?.map((m: any) => (
                                                            <tr key={m.id} className="text-xs">
                                                                <td className="px-4 py-2 text-gray-500">{new Date(m.createdAt).toLocaleDateString(locale)}</td>
                                                                <td className="px-4 py-2 font-bold">{m.type}</td>
                                                                <td className={`px-4 py-2 text-right font-black ${['ENTRY', 'ADJUSTMENT'].includes(m.type) ? 'text-primary' : 'text-red-600'}`}>
                                                                    {['ENTRY', 'ADJUSTMENT'].includes(m.type) ? '+' : '-'}{m.quantity}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {(!products.find(p => p.id === currentProduct.id)?.stockMovements || products.find(p => p.id === currentProduct.id)?.stockMovements?.length === 0) && (
                                                            <tr>
                                                                <td colSpan={3} className="px-4 py-8 text-center text-gray-300 font-bold uppercase text-[10px]">
                                                                    {ct('no_data' as any) || 'Aucun mouvement'}
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            {activeTab === 'formula' && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                    {(currentProduct?.articleType !== 'FINISHED_PRODUCT' && currentProduct?.articleType !== 'SEMI_FINISHED') ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100">
                                            <div className="h-24 w-24 bg-white rounded-3xl flex items-center justify-center text-gray-300 shadow-sm">
                                                <Layers size={48} />
                                            </div>
                                            <div className="max-w-md">
                                                <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2">{t('formula.title')}</h3>
                                                <p className="text-sm text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                                                    {t('formula.no_formula_yet')}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-8">
                                            {isFormulaListView ? (
                                                <div className="space-y-8">
                                                    <div className="flex items-center justify-between bg-white/50 p-6 rounded-3xl border border-gray-100 backdrop-blur-sm">
                                                        <div>
                                                            <h3 className="text-2xl font-black text-gray-900 tracking-tighter">{t('formula.list_title')}</h3>
                                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{t('formula.list_subtitle')}</p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setFormula({
                                                                    version: '1.0',
                                                                    status: 'DRAFT',
                                                                    outputQuantity: 1,
                                                                    scrapPercent: 0,
                                                                    lines: []
                                                                });
                                                                setIsFormulaListView(false);
                                                            }}
                                                            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95"
                                                        >
                                                            <Plus size={18} />
                                                            {t('formula.new')}
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                        {formulas.map((f: any) => (
                                                            <div 
                                                                key={f.id}
                                                                onClick={() => { setFormula(f); setIsFormulaListView(false); }}
                                                                className="group bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-blue-100/50 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between h-48"
                                                            >
                                                                <div className={`absolute top-0 right-0 px-4 py-1 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest ${
                                                                    f.status === 'ACTIVE' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
                                                                }`}>
                                                                    {t(`formula.${f.status.toLowerCase()}`)}
                                                                </div>
                                                                <div className="flex items-center gap-4">
                                                                    <div className="h-12 w-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                                        <Settings2 size={24} />
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-black text-gray-900 leading-none mb-1">{f.code || `VER ${f.version}`}</h4>
                                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest line-clamp-1">{f.description || t('formula.no_description')}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                                        {f.lines?.length || 0} {t('formula.components')}
                                                                    </div>
                                                                    <div className="text-lg font-black text-blue-600">
                                                                        {formatCurrency(f.costSummary?.outputUnitCost || 0, locale)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {formulas.length === 0 && (
                                                            <div className="col-span-full py-24 flex flex-col items-center justify-center bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100 text-gray-300">
                                                                <Layers size={64} className="mb-4 opacity-10" />
                                                                <p className="font-black text-xs uppercase tracking-widest">{t('formula.empty')}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-5 pb-6">
                                                    {/* ── BLOCK A: ACTION HEADER ── */}
                                                    <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-5 py-3 shadow-sm">
                                                        <div className="flex items-center gap-4">
                                                            <button type="button" onClick={() => { setIsFormulaListView(true); loadFormulas(currentProduct!.id!); }} className="h-9 w-9 flex items-center justify-center bg-gray-50 border border-gray-200 text-gray-400 rounded-xl hover:text-blue-600 hover:border-blue-200 transition-all">
                                                                <ChevronLeft size={18} />
                                                            </button>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{currentProduct?.sku}</span>
                                                                    <span className="text-gray-200">·</span>
                                                                    <span className="text-sm font-black text-gray-900 tracking-tight">{currentProduct?.name}</span>
                                                                    {formula?.version && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-black uppercase">v{formula.version}</span>}
                                                                    {formula?.status && <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${formula.status === 'ACTIVE' ? 'bg-blue-100/50 text-blue-700' : formula.status === 'ARCHIVED' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>{t(`formula.${formula.status.toLowerCase()}`)}</span>}
                                                                </div>
                                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{formula?.id ? t('formula.edit_formula') : t('formula.new_formula')}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {formula?.id && formula.status !== 'ACTIVE' && (
                                                                <button type="button" onClick={async () => { try { const upd = await productsService.activateFormula(formula.id); setFormula(upd); } catch(e:any){alert(e.message);} }} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-1.5">
                                                                    <Activity size={12} />{t('formula.activate')}
                                                                </button>
                                                            )}
                                                            <button type="button" onClick={() => { setIsFormulaListView(true); loadFormulas(currentProduct!.id!); }} className="px-4 py-2 text-gray-500 font-black text-[10px] uppercase tracking-widest hover:text-gray-900 transition-colors">
                                                                {ct('cancel')}
                                                            </button>
                                                            <button type="button" onClick={async () => {
                                                                try {
                                                                    const payload = {
                                                                        name: formula?.description || formula?.name || `${currentProduct?.name} - v${formula?.version || '1.0'}`,
                                                                        version: formula?.version || '1.0',
                                                                        code: formula?.code || '',
                                                                        description: formula?.description || '',
                                                                        outputQuantity: Number(formula?.outputQuantity) || 1,
                                                                        outputUnit: formula?.outputUnit || currentProduct?.unit || 'KG',
                                                                        scrapPercent: Number(formula?.scrapPercent) || 0,
                                                                        status: formula?.status || 'DRAFT',
                                                                        isActive: formula?.status === 'ACTIVE',
                                                                        lines: (formula?.lines || []).map((l: any, i: number) => ({
                                                                            componentProductId: l.componentProductId || l.articleId,
                                                                            quantity: Number(l.quantity) || 0,
                                                                            unit: l.unit || 'KG',
                                                                            wastagePercent: Number(l.wastagePercent) || 0,
                                                                            sortOrder: i,
                                                                            note: l.note || ''
                                                                        })).filter((l: any) => l.componentProductId)
                                                                    };
                                                                    if (formula?.id) {
                                                                        const upd = await productsService.updateFormula(formula.id, payload);
                                                                        setFormula(upd);
                                                                    } else {
                                                                        const crt = await productsService.createFormula(currentProduct!.id!, payload);
                                                                        setFormula(crt);
                                                                    }
                                                                    alert(tt('updated'));
                                                                } catch(err:any) { alert(err.message || tt('error')); }
                                                            }} className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95">
                                                                <Save size={14} />{t('formula.save_formula')}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* ── BLOCK B: TWO-COLUMN HEADER ── */}
                                                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                                                        {/* LEFT: Parameters */}
                                                        <div className="lg:col-span-3 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                                                            <div className="flex items-center gap-2 mb-5">
                                                                <div className="h-8 w-8 rounded-xl bg-gray-900 text-white flex items-center justify-center"><Settings2 size={15} /></div>
                                                                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">{t('formula.identification_section')}</h4>
                                                            </div>
                                                            <div className="grid grid-cols-3 gap-4">
                                                                <div className="space-y-1.5">
                                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">{t('formula.version')}</label>
                                                                    <input className="w-full px-3 py-2 bg-gray-50 rounded-xl outline-none font-black text-sm text-blue-600 focus:ring-2 focus:ring-blue-100" value={formula?.version || '1.0'} onChange={e => setFormula({...formula, version: e.target.value})} />
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">{t('formula.code')}</label>
                                                                    <input className="w-full px-3 py-2 bg-gray-50 rounded-xl outline-none font-mono font-black text-sm focus:ring-2 focus:ring-blue-100" value={formula?.code || ''} onChange={e => setFormula({...formula, code: e.target.value})} placeholder="F-001" />
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">{t('formula.status')}</label>
                                                                    <select className="w-full px-3 py-2 bg-gray-50 rounded-xl outline-none font-black text-sm focus:ring-2 focus:ring-blue-100" value={formula?.status || 'DRAFT'} onChange={e => setFormula({...formula, status: e.target.value})}>
                                                                        <option value="DRAFT">{t('formula.draft')}</option>
                                                                        <option value="ACTIVE">{t('formula.active')}</option>
                                                                        <option value="ARCHIVED">{t('formula.archived')}</option>
                                                                    </select>
                                                                </div>
                                                                <div className="col-span-3 space-y-1.5">
                                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">{t('formula.description')}</label>
                                                                    <input className="w-full px-3 py-2 bg-gray-50 rounded-xl outline-none font-medium text-sm focus:ring-2 focus:ring-blue-100" value={formula?.description || ''} onChange={e => setFormula({...formula, description: e.target.value})} placeholder={t('formula.production_recipe')} />
                                                                </div>
                                                                <div className="col-span-2 space-y-1.5">
                                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">{t('formula.outputQuantity')}</label>
                                                                    <div className="flex gap-2">
                                                                        <input type="number" className="flex-1 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl outline-none font-black text-sm text-blue-700 focus:ring-2 focus:ring-blue-200" value={formula?.outputQuantity || 1} onChange={e => setFormula({...formula, outputQuantity: parseFloat(e.target.value)||1})} />
                                                                        <select className="w-20 bg-gray-100 rounded-xl outline-none text-[10px] font-black text-gray-600 uppercase px-2" value={formula?.outputUnit || currentProduct?.unit || 'KG'} onChange={e => setFormula({...formula, outputUnit: e.target.value})}>
                                                                            {['KG','G','L','ML','PCS','UNIT','BOX','M2','M3'].map(u => <option key={u} value={u}>{u}</option>)}
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">{t('formula.scrapPercent')}</label>
                                                                    <div className="relative">
                                                                        <input type="number" className="w-full px-3 py-2 bg-orange-50 border border-orange-100 rounded-xl outline-none font-black text-sm text-orange-700 focus:ring-2 focus:ring-orange-200" value={formula?.scrapPercent || 0} onChange={e => setFormula({...formula, scrapPercent: parseFloat(e.target.value)||0})} />
                                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-orange-400">%</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {/* RIGHT: Cost KPIs */}
                                                        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col">
                                                            <div className="flex items-center gap-2 mb-5">
                                                                <div className="h-8 w-8 rounded-xl bg-primary text-white flex items-center justify-center"><Calculator size={15} /></div>
                                                                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">{t('formula.cost_summary')}</h4>
                                                            </div>
                                                            <div className="space-y-2 flex-1">
                                                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl">
                                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('formula.material_cost')}</span>
                                                                    <span className="text-base font-black text-primary">{formatCurrency(formula?.costSummary?.theoreticalMaterialCost || 0, locale)}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl">
                                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('formula.wastage_impact')}</span>
                                                                    <span className="text-base font-black text-orange-500">+{formatCurrency(formula?.costSummary?.totalWastageImpact || 0, locale)}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center p-3 bg-blue-600 rounded-2xl text-white">
                                                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-80">{t('formula.unit_cost')}</span>
                                                                    <span className="text-xl font-black">{formatCurrency(formula?.costSummary?.outputUnitCost || 0, locale)}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center p-3 bg-gray-900 rounded-2xl text-white">
                                                                    <span className="text-[9px] font-black uppercase opacity-60">{t('formula.batch_cost')}{formula?.outputQuantity ? ` · ${formula.outputQuantity} ${formula?.outputUnit || currentProduct?.unit || 'KG'}` : ''}</span>
                                                                    <span className="text-base font-black">{formatCurrency(formula?.costSummary?.effectiveBatchCost || 0, locale)}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center px-3 pt-2">
                                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('formula.components')}</span>
                                                                    <span className="text-sm font-black text-gray-700">{formula?.lines?.filter((l:any) => l.componentProductId || l.articleId).length || 0}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* ── BLOCK C: FULL-WIDTH BOM TABLE ── */}
                                                    <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                                                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center"><ListTree size={15} /></div>
                                                                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">{t('formula.components_title')}</h4>
                                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[9px] font-black">{formula?.lines?.length || 0}</span>
                                                            </div>
                                                            <button type="button" onClick={() => { const nl = [...(formula?.lines||[])]; nl.push({componentProductId:'',quantity:1,wastagePercent:0,unit:'KG',note:''}); setFormula({...formula,lines:nl}); }} className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-95">
                                                                <Plus size={13} />{t('formula.add_component')}
                                                            </button>
                                                        </div>
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-left border-collapse">
                                                                <thead>
                                                                    <tr className="border-b border-gray-100 bg-gray-50/30">
                                                                        <th className="px-5 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest w-64">{t('formula.component')}</th>
                                                                        <th className="px-3 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('formula.article')}</th>
                                                                        <th className="px-3 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center w-40">{t('formula.quantity')}</th>
                                                                        <th className="px-3 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center w-28">{t('formula.wastage')}</th>
                                                                        <th className="px-3 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right w-32">{t('formula.unit_cost')}</th>
                                                                        <th className="px-3 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right w-32">{t('formula.line_cost')}</th>
                                                                        <th className="px-3 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('formula.note')}</th>
                                                                        <th className="px-4 py-3 w-12"></th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-50">
                                                                    {(formula?.lines || []).map((line: any, idx: number) => {
                                                                        const art = products.find(p => p.id === (line.componentProductId || line.articleId));
                                                                        const unitCost = art?.standardCost || art?.purchasePriceHt || 0;
                                                                        const lineCost = unitCost * (line.quantity || 0);
                                                                        return (
                                                                            <tr key={idx} className="group hover:bg-blue-50/20 transition-all">
                                                                                <td className="px-5 py-4">
                                                                                    <select className="w-full bg-transparent font-black text-sm outline-none focus:text-blue-600 cursor-pointer" value={line.componentProductId || line.articleId || ''} onChange={e => { const nl=[...formula.lines]; nl[idx]={...nl[idx],componentProductId:e.target.value,articleId:e.target.value}; const sel=products.find(p=>p.id===e.target.value); if(sel) nl[idx].unit=sel.unit||'KG'; setFormula({...formula,lines:nl}); }}>
                                                                                        <option value="">{t('formula.select_component')}</option>
                                                                                        {products.filter(p=>!['SERVICE'].includes(p.articleType)&&p.id!==currentProduct?.id).map(p=><option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>)}
                                                                                    </select>
                                                                                    {art && <div className="text-[9px] text-gray-400 font-bold mt-0.5">{art.name}</div>}
                                                                                </td>
                                                                                <td className="px-3 py-4">
                                                                                    {art ? (
                                                                                        <div className="flex flex-col gap-0.5">
                                                                                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${art.articleType==='RAW_MATERIAL'?'bg-purple-100 text-purple-700':art.articleType==='PACKAGING'?'bg-yellow-100 text-yellow-700':'bg-gray-100 text-gray-600'}`}>{art.articleType}</span>
                                                                                            {art.family && <span className="text-[9px] text-gray-400 font-bold">{art.family.name}</span>}
                                                                                        </div>
                                                                                    ) : <span className="text-gray-200">—</span>}
                                                                                </td>
                                                                                <td className="px-3 py-4">
                                                                                    <div className="flex items-center gap-1.5 justify-center">
                                                                                        <input type="number" className="w-20 px-2 py-1.5 bg-gray-50 border border-transparent focus:border-blue-200 rounded-lg outline-none font-black text-center text-sm" value={line.quantity||0} onChange={e=>{const nl=[...formula.lines];nl[idx]={...nl[idx],quantity:parseFloat(e.target.value)||0};setFormula({...formula,lines:nl});}} />
                                                                                        <select className="w-14 bg-gray-50 rounded-lg text-[9px] font-black text-gray-500 uppercase outline-none px-1 py-1.5" value={line.unit||'KG'} onChange={e=>{const nl=[...formula.lines];nl[idx]={...nl[idx],unit:e.target.value};setFormula({...formula,lines:nl});}}>
                                                                                            {['KG','G','L','ML','PCS','UNIT','BOX','M2','M3'].map(u=><option key={u} value={u}>{u}</option>)}
                                                                                        </select>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-3 py-4">
                                                                                    <div className="flex items-center gap-1 justify-center">
                                                                                        <input type="number" className="w-14 px-2 py-1.5 bg-orange-50 border border-orange-100 rounded-lg outline-none font-black text-center text-sm text-orange-600" value={line.wastagePercent||0} onChange={e=>{const nl=[...formula.lines];nl[idx]={...nl[idx],wastagePercent:parseFloat(e.target.value)||0};setFormula({...formula,lines:nl});}} />
                                                                                        <span className="text-[9px] font-black text-orange-300">%</span>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-3 py-4 text-right">
                                                                                    <span className="text-xs font-black text-blue-600">{formatCurrency(unitCost, locale)}</span>
                                                                                    <div className="text-[9px] text-gray-400">/{line.unit||'KG'}</div>
                                                                                </td>
                                                                                <td className="px-3 py-4 text-right">
                                                                                    <span className="text-sm font-black text-gray-900">{formatCurrency(lineCost, locale)}</span>
                                                                                </td>
                                                                                <td className="px-3 py-4">
                                                                                    <input className="w-full text-[10px] bg-transparent outline-none text-gray-400 focus:text-blue-500 italic" placeholder={t('formula.note')} value={line.note||''} onChange={e=>{const nl=[...formula.lines];nl[idx]={...nl[idx],note:e.target.value};setFormula({...formula,lines:nl});}} />
                                                                                </td>
                                                                                <td className="px-4 py-4">
                                                                                    <button type="button" onClick={()=>{const nl=[...formula.lines];nl.splice(idx,1);setFormula({...formula,lines:nl});}} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"><Trash2 size={14} /></button>
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                    {(!formula?.lines || formula.lines.length === 0) && (
                                                                        <tr><td colSpan={8} className="px-5 py-12 text-center text-gray-300 font-black text-xs uppercase tracking-widest">{t('formula.no_components')}</td></tr>
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                        {/* ── BLOCK D: BOTTOM ACTION BAR ── */}
                                                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
                                                            <button type="button" onClick={() => { const nl = [...(formula?.lines||[])]; nl.push({componentProductId:'',quantity:1,wastagePercent:0,unit:'KG',note:''}); setFormula({...formula,lines:nl}); }} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:border-blue-300 hover:text-blue-600 transition-all">
                                                                <Plus size={13} />{t('formula.add_component')}
                                                            </button>
                                                            <div className="flex items-center gap-2">
                                                                <button type="button" onClick={() => { setIsFormulaListView(true); loadFormulas(currentProduct!.id!); }} className="px-4 py-2 text-gray-400 font-black text-[9px] uppercase tracking-widest hover:text-gray-700 transition-colors">{ct('cancel')}</button>
                                                                <button type="button" onClick={async () => {
                                                                    try {
                                                                        const payload = {
                                                                            name: formula?.description || formula?.name || `${currentProduct?.name} - v${formula?.version || '1.0'}`,
                                                                            version: formula?.version || '1.0',
                                                                            code: formula?.code || '',
                                                                            description: formula?.description || '',
                                                                            outputQuantity: Number(formula?.outputQuantity) || 1,
                                                                            outputUnit: formula?.outputUnit || currentProduct?.unit || 'KG',
                                                                            scrapPercent: Number(formula?.scrapPercent) || 0,
                                                                            status: formula?.status || 'DRAFT',
                                                                            isActive: formula?.status === 'ACTIVE',
                                                                            lines: (formula?.lines || []).map((l: any, i: number) => ({
                                                                                componentProductId: l.componentProductId || l.articleId,
                                                                                quantity: Number(l.quantity) || 0,
                                                                                unit: l.unit || 'KG',
                                                                                wastagePercent: Number(l.wastagePercent) || 0,
                                                                                sortOrder: i,
                                                                                note: l.note || ''
                                                                            })).filter((l: any) => l.componentProductId)
                                                                        };
                                                                        if (formula?.id) {
                                                                            const upd = await productsService.updateFormula(formula.id, payload);
                                                                            setFormula(upd);
                                                                        } else {
                                                                            const crt = await productsService.createFormula(currentProduct!.id!, payload);
                                                                            setFormula(crt);
                                                                        }
                                                                        alert(tt('updated'));
                                                                    } catch(err:any) { alert(err.message || tt('error')); }
                                                                }} className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95">
                                                                    <Save size={13} />{t('formula.save_formula')}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-4 pt-8 sticky bottom-0 bg-white/80 backdrop-blur-md">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-8 py-4 rounded-2xl font-bold text-gray-400 hover:bg-gray-100 transition-all active:scale-95 border border-gray-100"
                                >
                                    {ct('cancel')}
                                </button>
                                <button
                                    disabled={submitting}
                                    className="flex-2 bg-gray-900 hover:bg-black disabled:bg-gray-300 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-gray-200 transition-all active:scale-95 flex items-center justify-center gap-2"
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
