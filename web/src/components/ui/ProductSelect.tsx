'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Product } from '@/services/products';
import { formatCurrency } from '@/lib/format';

interface ProductSelectProps {
  products: Product[];
  onSelect: (product: Product) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
}

export function ProductSelect({
  products,
  onSelect,
  placeholder = "Rechercher et ajouter un produit fini...",
  searchPlaceholder = "Rechercher par nom, SKU...",
  emptyMessage = "Aucun produit fini trouvé.",
  className
}: ProductSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  const sortedProducts = React.useMemo(() => {
    return [...products].sort((a, b) => {
      const aAvail = Number(a.stockQuantity || 0) - Number(a.stockReserved || 0);
      const bAvail = Number(b.stockQuantity || 0) - Number(b.stockReserved || 0);

      // Put in stock items first, then out of stock items
      if (aAvail > 0 && bAvail <= 0) return -1;
      if (aAvail <= 0 && bAvail > 0) return 1;

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

  const getStockStatus = (product: Product) => {
    const stock = Number(product.stockQuantity || 0);
    const reserved = Number(product.stockReserved || 0);
    const available = stock - reserved;
    const minStock = Number(product.minStock || 0);
    const unit = product.unit || 'PCS';

    if (available <= 0) {
      return {
        label: `Rupture (${available.toFixed(1)} ${unit} dispo)`,
        class: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-150 dark:border-rose-900/50",
        isDisabled: true
      };
    }

    if (available <= minStock) {
      return {
        label: `Alerte Stock (${available.toFixed(1)} ${unit} dispo — Seuil: ${minStock})`,
        class: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-150 dark:border-amber-900/50",
        isDisabled: false
      };
    }

    return {
      label: `Disponible: ${available.toFixed(1)} ${unit}`,
      class: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-150 dark:border-emerald-900/50",
      isDisabled: false
    };
  };

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-12 w-full items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 py-3 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 outline-none transition-all focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 shadow-sm"
      >
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 opacity-50 shrink-0" />
          <span className="truncate">{placeholder}</span>
        </div>
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-lg">
            <div className="flex items-center border-b border-slate-100 dark:border-slate-800 px-3 py-2">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-40" />
              <input
                className="flex w-full bg-transparent py-1 text-sm outline-none placeholder:text-slate-400 text-slate-900 dark:text-slate-100"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4 opacity-55" />
                </button>
              )}
            </div>
            
            <div className="max-h-[300px] overflow-y-auto p-1 space-y-0.5">
              {filteredProducts.length === 0 ? (
                <p className="py-4 text-center text-xs font-semibold text-slate-400 dark:text-slate-500">
                  {emptyMessage}
                </p>
              ) : (
                filteredProducts.map((product) => {
                  const status = getStockStatus(product);
                  const priceText = formatCurrency(Number(product.salePriceHt) || 0);

                  return (
                    <button
                      key={product.id}
                      type="button"
                      disabled={status.isDisabled}
                      onClick={() => {
                        onSelect(product);
                        setOpen(false);
                        setSearch("");
                      }}
                      className={cn(
                        "w-full rounded-lg px-3 py-2 text-left transition-all flex items-center justify-between gap-3 text-sm select-none",
                        status.isDisabled
                          ? "opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900/20"
                          : "hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200"
                      )}
                    >
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {product.name}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                          SKU: {product.sku} — <strong className="text-slate-700 dark:text-slate-350">{priceText} HT</strong>
                        </span>
                      </div>
                      
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border tracking-wide uppercase shrink-0",
                        status.class
                      )}>
                        {status.label}
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
  );
}
