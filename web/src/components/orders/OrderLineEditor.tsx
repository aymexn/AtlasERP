'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Trash2, Plus, Loader2, ChevronsUpDown, Check, AlertTriangle, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';

interface Product {
    id: string;
    name: string;
    sku: string;
    priceHT: number;
    costPrice: number;
    stockQuantity: number;
    stockReserved: number;
    alertThreshold: number;
    unit: string;
}

export interface OrderLine {
    productId: string;
    productName?: string;
    productSku?: string;
    productUnit?: string;
    quantity: number;
    unitPriceHt: number;
    discountPercent: number;
}

export interface OrderTotals {
    subtotalHt: number;
    discountPercent: number;
    discountAmount: number;
    shippingCost: number;
    totalHt: number;
    totalTva: number;
    totalTtc: number;
}

interface OrderLineEditorProps {
    initialLines?: OrderLine[];
    onChange: (lines: OrderLine[], totals: OrderTotals) => void;
    productFilterType?: 'FINISHED_GOOD' | 'RAW_MATERIAL' | 'SEMI_FINISHED';
    initialShippingCost?: number;
    initialDiscountPercent?: number;
    hideExtraCalculations?: boolean;
}

const TVA_RATE = 0.19; // 19% standard VAT

export function OrderLineEditor({
    initialLines = [],
    onChange,
    productFilterType,
    initialShippingCost = 0,
    initialDiscountPercent = 0,
    hideExtraCalculations = false
}: OrderLineEditorProps) {
    const [lines, setLines] = useState<OrderLine[]>(initialLines);
    const [shippingCost, setShippingCost] = useState<number>(initialShippingCost);
    const [discountPercent, setDiscountPercent] = useState<number>(initialDiscountPercent);

    // Search and Combobox state
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [isComboboxOpen, setIsComboboxOpen] = useState(false);
    const comboboxRef = useRef<HTMLDivElement>(null);

    // Fetch products based on search term and filter type
    useEffect(() => {
        const fetchProducts = async () => {
            setLoadingSearch(true);
            try {
                const query = new URLSearchParams();
                if (search) query.append('search', search);
                if (productFilterType) query.append('type', productFilterType);
                
                const res = await fetch(`/api/products?${query.toString()}`);
                const data = await res.json();
                
                // Ensure data is array
                const items = data.data || [];
                setSearchResults(items);
            } catch (error) {
                console.error('Error searching products:', error);
            } finally {
                setLoadingSearch(false);
            }
        };

        const timer = setTimeout(() => {
            fetchProducts();
        }, 250);

        return () => clearTimeout(timer);
    }, [search, productFilterType]);

    // Close combobox when clicking outside
    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
                setIsComboboxOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    // Calculate totals whenever lines, shipping, or discount changes
    const totals = useMemo(() => {
        const subtotalHt = lines.reduce((sum, l) => {
            const lineHt = Number(l.quantity) * Number(l.unitPriceHt) * (1 - (Number(l.discountPercent) || 0) / 100);
            return sum + lineHt;
        }, 0);

        const discountAmount = subtotalHt * (Number(discountPercent) / 100);
        const totalHt = subtotalHt - discountAmount;
        const totalTva = totalHt * TVA_RATE;
        const totalTtc = totalHt + totalTva + Number(shippingCost);

        return {
            subtotalHt,
            discountPercent,
            discountAmount,
            shippingCost,
            totalHt,
            totalTva,
            totalTtc
        };
    }, [lines, shippingCost, discountPercent]);

    // Emit changes to parent
    const handleEmitChange = (newLines: OrderLine[], newShipping: number = shippingCost, newDiscount: number = discountPercent) => {
        const subtotalHt = newLines.reduce((sum, l) => {
            const lineHt = Number(l.quantity) * Number(l.unitPriceHt) * (1 - (Number(l.discountPercent) || 0) / 100);
            return sum + lineHt;
        }, 0);

        const discountAmount = subtotalHt * (Number(newDiscount) / 100);
        const totalHt = subtotalHt - discountAmount;
        const totalTva = totalHt * TVA_RATE;
        const totalTtc = totalHt + totalTva + Number(newShipping);

        onChange(newLines, {
            subtotalHt,
            discountPercent: newDiscount,
            discountAmount,
            shippingCost: newShipping,
            totalHt,
            totalTva,
            totalTtc
        });
    };

    const handleAddProduct = (product: Product) => {
        // Check if product already in lines
        const existingIndex = lines.findIndex(l => l.productId === product.id);
        let updatedLines = [...lines];

        if (existingIndex > -1) {
            updatedLines[existingIndex] = {
                ...updatedLines[existingIndex],
                quantity: Number(updatedLines[existingIndex].quantity) + 1
            };
        } else {
            updatedLines.push({
                productId: product.id,
                productName: product.name,
                productSku: product.sku,
                productUnit: product.unit,
                quantity: 1,
                unitPriceHt: Number(product.priceHT || 0),
                discountPercent: 0
            });
        }

        setLines(updatedLines);
        handleEmitChange(updatedLines);
        setIsComboboxOpen(false);
        setSearch('');
    };

    const handleUpdateLine = (index: number, field: keyof OrderLine, value: any) => {
        const updatedLines = [...lines];
        updatedLines[index] = {
            ...updatedLines[index],
            [field]: value
        };
        setLines(updatedLines);
        handleEmitChange(updatedLines);
    };

    const handleRemoveLine = (index: number) => {
        const updatedLines = lines.filter((_, i) => i !== index);
        setLines(updatedLines);
        handleEmitChange(updatedLines);
    };

    const handleShippingChange = (value: number) => {
        setShippingCost(value);
        handleEmitChange(lines, value, discountPercent);
    };

    const handleDiscountChange = (value: number) => {
        setDiscountPercent(value);
        handleEmitChange(lines, shippingCost, value);
    };

    return (
        <div className="space-y-6">
            {/* Search Input Combobox */}
            <div className="relative" ref={comboboxRef}>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Rechercher et ajouter un article
                </label>
                <div 
                    onClick={() => setIsComboboxOpen(!isComboboxOpen)}
                    className="flex h-12 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 hover:text-slate-800 cursor-pointer outline-none transition-all shadow-sm focus-within:border-blue-600 focus-within:bg-white"
                >
                    <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 opacity-50 shrink-0" />
                        <span className="truncate">
                            {productFilterType === 'FINISHED_GOOD' 
                                ? 'Rechercher un produit fini...' 
                                : 'Rechercher un article du catalogue...'}
                        </span>
                    </div>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </div>

                {isComboboxOpen && (
                    <div className="absolute top-full left-0 z-50 mt-1 w-full animate-in fade-in slide-in-from-top-1 duration-150">
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                            <div className="flex items-center border-b border-slate-100 px-3 py-2">
                                <Search className="mr-2 h-4 w-4 shrink-0 opacity-40" />
                                <input
                                    className="flex w-full bg-transparent py-1 text-sm outline-none placeholder:text-slate-400 text-slate-900"
                                    placeholder="Saisir la désignation ou le SKU..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    autoFocus
                                />
                                {loadingSearch && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                            </div>

                            <div className="max-h-[250px] overflow-y-auto p-1 space-y-0.5">
                                {searchResults.length === 0 ? (
                                    <p className="py-4 text-center text-xs font-semibold text-slate-400">
                                        Aucun article trouvé.
                                    </p>
                                ) : (
                                    searchResults.map((product) => {
                                        const available = Number(product.stockQuantity || 0) - Number(product.stockReserved || 0);
                                        const isOutOfStock = available <= 0;
                                        const isLowStock = available <= Number(product.alertThreshold || 0);

                                        return (
                                            <button
                                                key={product.id}
                                                type="button"
                                                onClick={() => handleAddProduct(product)}
                                                className="w-full rounded-lg px-3 py-2 text-left transition-all hover:bg-slate-50 text-slate-800 flex items-center justify-between gap-3 text-sm"
                                            >
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <span className="font-bold text-slate-900 truncate">
                                                        {product.name}
                                                    </span>
                                                    <span className="text-xs text-slate-400 mt-0.5 truncate">
                                                        SKU: {product.sku} — <strong className="text-slate-600">{formatCurrency(product.priceHT)} HT</strong>
                                                    </span>
                                                </div>

                                                <span className={cn(
                                                    "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black border tracking-wide uppercase shrink-0",
                                                    isOutOfStock 
                                                        ? "text-rose-600 bg-rose-50 border-rose-100" 
                                                        : isLowStock 
                                                            ? "text-amber-600 bg-amber-50 border-amber-100" 
                                                            : "text-emerald-600 bg-emerald-50 border-emerald-100"
                                                )}>
                                                    {isOutOfStock 
                                                        ? 'Rupture' 
                                                        : `Dispo: ${available} ${product.unit}`}
                                                </span>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Lines Table */}
            {lines.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <Package size={36} className="mx-auto text-slate-350 mb-2" />
                    <p className="text-sm font-bold text-slate-400">
                        Aucune ligne. Utilisez la recherche ci-dessus pour ajouter des articles.
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50">
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Article</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-24 text-center">Quantité</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-32 text-center">P.U. HT (DA)</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-24 text-center">Remise %</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-32 text-right">Total HT</th>
                                    <th className="px-4 py-3 w-12 text-center"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {lines.map((line, idx) => {
                                    const lineHt = Number(line.quantity) * Number(line.unitPriceHt) * (1 - (Number(line.discountPercent) || 0) / 100);
                                    
                                    return (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="font-bold text-slate-800">{line.productName || 'Article'}</div>
                                                <div className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">
                                                    SKU: {line.productSku || '-'} {line.productUnit ? `| Unité: ${line.productUnit}` : ''}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    min="0.1"
                                                    step={line.productUnit === 'PCS' || line.productUnit === 'UNIT' ? '1' : '0.1'}
                                                    value={line.quantity}
                                                    onChange={(e) => handleUpdateLine(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                                    className="w-20 px-2 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-blue-600 font-bold text-center text-sm"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={line.unitPriceHt}
                                                    onChange={(e) => handleUpdateLine(idx, 'unitPriceHt', parseFloat(e.target.value) || 0)}
                                                    className="w-28 px-2 py-1.5 border border-slate-200 bg-slate-50/50 rounded-lg outline-none focus:border-blue-600 font-bold text-center text-sm text-blue-600"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.5"
                                                    value={line.discountPercent}
                                                    onChange={(e) => handleUpdateLine(idx, 'discountPercent', parseFloat(e.target.value) || 0)}
                                                    className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-blue-600 font-bold text-center text-sm"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-right font-black text-slate-800">
                                                {formatCurrency(lineHt)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveLine(idx)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Calculations Blocks for Shipping & Global Discount */}
            {!hideExtraCalculations && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                                Frais de Port (DA)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={shippingCost}
                                onChange={(e) => handleShippingChange(parseFloat(e.target.value) || 0)}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-blue-600 font-bold text-slate-850"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                                Remise Globale %
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={discountPercent}
                                onChange={(e) => handleDiscountChange(parseFloat(e.target.value) || 0)}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-blue-600 font-bold text-slate-850"
                            />
                        </div>
                    </div>

                    <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-150 space-y-2.5">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Calcul des Totaux</h4>
                        <div className="flex justify-between text-xs font-bold text-slate-650">
                            <span>Sous-total HT</span>
                            <span>{formatCurrency(totals.subtotalHt)}</span>
                        </div>
                        {totals.discountAmount > 0 && (
                            <div className="flex justify-between text-xs font-bold text-red-500">
                                <span>Remise globale ({totals.discountPercent}%)</span>
                                <span>-{formatCurrency(totals.discountAmount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-xs font-bold text-slate-650">
                            <span>Total HT</span>
                            <span>{formatCurrency(totals.totalHt)}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold text-slate-500">
                            <span>TVA (19%)</span>
                            <span>{formatCurrency(totals.totalTva)}</span>
                        </div>
                        {totals.shippingCost > 0 && (
                            <div className="flex justify-between text-xs font-bold text-slate-500">
                                <span>Frais de port</span>
                                <span>{formatCurrency(totals.shippingCost)}</span>
                            </div>
                        )}
                        <div className="border-t border-slate-200 pt-2.5 flex justify-between font-black text-lg text-slate-900">
                            <span>Total TTC</span>
                            <span className="text-blue-600">{formatCurrency(totals.totalTtc)}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
