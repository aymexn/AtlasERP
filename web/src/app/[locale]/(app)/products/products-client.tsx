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
    Save,
    RefreshCw,
    TrendingUp,
    ShieldCheck
} from 'lucide-react';
import { familiesService, ProductFamily } from '@/services/families';
import { Link } from '@/navigation';
import { downloadPdf } from '@/lib/download-pdf';
import { Download, Percent } from 'lucide-react';
import { ProductModal } from '@/components/modals/product-modal';
import { DataTable } from '@/components/ui/data-table';
import { BulkActionToolbar } from '@/components/ui/bulk-action-toolbar';

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
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
            setSelectedIds(selectedIds.filter(i => i !== id));
        } catch (err) {
            alert(tt('error'));
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Confirmer la suppression de ${selectedIds.length} produits ?`)) return;
        setSubmitting(true);
        try {
            await Promise.all(selectedIds.map(id => productsService.delete(id)));
            setProducts(products.filter(p => !selectedIds.includes(p.id)));
            setSelectedIds([]);
            alert(tt('success'));
        } catch (err) {
            alert(tt('error'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleBulkExport = () => {
        const selectedProducts = products.filter(p => selectedIds.includes(p.id));
        const headers = ['SKU', 'Nom', 'Type', 'Famille', 'Stock', 'Unité', 'Prix HT'];
        const rows = selectedProducts.map(p => [
            p.sku,
            p.name,
            t(`article_types.${p.articleType}`),
            p.family?.name || '',
            p.stockQuantity,
            p.unit,
            p.salePriceHt
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `export_produits_${new Date().getTime()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const hasActiveFormula = formulas.some(f => f.status === 'ACTIVE' || f.isActive);

    const handleRecalculateCost = async () => {
        if (!currentProduct?.id) return;
        try {
            setSubmitting(true);
            const newCost = await productsService.recalculateCost(currentProduct.id);
            if (newCost !== null) {
                setCurrentProduct({ ...currentProduct, standardCost: newCost });
                // Also update in list
                setProducts(products.map(p => p.id === currentProduct.id ? { ...p, standardCost: newCost } : p));
                alert(tt('updated'));
            }
        } catch (err: any) {
            alert(err.message || tt('error'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            if (currentProduct?.id) {
                // Clean the payload to avoid read-only field errors
                const editableFields = [
                    'name', 'secondaryName', 'sku', 'articleType', 'familyId', 
                    'unit', 'salePriceHt', 'purchasePriceHt', 'standardCost', 
                    'taxRate', 'minStock', 'isActive', 'trackStock', 'description'
                ];
                
                const payload: any = {};
                editableFields.forEach(field => {
                    if (currentProduct.hasOwnProperty(field)) {
                        payload[field] = (currentProduct as any)[field];
                    }
                });

                const updated = await productsService.update(currentProduct.id, payload);
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
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold shadow-xl transition-all active:scale-95"
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

                <div className="p-1">
                    <DataTable
                        data={filteredProducts}
                        enableSelection
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                        onRowClick={(p) => { setCurrentProduct(p); setIsModalOpen(true); setActiveTab('general'); }}
                        columns={[
                            {
                                header: t('fields.type'),
                                accessor: (p) => (
                                    <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-tighter ${
                                        p.articleType === 'FINISHED_PRODUCT' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                        p.articleType === 'RAW_MATERIAL' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                        p.articleType === 'SERVICE' ? 'bg-slate-50 text-slate-700 border border-slate-100' : 'bg-gray-50 text-gray-700 border border-gray-100'
                                    }`}>
                                        {t(`article_types.${p.articleType}`)}
                                    </span>
                                )
                            },
                            {
                                header: t('fields.name'),
                                accessor: (p) => (
                                    <div className="flex flex-col">
                                        <span className="font-bold text-foreground">{p.name}</span>
                                        {p.secondaryName && <span className="text-[10px] text-muted-foreground font-medium">{p.secondaryName}</span>}
                                    </div>
                                )
                            },
                            {
                                header: t('fields.code'),
                                accessor: 'sku',
                                className: 'font-mono text-xs font-black text-gray-400'
                            },
                            {
                                header: t('fields.family'),
                                accessor: (p) => p.family ? <span className="text-blue-700 font-bold text-xs">{p.family.name}</span> : <span className="text-gray-300">—</span>
                            },
                            {
                                header: t('fields.readiness.label'),
                                accessor: (p) => (
                                    p.articleType === 'FINISHED_PRODUCT' || p.articleType === 'SEMI_FINISHED' ? (
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
                                    )
                                )
                            },
                            {
                                header: t('fields.price_ttc'),
                                accessor: (p) => (
                                    p.articleType === 'RAW_MATERIAL' || p.articleType === 'PACKAGING' || p.articleType === 'CONSUMABLE' ? (
                                        <span className="text-gray-300">---</span>
                                    ) : (
                                        <span className="font-black text-blue-600">
                                            {formatCurrency(Number(p.salePriceHt) * (1 + Number(p.taxRate)), locale)}
                                        </span>
                                    )
                                )
                            },
                            {
                                header: t('fields.stock'),
                                accessor: (p) => (
                                    <div className="flex flex-col gap-1">
                                        <span className={`font-black ${p.stockQuantity <= 0 ? 'text-rose-600' : p.stockQuantity < (p.minStock || 0) ? 'text-orange-500' : 'text-blue-600'}`}>
                                            {p.stockQuantity} <span className="text-[10px] font-medium text-gray-400 uppercase">{p.unit}</span>
                                        </span>
                                        {p.stockQuantity <= 0 ? (
                                            <span className="w-fit bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest whitespace-nowrap animate-pulse shadow-sm">Out of Stock</span>
                                        ) : p.stockQuantity < (p.minStock || 0) ? (
                                            <span className="w-fit bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest whitespace-nowrap shadow-sm">Low Stock</span>
                                        ) : null}
                                    </div>
                                )
                            },
                            {
                                header: ct('actions'),
                                align: 'right',
                                accessor: (p) => (
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
                                            onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg border border-transparent hover:border-red-100 shadow-sm transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )
                            }
                        ]}
                    />
                </div>
            </div>

            <BulkActionToolbar
                selectedCount={selectedIds.length}
                onDelete={handleBulkDelete}
                onExport={handleBulkExport}
                onStatusChange={(status) => {
                    // Implement bulk status change if needed
                    console.log('Bulk status change:', status);
                }}
                availableStatuses={[
                    { label: 'Activer', value: 'active' },
                    { label: 'Désactiver', value: 'inactive' }
                ]}
            />
            
            <ProductModal 
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setCurrentProduct(null);
                }}
                onSuccess={loadProducts}
                product={currentProduct}
                families={families}
                allProducts={products}
            />
        </div>
    );
}
