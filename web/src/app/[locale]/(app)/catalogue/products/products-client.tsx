'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/navigation';
import { formatCurrency, formatStock } from '@/lib/format';
import { productsService, Product } from '@/services/products';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Package,
    Factory,
    AlertCircle,
    Loader2,
    Filter,
    Layers,
    Tag,
    ChevronLeft,
    ChevronRight,
    Download,
    FileText
} from 'lucide-react';
import { familiesService, ProductFamily } from '@/services/families';
import { ProductModal } from '@/components/modals/product-modal';
import { DataTable } from '@/components/ui/data-table';
import { toast } from 'sonner';
import { downloadPdf } from '@/lib/download-pdf';

export default function ProductsClient() {
    const t = useTranslations('products');
    const ct = useTranslations('common');
    const locale = useLocale();
    const router = useRouter();

    const [products, setProducts] = useState<Product[]>([]);
    const [families, setFamilies] = useState<ProductFamily[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState<string>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Partial<Product> | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalProducts, setTotalProducts] = useState(0);

    useEffect(() => {
        loadProducts();
    }, [page, searchTerm, selectedType]);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const [productsRes, familiesData] = await Promise.all([
                productsService.listPaginated({
                    page,
                    limit,
                    search: searchTerm,
                    type: selectedType !== 'all' ? selectedType : undefined
                }),
                familiesService.list()
            ]);
            
            setProducts(productsRes.data || []);
            setTotalProducts(productsRes.meta?.total || 0);
            setFamilies(familiesData || []);
        } catch (err) {
            console.error('Failed to load products', err);
            toast.error('Erreur lors du chargement des articles');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Voulez-vous vraiment supprimer cet article ?')) return;
        try {
            await productsService.delete(id);
            toast.success('Article supprimé avec succès');
            loadProducts();
        } catch (err) {
            toast.error('Échec de la suppression de l\'article');
        }
    };

    const typeLabels: Record<string, string> = {
        FINISHED_GOOD: 'Produit Fini',
        FINISHED_PRODUCT: 'Produit Fini',
        SEMI_FINISHED: 'Semi-Fini',
        RAW_MATERIAL: 'Matière Première',
        PACKAGING: 'Emballage',
        CONSUMABLE: 'Consommable',
        SERVICE: 'Service'
    };

    const typeStyles: Record<string, string> = {
        FINISHED_GOOD: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
        FINISHED_PRODUCT: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
        SEMI_FINISHED: 'bg-orange-50 text-orange-600 border border-orange-200',
        RAW_MATERIAL: 'bg-slate-100 text-slate-600 border border-slate-200',
        PACKAGING: 'bg-slate-50 text-slate-500 border border-slate-150',
        CONSUMABLE: 'bg-slate-50 text-slate-500 border border-slate-150',
        SERVICE: 'bg-blue-50 text-blue-600 border border-blue-150'
    };

    const totalPages = Math.ceil(totalProducts / limit);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Catalogue articles</h1>
                    <p className="text-slate-500 font-medium mt-1">Gestion haute-densité et configuration du catalogue industriel</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => downloadPdf('/api/pdf/catalogue', `Catalogue_${new Date().toISOString().slice(0, 10)}.pdf`)}
                        className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-205 px-5 py-3 rounded-2xl font-bold shadow-xs transition-all active:scale-95 text-sm"
                    >
                        <FileText size={18} className="text-slate-500" />
                        Exporter Catalogue
                    </button>
                    <button
                        onClick={() => downloadPdf('/api/pdf/inventory', `Inventaire_${new Date().toISOString().slice(0, 10)}.pdf`)}
                        className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-205 px-5 py-3 rounded-2xl font-bold shadow-xs transition-all active:scale-95 text-sm"
                    >
                        <Download size={18} className="text-slate-500" />
                        Export Inventaire
                    </button>
                    <button
                        onClick={() => router.push('/catalogue/products/new')}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold shadow-xl transition-all active:scale-95 text-sm"
                    >
                        <Plus size={18} />
                        Nouvel article
                    </button>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white rounded-3xl border border-slate-150 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Rechercher par désignation ou SKU..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all text-sm font-medium shadow-2xs"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <Filter size={18} className="text-slate-400" />
                        <select
                            className="px-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:border-slate-400 transition-all text-sm font-bold text-slate-600 shadow-2xs"
                            value={selectedType}
                            onChange={(e) => {
                                setSelectedType(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="all">Tous les types</option>
                            <option value="FINISHED_GOOD">Produit Fini</option>
                            <option value="SEMI_FINISHED">Semi-Fini</option>
                            <option value="RAW_MATERIAL">Matière Première</option>
                        </select>
                    </div>
                </div>

                <div className="p-1">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <Loader2 className="animate-spin text-slate-900" size={32} />
                            <p className="text-xs font-black text-slate-450 uppercase tracking-widest">Chargement des articles...</p>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                            <Package size={48} className="text-slate-300" />
                            <div>
                                <p className="text-sm font-bold text-slate-800">Aucun article trouvé</p>
                                <p className="text-xs text-slate-400 mt-1">Essayez d'ajuster vos filtres ou de créer un nouvel article.</p>
                            </div>
                        </div>
                    ) : (
                        <DataTable
                            data={products}
                            enableSelection={false}
                            selectedIds={selectedIds}
                            onSelectionChange={setSelectedIds}
                            onRowClick={(p) => router.push({ pathname: '/catalogue/products/[id]/edit', params: { id: p.id } })}
                            columns={[
                                {
                                    header: 'Image',
                                    accessor: () => (
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                                            <Package size={18} />
                                        </div>
                                    )
                                },
                                {
                                    header: 'Désignation',
                                    accessor: (p) => (
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                                            {p.secondaryName && <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-0.5">{p.secondaryName}</span>}
                                        </div>
                                    )
                                },
                                {
                                    header: 'SKU',
                                    accessor: 'sku',
                                    className: 'font-mono text-xs font-black text-slate-450 uppercase tracking-wider'
                                },
                                {
                                    header: 'Type',
                                    accessor: (p) => {
                                        const typeVal = p.type || p.articleType || 'FINISHED_GOOD';
                                        return (
                                            <span className={`text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wide border ${
                                                typeStyles[typeVal] || 'bg-slate-50 text-slate-600 border-slate-150'
                                            }`}>
                                                {typeLabels[typeVal] || typeVal}
                                            </span>
                                        );
                                    }
                                },
                                {
                                    header: 'Prix HT',
                                    className: 'whitespace-nowrap min-w-[120px]',
                                    accessor: (p) => {
                                        const typeVal = p.type || p.articleType || 'FINISHED_GOOD';
                                        const isFinished = typeVal === 'FINISHED_GOOD' || typeVal === 'FINISHED_PRODUCT';
                                        return (
                                            <span className="font-black text-slate-900 text-sm whitespace-nowrap">
                                                {isFinished ? formatCurrency(Number(p.salePriceHt || 0)) : '—'}
                                            </span>
                                        );
                                    }
                                },
                                {
                                    header: 'Stock disponible',
                                    className: 'whitespace-nowrap min-w-[120px]',
                                    accessor: (p) => {
                                        const available = Number(p.stockQuantity || 0) - Number(p.stockReserved || 0);
                                        const threshold = Number(p.minStock || p.alertThreshold || 0);
                                        const isLow = available <= threshold;
                                        
                                        return (
                                            <div className="flex flex-col gap-1 whitespace-nowrap">
                                                <span className={`font-black text-sm ${isLow ? 'text-rose-600' : 'text-emerald-600'} whitespace-nowrap`}>
                                                    {formatStock(available, p.unit || 'PCS')}
                                                </span>
                                                {isLow && (
                                                    <span className="w-fit bg-rose-50 text-[8px] text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded font-black uppercase tracking-wide whitespace-nowrap">
                                                        Stock Bas
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    }
                                },
                                {
                                    header: 'Unité',
                                    accessor: (p) => (
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                            {p.unit || 'UNIT'}
                                        </span>
                                    )
                                },
                                {
                                    header: 'Actions',
                                    align: 'right',
                                    accessor: (p) => (
                                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => router.push({ pathname: '/catalogue/products/[id]/edit', params: { id: p.id } })}
                                                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                                                title="Modifier"
                                            >
                                                <Edit2 size={15} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(p.id)}
                                                className="p-2 text-slate-400 hover:text-rose-650 hover:bg-rose-50 rounded-xl transition-all"
                                                title="Supprimer"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    )
                                }
                            ]}
                        />
                    )}
                </div>

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100 text-sm font-bold text-slate-500">
                        <div>
                            Affichage de {((page - 1) * limit) + 1} à {Math.min(page * limit, totalProducts)} sur {totalProducts} articles
                        </div>
                        <div className="flex gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                                className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-all text-slate-600"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage(page + 1)}
                                className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-all text-slate-600"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Product Creation / Edition Modal */}
            {isModalOpen && (
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
            )}
        </div>
    );
}
