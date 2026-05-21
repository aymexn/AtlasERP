'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Search, X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Product } from '@/services/products';
import { formatCurrency } from '@/lib/format';

interface ProductComboboxProps {
  products: Product[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  priceMode: 'purchase' | 'sale';
  onRefresh?: () => Promise<void>;
}

export function ProductCombobox({
  products,
  value,
  onChange,
  placeholder = "Sélectionner un produit...",
  searchPlaceholder = "Rechercher par nom, SKU...",
  emptyMessage = "Aucun produit trouvé.",
  className,
  priceMode,
  onRefresh
}: ProductComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [refreshing, setRefreshing] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedProduct = products.find((p) => p.id === value);

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onRefresh || refreshing) return;
    try {
      setRefreshing(true);
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const sortedProducts = React.useMemo(() => {
    return [...products].sort((a, b) => {
      const aStock = Number(a.stockQuantity || 0);
      const bStock = Number(b.stockQuantity || 0);
      const aMin = Number(a.minStock || 0);
      const bMin = Number(b.minStock || 0);

      const getRank = (stock: number, min: number) => {
        if (stock <= 0) return 3; // Out of stock
        if (min > 0 && stock <= min) return 2; // Low stock
        return 1; // In stock
      };

      const rankA = getRank(aStock, aMin);
      const rankB = getRank(bStock, bMin);

      if (rankA !== rankB) {
        return rankA - rankB;
      }
      return a.name.localeCompare(b.name);
    });
  }, [products]);

  const filteredProducts = React.useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return sortedProducts;
    return sortedProducts.filter((p) => {
      return (
        p.name.toLowerCase().includes(term) ||
        (p.sku && p.sku.toLowerCase().includes(term)) ||
        (p.secondaryName && p.secondaryName.toLowerCase().includes(term))
      );
    });
  }, [sortedProducts, search]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getStockBadge = (product: Product) => {
    const stock = Number(product.stockQuantity || 0);
    const min = Number(product.minStock || 0);
    const unit = product.unit || 'pcs';

    if (stock <= 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50">
          {stock.toFixed(2)} {unit} (Rupture)
        </span>
      );
    }

    if (min > 0 && stock <= min) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50">
          {stock.toFixed(2)} {unit} (Stock Bas)
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
        {stock.toFixed(2)} {unit} (En Stock)
      </span>
    );
  };

  return (
    <div className={cn("flex items-center gap-3 w-full", className)} ref={containerRef}>
      <div className="relative flex-1">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={cn(
            "flex h-14 w-full items-center justify-between rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-6 py-4 text-sm font-black text-slate-900 dark:text-slate-100 outline-none transition-all focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 shadow-xs",
            !value && "text-slate-400"
          )}
        >
          <div className="flex flex-col items-start truncate text-left">
            {selectedProduct ? (
              <>
                <span className="font-black text-slate-800 dark:text-slate-200 truncate max-w-[280px]">
                  {selectedProduct.name}
                </span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                  SKU: {selectedProduct.sku} | Cost: {formatCurrency(Number(priceMode === 'purchase' ? selectedProduct.purchasePriceHt : selectedProduct.salePriceHt) || 0)}
                </span>
              </>
            ) : (
              <span className="truncate">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-slate-400 dark:text-slate-500" />
        </button>

        {open && (
          <div className="absolute top-full z-50 mt-2 w-full min-w-[320px] md:min-w-[420px] animate-in fade-in zoom-in-95 duration-200">
            <div className="overflow-hidden rounded-3xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl">
              <div className="flex items-center border-b border-slate-100 dark:border-slate-800 px-4 py-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-slate-400 dark:text-slate-500" />
                <input
                  className="flex w-full bg-transparent py-2 text-sm font-bold outline-none placeholder:text-slate-400 text-slate-800 dark:text-slate-100"
                  placeholder={searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
                {search && (
                  <button type="button" onClick={() => setSearch("")} className="text-slate-400 dark:text-slate-500">
                    <X className="h-4 w-4 opacity-50 hover:opacity-100" />
                  </button>
                )}
              </div>
              <div className="max-h-[350px] overflow-y-auto p-2 scrollbar-hide space-y-1">
                {filteredProducts.length === 0 ? (
                  <p className="py-6 text-center text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    {emptyMessage}
                  </p>
                ) : (
                  filteredProducts.map((product) => {
                    const isSelected = value === product.id;
                    const price = priceMode === 'purchase' ? product.purchasePriceHt : product.salePriceHt;
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => {
                          onChange(product.id);
                          setOpen(false);
                          setSearch("");
                        }}
                        className={cn(
                          "w-full rounded-2xl px-4 py-3 text-left transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-between gap-4",
                          isSelected ? "bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"
                        )}
                      >
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                            {product.name}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5 truncate">
                            SKU: {product.sku} | {formatCurrency(Number(price) || 0)} HT
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {getStockBadge(product)}
                          {isSelected && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {onRefresh && (
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="h-14 w-14 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 shadow-xs transition-all active:scale-95 disabled:opacity-50 shrink-0"
          title="Rafraîchir les stocks"
        >
          <RefreshCw className={cn("h-5 w-5", refreshing && "animate-spin")} />
        </button>
      )}
    </div>
  );
}
