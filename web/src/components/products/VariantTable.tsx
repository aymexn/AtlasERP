'use client';

import React, { useState, useEffect } from 'react';
import { productsService } from '@/services/products';
import { Plus, RefreshCw, Trash2, Layers, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface VariantTableProps {
  productId?: string;
}

export const VariantTable: React.FC<VariantTableProps> = React.memo(({ productId }) => {
  const [variants, setVariants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMatrixUI, setShowMatrixUI] = useState(false);
  const [inputValue, setInputValue] = useState<string[]>(['', '']); // index 0 attribute 0 input, index 1 attribute 1 input
  
  // Matrix Form State
  const [attributes, setAttributes] = useState<{name: string, values: string[]}[]>([
    { name: 'Couleur', values: [] },
    { name: 'Volume', values: [] }
  ]);

  const loadVariants = async () => {
    if (!productId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await productsService.getVariants(productId);
      setVariants(data || []);
    } catch (err) {
      toast.error("Erreur lors du chargement des variants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVariants();
  }, [productId]);

  if (!productId) {
    return (
      <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50/20 px-8 max-w-md mx-auto my-6 animate-in fade-in duration-300">
        <div className="h-14 w-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mx-auto mb-4 border border-amber-100">
          <AlertCircle size={28} />
        </div>
        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Variants Indisponibles</h4>
        <p className="text-xs text-slate-400 font-bold mt-2 leading-relaxed">
          Veuillez d'abord enregistrer le produit pour pouvoir générer et gérer ses variantes.
        </p>
      </div>
    );
  }

  const handleGenerateMatrix = async () => {
    try {
      setLoading(true);
      const matrixData: Record<string, string[]> = {};
      attributes.forEach(attr => {
        if (attr.values.length > 0) matrixData[attr.name] = attr.values;
      });

      if (Object.keys(matrixData).length === 0) {
        toast.error("Veuillez saisir au moins une valeur d'attribut");
        setLoading(false);
        return;
      }

      await productsService.generateVariantMatrix(productId, matrixData);
      toast.success("Matrice générée avec succès");
      setShowMatrixUI(false);
      loadVariants();
    } catch (err) {
      toast.error("Erreur lors de la génération");
      setLoading(false);
    }
  };

  const addAttributeValue = (index: number, val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    const newAttrs = [...attributes];
    if (!newAttrs[index].values.includes(trimmed)) {
        newAttrs[index].values.push(trimmed);
        setAttributes(newAttrs);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
            Déclinaisons de l'article
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
            Gérez les variations de SKU, prix et caractéristiques du produit
          </p>
        </div>
        <button 
          type="button"
          onClick={() => setShowMatrixUI(!showMatrixUI)}
          className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black tracking-wider uppercase hover:bg-slate-800 transition-all shadow-lg active:scale-95"
        >
          <Sparkles size={14} className="text-blue-400" />
          Générer la Matrice
        </button>
      </div>

      {showMatrixUI && (
        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2 mb-6">
            <Layers size={18} className="text-blue-600 animate-pulse" />
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Configurateur de Matrice</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {attributes.map((attr, idx) => (
              <div key={idx} className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">{attr.name}</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Ajouter une valeur (puis Entrée)..." 
                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-slate-350 focus:ring-4 focus:ring-slate-100 transition-all shadow-3xs"
                    value={inputValue[idx]}
                    onChange={(e) => {
                      const nextInputs = [...inputValue];
                      nextInputs[idx] = e.target.value;
                      setInputValue(nextInputs);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addAttributeValue(idx, inputValue[idx]);
                        const nextInputs = [...inputValue];
                        nextInputs[idx] = '';
                        setInputValue(nextInputs);
                      }
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {attr.values.map((v, vidx) => (
                    <span key={vidx} className="px-3 py-1.5 bg-white border border-slate-150 rounded-2xl text-[10px] font-black uppercase text-slate-600 flex items-center gap-2 shadow-3xs animate-in zoom-in-95">
                      {v}
                      <button 
                        type="button"
                        onClick={() => {
                          const next = [...attributes];
                          next[idx].values.splice(vidx, 1);
                          setAttributes(next);
                        }} 
                        className="text-rose-500 hover:text-rose-700 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end gap-3 border-t border-slate-200/50 pt-4">
            <button 
              type="button" 
              onClick={() => setShowMatrixUI(false)} 
              className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider hover:text-slate-650"
            >
              Annuler
            </button>
            <button 
              type="button" 
              onClick={handleGenerateMatrix} 
              className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-blue-150 hover:bg-blue-700 active:scale-95 transition-all"
            >
              Générer les combinaisons
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-3">
          <RefreshCw size={28} className="animate-spin text-slate-400" />
          <p className="text-[10px] font-black uppercase tracking-widest">Chargement des variants...</p>
        </div>
      ) : variants.length > 0 ? (
        <div className="border border-slate-150 rounded-3xl overflow-hidden shadow-2xs bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-150">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Référence (SKU)</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Désignation</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ajustement Prix</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50/20 transition-all group">
                  <td className="px-6 py-4">
                    <span className="font-mono font-black text-xs text-blue-600">{v.sku}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-slate-900">{v.name}</p>
                    <div className="flex gap-1.5 mt-1">
                      {v.attributeValues && Object.entries(v.attributeValues).map(([key, val]: any) => (
                        <span key={key} className="text-[8px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          {key}: {val}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-xs font-black ${Number(v.priceAdjustment) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {Number(v.priceAdjustment) > 0 ? '+' : ''}{Number(v.priceAdjustment).toFixed(2)} DA
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      type="button"
                      className="p-2.5 text-slate-350 hover:text-rose-500 rounded-xl transition-all"
                      title="Supprimer variant"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-16 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center text-center px-12 bg-slate-50/10">
          <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-350 mb-4 border border-slate-100">
            <Layers size={24} />
          </div>
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Aucun variant défini</h4>
          <p className="text-[10px] text-slate-400 font-bold mt-2 leading-relaxed max-w-sm">
            Cliquez sur "Générer la Matrice" pour définir des déclinaisons basées sur la couleur, la taille, ou d'autres attributs.
          </p>
        </div>
      )}
    </div>
  );
});
