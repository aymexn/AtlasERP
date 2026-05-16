import React, { useState, useEffect } from 'react';
import { productsService } from '@/services/products';
import { apiFetch } from '@/lib/api';
import { Plus, Package, Trash2, Tag, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/formatters';

interface SupplierCatalogProps {
  supplierId: string;
}

export const SupplierCatalog: React.FC<SupplierCatalogProps> = ({ supplierId }) => {
  const [catalog, setCatalog] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [newData, setNewData] = useState({
    productId: '',
    supplierSku: '',
    costPrice: 0,
    leadTimeDays: 7,
    isPreferred: false
  });

  const loadData = async () => {
    try {
      const [allP, supplierCatalog] = await Promise.all([
        apiFetch('/products'),
        productsService.getSupplierCatalog(supplierId)
      ]);
      setAllProducts(allP);
      setCatalog(supplierCatalog || []);
    } catch (err) {
      toast.error("Erreur lors du chargement du catalogue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [supplierId]);

  const handleAdd = async () => {
    try {
      if (!newData.productId) {
        toast.error("Veuillez choisir un article");
        return;
      }
      await productsService.addProductToSupplier(supplierId, newData);
      toast.success("Article ajouté au catalogue");
      setShowAddForm(false);
      loadData();
    } catch (err) {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await productsService.removeSupplierProduct(id);
      toast.success("Article retiré du catalogue");
      loadData();
    } catch (err) {
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Catalogue de Fourniture</h4>
          <p className="text-[10px] text-slate-400 font-bold">Articles référencés chez ce fournisseur</p>
        </div>
        <button 
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black shadow-lg"
        >
          <Plus size={14} />
          Référencer un article
        </button>
      </div>

      {showAddForm && (
        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Article</label>
              <select 
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-xs font-bold"
                value={newData.productId}
                onChange={(e) => setNewData({...newData, productId: e.target.value})}
              >
                <option value="">Sélectionner...</option>
                {allProducts.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prix d'Achat (DA)</label>
              <input 
                type="number" 
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-xs font-bold"
                value={newData.costPrice}
                onChange={(e) => setNewData({...newData, costPrice: Number(e.target.value)})}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-[10px] font-bold text-slate-400">Annuler</button>
            <button type="button" onClick={handleAdd} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black">Ajouter</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-10 text-center text-[10px] font-black text-slate-300 tracking-widest uppercase">Chargement catalogue...</div>
      ) : (
        <div className="space-y-3">
          {catalog.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl group hover:border-blue-100 transition-all">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                  <Package size={18} />
                </div>
                <div>
                  <h5 className="text-xs font-black text-slate-900 uppercase tracking-tight">{item.product.name}</h5>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 rounded uppercase">{item.product.sku}</span>
                    <span className="text-[9px] font-black text-slate-900">{formatCurrency(Number(item.costPrice), 'fr')}</span>
                  </div>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => handleRemove(item.id)}
                className="p-2 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {catalog.length === 0 && !showAddForm && (
            <div className="py-12 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-slate-300">
               <Tag size={24} className="mb-2 opacity-50" />
               <p className="text-[10px] font-black uppercase tracking-widest">Aucun article référencé</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
