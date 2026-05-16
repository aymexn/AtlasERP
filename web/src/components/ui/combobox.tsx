'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComboboxProps {
  options: { label: string; value: string; [key: string]: any }[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  icon?: React.ElementType;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  className,
  icon: Icon
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) => {
    const searchTerm = search.toLowerCase();
    // Search in label
    if (opt.label.toLowerCase().includes(searchTerm)) return true;
    // Search in all other string properties (like SKU or sub)
    return Object.values(opt).some(
      (val) => typeof val === 'string' && val.toLowerCase().includes(searchTerm)
    );
  });

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-14 w-full items-center justify-between rounded-[2rem] border-2 border-transparent bg-slate-50 px-6 py-4 text-sm font-black text-slate-900 outline-none transition-all focus:border-blue-600 focus:bg-white shadow-sm",
          !value && "text-slate-400"
        )}
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-5 w-5 text-slate-300" />}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute top-full z-50 mt-2 w-full animate-in fade-in zoom-in-95 duration-200">
          <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl">
            <div className="flex items-center border-b border-slate-50 px-4 py-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                className="flex w-full bg-transparent py-2 text-sm font-bold outline-none placeholder:text-slate-400"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
              {search && (
                <button type="button" onClick={() => setSearch("")}>
                  <X className="h-4 w-4 opacity-50 hover:opacity-100" />
                </button>
              )}
            </div>
            <div className="max-h-[300px] overflow-y-auto p-2 scrollbar-hide">
              {filteredOptions.length === 0 ? (
                <p className="py-6 text-center text-xs font-black uppercase tracking-widest text-slate-400">
                  {emptyMessage}
                </p>
              ) : (
                filteredOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-black transition-all hover:bg-slate-50",
                      value === opt.value ? "bg-blue-50 text-blue-600" : "text-slate-700"
                    )}
                  >
                    <span>{opt.label}</span>
                    {value === opt.value && <Check className="h-4 w-4" />}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
