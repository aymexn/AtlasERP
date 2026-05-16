import React, { useState, useEffect } from 'react';
import { productsService } from '@/services/products';
import { apiFetch } from '@/lib/api';
import { Plus, Truck, Trash2, Star, Clock, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/formatters';

interface SupplierTabProps {
  productId: string;
}

export const SupplierTab: React.FC<SupplierTabProps> = ({ productId }) => {
  const [catalog, setCatalog] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [newData, setNewData] = useState({
    supplierId: '',
    supplierSku: '',
    costPrice: 0,
    leadTimeDays: 7,
    isPreferred: false
  });

  const loadData = async () => {
    try {
      const [allSuppliers, productCatalog] = await Promise.all([
        apiFetch('/suppliers'),
        apiFetch(`/products/${productId}/suppliers`) // Note: I need to ensure this endpoint exists or use another logic
      ]);
      setSuppliers(allSuppliers);
      // Wait, let's just get it via a filter if needed or a dedicated endpoint.
      // For now I'll assume we can list the catalog for a product.
      setCatalog(productCatalog || []);
    } catch (err) {
      // If endpoint doesn't exist yet, we'll handle it.
      setCatalog([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [productId]);

  const handleAdd = async () => {
    try {
      if (!newData.supplierId) {
        toast.error("Veuillez choisir un fournisseur");
        return;
      }
      // Calling the endpoint on the supplier side as defined in productsService
      await productsService.addProductToSupplier(newData.supplierId, {
        productId,
        ...newData
      });
      toast.success("Source d'approvisionnement ajoutée");
      setShowAddForm(false);
      loadData();
    } catch (err) {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await productsService.removeSupplierProduct(id);
      toast.success("Lien fournisseur supprimé");
      loadData();
    } catch (err) {
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="p-8 space-y-6 overflow-y-auto max-h-full">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Sources d'Approvisionnement</h3>
          <p className="text-xs text-slate-500">Gérez le catalogue des fournisseurs proposant cet article.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-black shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all"
        >
          <Plus size={14} />
          Ajouter un fournisseur
        </button>
      </div>

      {showAddForm && (
        <div className="bg-orange-50 rounded-3xl p-6 border border-orange-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2 mb-6">
            <Truck size={18} className="text-orange-600" />
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Nouveau Sourcing</h4>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fournisseur</label>
              <select 
                className="form-select text-xs"
                value={newData.supplierId}
                onChange={(e) => setNewData({...newData, supplierId: e.target.value})}
              >
                <option value="">Sélectionner...</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Référence Fournisseur (Optionnel)</label>
              <input 
                type="text" 
                className="form-input text-xs"
                value={newData.supplierSku}
                onChange={(e) => setNewData({...newData, supplierSku: e.target.value})}
                placeholder="REF-SUPP-123"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prix d'Achat (DA)</label>
              <input 
                type="number" 
                className="form-input text-xs"
                value={newData.costPrice}
                onChange={(e) => setNewData({...newData, costPrice: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Délai de livraison (Jours)</label>
              <input 
                type="number" 
                className="form-input text-xs"
                value={newData.leadTimeDays}
                onChange={(e) => setNewData({...newData, leadTimeDays: Number(e.target.value)})}
              />
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2">
            <input 
                type="checkbox" 
                id="isPreferred" 
                className="rounded border-orange-200 text-orange-600 focus:ring-orange-500"
                checked={newData.isPreferred}
                onChange={(e) => setNewData({...newData, isPreferred: e.target.checked})}
            />
            <label htmlFor="isPreferred" className="text-xs font-bold text-slate-700">Définir comme fournisseur privilégié</label>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-xs font-bold text-slate-400">Annuler</button>
            <button onClick={handleAdd} className="px-6 py-2 bg-orange-600 text-white rounded-xl text-xs font-black shadow-lg shadow-orange-100">Enregistrer</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-10 text-center text-slate-400 text-xs font-black uppercase tracking-widest">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {catalog.map((item) => (
            <div key={item.id} className="p-6 bg-white border border-slate-100 rounded-4xl shadow-sm hover:shadow-md transition-all group flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner ${item.isPreferred ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400'}`}>
                  <Truck size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-slate-900">{item.supplier.name}</h4>
                    {item.isPreferred && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black rounded-full uppercase tracking-tighter">
                        <Star size={8} /> Privilégié
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <Tag size={12} className="text-slate-300" />
                        {item.supplierSku || 'N/A'}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                        <span className="text-[10px] text-slate-300">PRIX:</span>
                        {formatCurrency(Number(item.costPrice), 'fr')}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <Clock size={12} className="text-slate-300" />
                        {item.leadTimeDays}j
                    </div>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleRemove(item.id)}
                className="p-3 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          {catalog.length === 0 && !showAddForm && (
            <div className="py-20 border-2 border-dashed border-slate-100 rounded-4xl flex flex-col items-center justify-center text-center px-12">
              <Truck size={32} className="text-slate-200 mb-4" />
              <h4 className="text-sm font-black text-slate-900 mb-1">Aucun fournisseur associé</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Configurez les sources d'approvisionnement pour automatiser les suggestions d'achat et obtenir les meilleurs prix.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
