import React, { useState, useEffect } from 'react';
import { productsService } from '@/services/products';
import { Plus, RefreshCw, Trash2, Layers, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface VariantsTabProps {
  productId: string;
}

export const VariantsTab: React.FC<VariantsTabProps> = ({ productId }) => {
  const [variants, setVariants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMatrixUI, setShowMatrixUI] = useState(false);
  
  // Matrix Form State
  const [attributes, setAttributes] = useState<{name: string, values: string[]}[]>([
    { name: 'Couleur', values: [] },
    { name: 'Volume', values: [] }
  ]);

  const loadVariants = async () => {
    try {
      const data = await productsService.getVariants(productId);
      setVariants(data);
    } catch (err) {
      toast.error("Erreur lors du chargement des variants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVariants();
  }, [productId]);

  const handleGenerateMatrix = async () => {
    try {
      setLoading(true);
      const matrixData: Record<string, string[]> = {};
      attributes.forEach(attr => {
        if (attr.values.length > 0) matrixData[attr.name] = attr.values;
      });

      if (Object.keys(matrixData).length === 0) {
        toast.error("Veuillez saisir au moins une valeur d'attribut");
        return;
      }

      await productsService.generateVariantMatrix(productId, matrixData);
      toast.success("Matrice générée avec succès");
      setShowMatrixUI(false);
      loadVariants();
    } catch (err) {
      toast.error("Erreur lors de la génération");
    } finally {
      setLoading(false);
    }
  };

  const addAttributeValue = (index: number, val: string) => {
    if (!val) return;
    const newAttrs = [...attributes];
    if (!newAttrs[index].values.includes(val)) {
        newAttrs[index].values.push(val);
        setAttributes(newAttrs);
    }
  };

  return (
    <div className="p-8 space-y-6 overflow-y-auto max-h-full">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Déclinaisons de l'article</h3>
          <p className="text-xs text-slate-500">Gérez les variations de SKU, prix et caractéristiques.</p>
        </div>
        <button 
          onClick={() => setShowMatrixUI(!showMatrixUI)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
        >
          <RefreshCw size={14} />
          Générer la Matrice
        </button>
      </div>

      {showMatrixUI && (
        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2 mb-6">
            <Layers size={18} className="text-blue-600" />
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Configurateur de Matrice</h4>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            {attributes.map((attr, idx) => (
              <div key={idx} className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{attr.name}</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Ajouter valeur..." 
                    className="form-input text-xs"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            addAttributeValue(idx, (e.target as any).value);
                            (e.target as any).value = '';
                        }
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {attr.values.map((v, vidx) => (
                    <span key={vidx} className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 flex items-center gap-2">
                      {v}
                      <button onClick={() => {
                        const next = [...attributes];
                        next[idx].values.splice(vidx, 1);
                        setAttributes(next);
                      }} className="text-rose-500 hover:text-rose-700">
                        <Trash2 size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button onClick={() => setShowMatrixUI(false)} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600">Annuler</button>
            <button onClick={handleGenerateMatrix} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-black shadow-xl">Générer les combinaisons</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
          <RefreshCw size={32} className="animate-spin opacity-20" />
          <p className="text-xs font-bold uppercase tracking-widest">Chargement des variants...</p>
        </div>
      ) : variants.length > 0 ? (
        <div className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Référence (SKU)</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Désignation</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ajustement Prix</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                <tr key={v.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all group">
                  <td className="px-6 py-4">
                    <span className="font-mono font-black text-xs text-blue-600">{v.sku}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-black text-slate-900">{v.name}</p>
                    <div className="flex gap-2 mt-1">
                      {v.attributeValues && Object.entries(v.attributeValues).map(([key, val]: any) => (
                        <span key={key} className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                          {key}: {val}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-xs font-black ${Number(v.priceAdjustment) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {Number(v.priceAdjustment) > 0 ? '+' : ''}{v.priceAdjustment} DA
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-20 border-2 border-dashed border-slate-100 rounded-4xl flex flex-col items-center justify-center text-center px-12">
          <div className="h-16 w-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mb-4">
            <Layers size={32} />
          </div>
          <h4 className="text-sm font-black text-slate-900 mb-1">Aucun variant défini</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Utilisez le bouton "Générer la Matrice" pour créer automatiquement les déclinaisons basées sur les couleurs, volumes ou autres attributs.
          </p>
        </div>
      )}
    </div>
  );
};
