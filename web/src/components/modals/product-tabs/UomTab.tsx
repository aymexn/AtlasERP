import React, { useState, useEffect } from 'react';
import { productsService } from '@/services/products';
import { Plus, Scale, Trash2, Info, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface UomTabProps {
  productId: string;
}

export const UomTab: React.FC<UomTabProps> = ({ productId }) => {
  const [productUoms, setProductUoms] = useState<any[]>([]);
  const [allUoms, setAllUoms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [newUomData, setNewUomData] = useState({
    uomId: '',
    conversionFactor: 1,
    purpose: 'purchase'
  });

  const loadData = async () => {
    try {
      const [pUoms, uoms] = await Promise.all([
        productsService.getProductUoms(productId),
        productsService.getUoms()
      ]);
      setProductUoms(pUoms);
      setAllUoms(uoms);
    } catch (err) {
      toast.error("Erreur lors du chargement des unités");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [productId]);

  const handleAddUom = async () => {
    try {
      if (!newUomData.uomId) {
        toast.error("Veuillez choisir une unité");
        return;
      }
      await productsService.addProductUom(productId, newUomData);
      toast.success("Unité ajoutée avec succès");
      setShowAddForm(false);
      loadData();
    } catch (err) {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await productsService.removeProductUom(id);
      toast.success("Unité supprimée");
      loadData();
    } catch (err) {
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="p-8 space-y-6 overflow-y-auto max-h-full">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Unités de mesure & Conversions</h3>
          <p className="text-xs text-slate-500">Configurez comment l'article est acheté, stocké et vendu.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black shadow-lg hover:bg-slate-800 transition-all"
        >
          <Plus size={14} />
          Ajouter une unité
        </button>
      </div>

      {showAddForm && (
        <div className="bg-blue-50 rounded-3xl p-6 border border-blue-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2 mb-6">
            <Scale size={18} className="text-blue-600" />
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Nouvelle Conversion</h4>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unité cible</label>
              <select 
                className="form-select text-xs"
                value={newUomData.uomId}
                onChange={(e) => setNewUomData({...newUomData, uomId: e.target.value})}
              >
                <option value="">Sélectionner...</option>
                {allUoms.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Facteur de conversion</label>
              <input 
                type="number" 
                step="0.00001"
                className="form-input text-xs"
                value={newUomData.conversionFactor}
                onChange={(e) => setNewUomData({...newUomData, conversionFactor: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Usage</label>
              <select 
                className="form-select text-xs"
                value={newUomData.purpose}
                onChange={(e) => setNewUomData({...newUomData, purpose: e.target.value})}
              >
                <option value="purchase">Achat</option>
                <option value="sales">Vente</option>
                <option value="stock">Stock secondaire</option>
                <option value="production">Production</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2 text-[10px] text-blue-600 font-bold bg-white/50 p-3 rounded-xl border border-blue-100/50">
            <Info size={12} />
            <span>Règle : 1 {allUoms.find(u => u.id === newUomData.uomId)?.symbol || '...'} = {newUomData.conversionFactor} Unités de stock.</span>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-xs font-bold text-slate-400">Annuler</button>
            <button onClick={handleAddUom} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-black">Confirmer l'ajout</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-10 text-center text-slate-400 text-xs font-black uppercase tracking-widest">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {productUoms.map((pu) => (
            <div key={pu.id} className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-4xl shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center gap-6">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner ${
                  pu.purpose === 'purchase' ? 'bg-orange-50 text-orange-500' : 
                  pu.purpose === 'sales' ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'
                }`}>
                  <Scale size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-slate-900 uppercase">{pu.uom.name}</h4>
                    <span className="px-2 py-0.5 bg-slate-900 text-white text-[8px] font-black rounded-full uppercase tracking-tighter">{pu.purpose}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 font-bold">
                    <span>1 {pu.uom.symbol}</span>
                    <ArrowRight size={12} />
                    <span className="text-slate-900">{pu.conversionFactor} Unité(s) stock</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleRemove(pu.id)}
                className="p-3 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          {productUoms.length === 0 && !showAddForm && (
            <div className="py-20 border-2 border-dashed border-slate-100 rounded-4xl flex flex-col items-center justify-center text-center">
              <Scale size={32} className="text-slate-200 mb-4" />
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Aucune unité alternative définie</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
