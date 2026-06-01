'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Factory, Search, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { useLocale } from 'next-intl';

interface BOMTableProps {
  excludeId?: string;
}

export const BOMTable: React.FC<BOMTableProps> = ({ excludeId }) => {
  const locale = useLocale();
  const { register, control, watch, setValue } = useFormContext();
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'formulaLines'
  });

  const formulaLines = watch('formulaLines') || [];

  // Autocomplete / Search API state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch candidates from API
  useEffect(() => {
    if (!searchOpen) return;
    const fetchCandidates = async () => {
      setLoadingCandidates(true);
      try {
        const queryParams = new URLSearchParams();
        if (searchQuery) queryParams.append('search', searchQuery);
        if (excludeId) queryParams.append('excludeId', excludeId);

        const res = await fetch(`/api/products/components?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setCandidates(data);
        }
      } catch (err) {
        console.error('Failed to load components candidates', err);
      } finally {
        setLoadingCandidates(false);
      }
    };

    const delayDebounce = setTimeout(fetchCandidates, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, searchOpen, excludeId]);

  // Calculate total BOM cost dynamically based on edited unit costs
  const bomCost = React.useMemo(() => {
    return formulaLines.reduce((acc: number, line: any) => {
      const cost = line.unitCost !== undefined && line.unitCost !== null ? Number(line.unitCost) : 0;
      return acc + cost * Number(line.quantity || 0);
    }, 0);
  }, [formulaLines]);

  const handleAddComponent = (product: any) => {
    // Check if component already exists in formula
    const alreadyExists = formulaLines.some((line: any) => line.componentId === product.id);
    if (alreadyExists) {
      alert("Ce composant est déjà présent dans la nomenclature.");
      setSearchOpen(false);
      return;
    }

    append({
      componentId: product.id,
      componentName: product.name,
      componentSku: product.sku,
      quantity: 1,
      unit: product.unit || 'KG',
      unitCost: product.costPrice || Number(product.standardCost || product.purchasePriceHt || 0)
    });
    setSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
            Nomenclature des composants
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
            Recherchez et associez uniquement des matières premières ou semi-finis
          </p>
        </div>

        {/* Combobox style search and add */}
        <div className="relative w-64" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setSearchOpen(!searchOpen)}
            className="w-full flex items-center justify-between bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-100 active:scale-95"
          >
            <span className="flex items-center gap-2">
              <Plus size={14} /> Ajouter un composant
            </span>
            <ChevronsUpDown size={14} className="opacity-80" />
          </button>

          {searchOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-80 bg-white border border-slate-150 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center border-b border-slate-100 px-4 py-3 bg-slate-50/50">
                <Search className="mr-2 h-4 w-4 shrink-0 text-slate-450" />
                <input
                  className="w-full bg-transparent text-xs font-bold outline-none placeholder:text-slate-400 text-slate-800"
                  placeholder="Rechercher nom, SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="max-h-[250px] overflow-y-auto p-2 space-y-1">
                {loadingCandidates ? (
                  <div className="flex items-center justify-center py-6 gap-2 text-slate-400">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Recherche...</span>
                  </div>
                ) : candidates.length === 0 ? (
                  <p className="py-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Aucun composant trouvé
                  </p>
                ) : (
                  candidates.map((candidate) => (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => handleAddComponent(candidate)}
                      className="w-full rounded-2xl px-4 py-3 text-left transition-all hover:bg-slate-50 flex items-center justify-between text-slate-700 hover:text-slate-900 border border-transparent hover:border-slate-100"
                    >
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-bold text-xs truncate">{candidate.name}</span>
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 mt-0.5">
                          SKU: {candidate.sku} | Unit Cost: {formatCurrency(candidate.costPrice)}
                        </span>
                      </div>
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-slate-100 rounded text-slate-500 shrink-0">
                        {candidate.unit}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editable Table */}
      {fields.length > 0 ? (
        <div className="border border-slate-150 rounded-3xl overflow-hidden shadow-2xs bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">
                <th className="px-6 py-4 border-r border-slate-200/60">Composant</th>
                <th className="px-6 py-4 w-32 border-r border-slate-200/60">Quantité</th>
                <th className="px-6 py-4 w-36 border-r border-slate-200/60">Coût Unitaire (DA)</th>
                <th className="px-6 py-4 w-32 text-right border-r border-slate-200/60">Sous-total (DA)</th>
                <th className="px-6 py-4 w-20 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => {
                const compName = watch(`formulaLines.${index}.componentName`);
                const compSku = watch(`formulaLines.${index}.componentSku`);
                const quantity = Number(watch(`formulaLines.${index}.quantity`) || 0);
                const unitCost = Number(watch(`formulaLines.${index}.unitCost`) || 0);
                const unit = watch(`formulaLines.${index}.unit`) || 'KG';

                return (
                  <tr key={field.id} className="border-b border-slate-100 hover:bg-slate-50/40 transition-all group">
                    {/* Component Info */}
                    <td className="px-6 py-4 border-r border-slate-100">
                      <p className="text-xs font-bold text-slate-900">
                        {compName || 'Ingrédient inconnu'}
                      </p>
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 mt-0.5 block">
                        SKU: {compSku || 'SKU-INCONNU'}
                      </span>
                    </td>

                    {/* Quantity Input */}
                    <td className="px-6 py-4 border-r border-slate-100">
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          {...register(`formulaLines.${index}.quantity`, { valueAsNumber: true })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-12 py-2 text-xs font-black text-slate-800 outline-none focus:border-slate-400 focus:bg-white transition-all shadow-3xs"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-450 uppercase pointer-events-none">
                          {unit}
                        </span>
                      </div>
                    </td>

                    {/* Editable Unit Cost */}
                    <td className="px-6 py-4 border-r border-slate-100">
                      <input
                        type="number"
                        step="0.01"
                        {...register(`formulaLines.${index}.unitCost`, { valueAsNumber: true })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-blue-600 outline-none focus:border-slate-400 focus:bg-white transition-all shadow-3xs"
                      />
                    </td>

                    {/* Subtotal Readout */}
                    <td className="px-6 py-4 text-right border-r border-slate-100">
                      <span className="text-xs font-black text-slate-900">
                        {formatCurrency(quantity * unitCost)}
                      </span>
                    </td>

                    {/* Delete Action */}
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-2 text-slate-350 hover:text-rose-500 rounded-xl hover:bg-rose-50 transition-all active:scale-95"
                        title="Supprimer le composant"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-20 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center text-center px-12 bg-slate-50/10">
          <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-350 mb-4 border border-slate-100">
            <Factory size={24} />
          </div>
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Aucun composant défini</h4>
          <p className="text-[10px] text-slate-400 font-bold mt-2 leading-relaxed max-w-sm">
            Cliquez sur "Ajouter un composant" en haut à droite pour constituer la nomenclature de fabrication.
          </p>
        </div>
      )}

      {fields.length > 0 && (
        <div className="p-6 bg-slate-950 rounded-3xl text-white shadow-xl flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
            Coût Total de Revient (BOM)
          </span>
          <span className="text-2xl font-black">
            {formatCurrency(bomCost)}
          </span>
        </div>
      )}
    </div>
  );
};
