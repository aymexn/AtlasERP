'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations, useLocale } from 'next-intl';
import { 
  X, Tag, BarChart3, Package, Factory, 
  Calculator, Info, Plus, Trash2, ShieldCheck,
  TrendingDown, TrendingUp, Search, RefreshCw
} from 'lucide-react';
import { productFormSchema, ProductFormValues } from '@/schemas/product.schema';
import { productsService, Product } from '@/services/products';
import { ProductFamily } from '@/services/families';
import { formatCurrency } from '@/lib/formatters';
import { toast } from 'sonner';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: Partial<Product> | null;
  families: ProductFamily[];
  allProducts: Product[]; // New prop to select components
}

type TabType = 'general' | 'pricing' | 'stock' | 'formula';

export function ProductModal({ isOpen, onClose, onSuccess, product, families, allProducts }: ProductModalProps) {
  const t = useTranslations('products');
  const ct = useTranslations('common');
  const tt = useTranslations('toast');
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<TabType>('general');

  const methods = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema) as any,
    defaultValues: {
      articleType: 'FINISHED_PRODUCT',
      unit: 'PCS',
      taxRate: 0.19,
      isActive: true,
      salePriceHt: 0,
      standardCost: 0,
      purchasePriceHt: 0,
      minStock: 5,
      formulaLines: []
    }
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
    formState: { errors, isSubmitting }
  } = methods;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "formulaLines"
  });

  const articleType = watch('articleType');
  const salePriceHt = watch('salePriceHt') || 0;
  const taxRate = watch('taxRate') || 0;
  const purchasePriceHt = watch('purchasePriceHt') || 0;
  const formulaLines = watch('formulaLines') || [];

  // Visibility logic
  const isRawMaterial = articleType === 'RAW_MATERIAL';
  const canHaveFormula = articleType === 'FINISHED_PRODUCT' || articleType === 'SEMI_FINISHED';
  
  // Dynamic BOM Calculation
  const bomCost = useMemo(() => {
    return formulaLines.reduce((acc, line) => {
        const comp = allProducts.find(p => p.id === line.componentId);
        const cost = Number(comp?.standardCost || comp?.purchasePriceHt || 0);
        return acc + (cost * Number(line.quantity));
    }, 0);
  }, [formulaLines, allProducts]);

  // Update standard cost automatically for manufactured goods
  useEffect(() => {
    if (canHaveFormula) {
        setValue('standardCost', bomCost);
    }
  }, [bomCost, canHaveFormula, setValue]);

  const margin = salePriceHt - (isRawMaterial ? purchasePriceHt : bomCost);
  const marginPercent = salePriceHt > 0 ? (margin / salePriceHt) * 100 : 0;

  useEffect(() => {
    if (product) {
        // Extract lines from the first active formula if it exists
        const activeFormula = (product as any).bomsAsFinishedProduct?.[0];
        const existingLines = activeFormula?.components?.map((c: any) => ({
            componentId: c.componentProductId,
            quantity: Number(c.quantity),
            unit: c.unit || 'KG'
        })) || [];
        
        reset({
            name: product.name,
            secondaryName: product.secondaryName,
            sku: product.sku,
            familyId: product.familyId,
            articleType: product.articleType as any,
            salePriceHt: Number(product.salePriceHt),
            taxRate: Number(product.taxRate),
            purchasePriceHt: Number(product.purchasePriceHt),
            standardCost: Number(product.standardCost),
            unit: product.unit,
            minStock: Number(product.minStock),
            trackStock: product.trackStock,
            description: product.description,
            isActive: product.isActive,
            formulaLines: existingLines
        });
    } else {
        reset({
            articleType: 'FINISHED_PRODUCT',
            unit: 'PCS',
            taxRate: 0.19,
            isActive: true,
            salePriceHt: 0,
            standardCost: 0,
            purchasePriceHt: 0,
            minStock: 5,
            formulaLines: []
        });
    }
  }, [product, reset]);

  // Tab dynamic visibility handling
  useEffect(() => {
    if (activeTab === 'formula' && !canHaveFormula) {
        setActiveTab('general');
    }
  }, [articleType, activeTab, canHaveFormula]);

  // DEBUG: Monitor validation errors
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log("Erreurs Zod actives:", errors);
    }
  }, [errors]);

  const onSubmit = async (values: any) => {
    console.log('Payload reçu (POST /api/products):', values);
    try {
      let response;
      if (product?.id) {
        response = await productsService.update(product.id, values);
      } else {
        response = await productsService.create(values);
      }
      console.log('Réponse Serveur:', response);
      toast.success(product?.id ? 'Produit mis à jour' : 'Produit créé avec succès');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erreur soumission:', err);
      toast.error(err.message || tt('error'));
    }
  };

  const onError = (errors: any) => {
    console.log("Erreurs Zod lors du SAVE:", errors);
    const errorMessages = [];
    
    if (errors.name) errorMessages.push("Désignation");
    if (errors.sku) errorMessages.push("Référence (SKU)");
    if (errors.articleType) errorMessages.push("Type d'article");
    if (errors.salePriceHt) errorMessages.push("Prix de vente");
    if (errors.purchasePriceHt) errorMessages.push("Prix d'achat");
    if (errors.unit) errorMessages.push("Unité de mesure");
    if (errors.minStock) errorMessages.push("Stock minimum");
    if (errors.formulaLines) errorMessages.push("Composants de la formule");

    const description = errorMessages.length > 0 
      ? `Champs invalides : ${errorMessages.join(', ')}`
      : 'Veuillez vérifier les champs obligatoires.';

    toast.error('Formulaire invalide', { 
      description,
      duration: 5000,
    });

    // Switch to the first tab with an error
    if (errors.name || errors.sku || errors.articleType || errors.familyId) {
      setActiveTab('general');
    } else if (errors.salePriceHt || errors.taxRate || errors.purchasePriceHt) {
      setActiveTab('pricing');
    } else if (errors.unit || errors.minStock) {
      setActiveTab('stock');
    } else if (errors.formulaLines) {
      setActiveTab('formula');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="bg-white rounded-[2rem] w-full max-w-3xl relative z-10 shadow-2xl flex flex-col h-[85vh] animate-in zoom-in-95 duration-200 border border-slate-200">
        
        {/* Header - Industrial & Clean */}
        <div className="p-8 pb-6 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                <Factory size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter">
                {product?.id ? t('edit') : t('add')}
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">
                {articleType ? t(`article_types.${articleType}`) : 'CONFIGURATION PRODUIT'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-all border border-slate-100 shadow-sm">
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex px-8 py-2 gap-8 border-b border-slate-100 overflow-x-auto no-scrollbar bg-slate-50/30">
          <TabButton 
            active={activeTab === 'general'} 
            onClick={() => setActiveTab('general')} 
            icon={<Tag size={16}/>} 
            label={t('tabs.general')} 
            hasError={!!(errors.name || errors.sku || errors.articleType)}
          />
          <TabButton 
            active={activeTab === 'pricing'} 
            onClick={() => setActiveTab('pricing')} 
            icon={<BarChart3 size={16}/>} 
            label="Tarification" 
            hasError={!!(errors.salePriceHt || errors.taxRate || errors.purchasePriceHt)}
          />
          <TabButton 
            active={activeTab === 'stock'} 
            onClick={() => setActiveTab('stock')} 
            icon={<Package size={16}/>} 
            label="Inventaire" 
            hasError={!!(errors.unit || errors.minStock)}
          />
          {canHaveFormula && (
            <TabButton 
                active={activeTab === 'formula'} 
                onClick={() => setActiveTab('formula')} 
                icon={<Factory size={16}/>} 
            label="Formulation / OF" 
            hasError={!!errors.formulaLines || (canHaveFormula && bomCost === 0 && articleType !== 'SERVICE')}
          />
          )}
        </div>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit as any, onError)} className="flex-1 flex flex-col overflow-hidden">
            <div className="p-8 overflow-y-auto space-y-8">
              
              {/* CONTENT TABS */}
              {activeTab === 'general' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2 space-y-2">
                      <FieldLabel label={t('fields.name')} />
                      <input {...register('name')} className={`form-input ${errors.name ? 'border-rose-500 bg-rose-50' : ''}`} placeholder="Désignation commerciale..." />
                      {errors.name && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <FieldLabel label={t('fields.code')} />
                        <input {...register('sku')} className={`form-input font-mono font-black ${errors.sku ? 'border-rose-500 bg-rose-50' : ''}`} placeholder="SKU-XXXX" />
                        {errors.sku && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.sku.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <FieldLabel label={t('fields.type')} />
                        <select {...register('articleType')} className="form-select">
                            <option value="FINISHED_PRODUCT">{t('article_types.FINISHED_PRODUCT')}</option>
                            <option value="SEMI_FINISHED">{t('article_types.SEMI_FINISHED')}</option>
                            <option value="RAW_MATERIAL">{t('article_types.RAW_MATERIAL')}</option>
                            <option value="PACKAGING">{t('article_types.PACKAGING')}</option>
                            <option value="CONSUMABLE">{t('article_types.CONSUMABLE')}</option>
                            <option value="SERVICE">{t('article_types.SERVICE')}</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <FieldLabel label="Famille de produit" />
                        <select {...register('familyId')} className="form-select">
                            <option value="">Sans famille</option>
                            {families.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                      <FieldLabel label="Description" />
                      <input {...register('description')} className="form-input" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'pricing' && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                   <div className="grid grid-cols-2 gap-6">
                      
                      {/* Left Side: Basic Cost */}
                      <div className="space-y-6">
                        {isRawMaterial ? (
                           <div className="space-y-2">
                              <FieldLabel label="Prix d'Achat HT" />
                              <input 
                                type="number" 
                                step="0.01" 
                                {...register('purchasePriceHt', { valueAsNumber: true })} 
                                className="form-input text-blue-600 font-black" 
                              />
                              <p className="text-[10px] text-slate-400 italic">Dernier prix d'acquisition négocié.</p>
                           </div>
                        ) : (
                           <div className="space-y-2">
                              <FieldLabel label="Coût de Revient (BOM)" />
                              <div className="relative group">
                                <input 
                                    type="number" 
                                    readOnly 
                                    value={bomCost.toFixed(2)}
                                    className="form-input-readonly bg-slate-50" 
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Calculator size={14} />
                                </div>
                              </div>
                              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Info size={10} /> Calculé dynamiquement depuis l'onglet formulation.
                              </p>
                           </div>
                        )}

                        {!isRawMaterial && (
                          <div className="space-y-2">
                               <FieldLabel label="Prix de Vente HT" />
                               <input 
                                  type="number" 
                                  step="0.01" 
                                  {...register('salePriceHt', { valueAsNumber: true })} 
                                  className="form-input font-black text-slate-900"
                               />
                          </div>
                        )}
                      </div>

                      {/* Right Side: Indicators */}
                      <div className="space-y-6">
                         {!isRawMaterial && (
                           <>
                              <div className="p-6 bg-slate-950 rounded-3xl text-white shadow-xl">
                                  <div className="flex items-center justify-between mb-4">
                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Rentabilité estimée</span>
                                    {marginPercent >= 10 ? <TrendingUp size={14} className="text-emerald-400" /> : <TrendingDown size={14} className="text-red-400" />}
                                  </div>
                                  <div className="text-4xl font-black mb-1">
                                    {formatCurrency(margin, locale)}
                                  </div>
                                  <div className={`text-sm font-black ${marginPercent < 10 ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {marginPercent.toFixed(1)}% de marge brute
                                  </div>
                              </div>

                              <div className="space-y-2">
                                <FieldLabel label="Taux de TVA" />
                                <select {...register('taxRate', { valueAsNumber: true })} className="form-select" disabled={isRawMaterial}>
                                    <option value={0.19}>19% (Standard)</option>
                                    <option value={0.09}>9% (Réduit)</option>
                                    <option value={0}>0% (Exonéré)</option>
                                </select>
                              </div>
                           </>
                         )}
                         {isRawMaterial && (
                            <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl p-8 text-center">
                                <div>
                                    <ShieldCheck size={32} className="text-slate-200 mx-auto mb-2" />
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                                        Consommation <br/>Interne Uniquement
                                    </p>
                                </div>
                            </div>
                         )}
                      </div>

                      {/* TTC Banner */}
                      {!isRawMaterial && (
                         <div className="col-span-2 p-6 bg-blue-600 rounded-3xl shadow-xl shadow-blue-100 flex items-center justify-between text-white">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">PRIX PUBLIC TTC</span>
                            <span className="text-3xl font-black">
                                {formatCurrency(salePriceHt * (1 + taxRate), locale)}
                            </span>
                         </div>
                      )}
                   </div>
                </div>
              )}

              {activeTab === 'stock' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <FieldLabel label="Unité de mesure" />
                            <select {...register('unit')} className="form-select uppercase font-black">
                                <option value="PCS">PCS (Pièces)</option>
                                <option value="KG">KG (Kilogrammes)</option>
                                <option value="L">L (Litres)</option>
                                <option value="ML">ML (Millilitres)</option>
                                <option value="M">M (Mètres)</option>
                                <option value="M2">M2 (Mètres Carrés)</option>
                                <option value="U">U (Unité)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <FieldLabel label="Seuil d'alerte (Min)" />
                            <input type="number" {...register('minStock', { valueAsNumber: true })} className="form-input text-orange-600 font-bold" />
                        </div>
                        <div className="col-span-2 flex items-center gap-3 p-6 bg-slate-50 border border-slate-100 rounded-3xl">
                            <input type="checkbox" id="trackStock" {...register('trackStock')} className="h-6 w-6 rounded-lg accent-slate-900" />
                            <label htmlFor="trackStock" className="flex-1">
                                <p className="text-sm font-black text-slate-900">Suivre les stocks</p>
                                <p className="text-[11px] text-slate-500 font-medium italic">Activer le monitoring des entrées/sorties pour cet article.</p>
                            </label>
                        </div>
                    </div>
                </div>
              )}

              {activeTab === 'formula' && (
                 <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Nomenclature des composants</h3>
                        <button 
                            type="button" 
                            onClick={() => append({ componentId: '', quantity: 1, unit: 'KG' })}
                            className="text-[10px] font-black bg-emerald-500 text-white px-4 py-2 rounded-xl hover:bg-emerald-600 transition-all flex items-center gap-2"
                        >
                            <Plus size={14} /> AJOUTER UN COMPOSANT
                        </button>
                    </div>

                    <div className="space-y-3">
                        {fields.map((field, index) => {
                            const selectedProdId = watch(`formulaLines.${index}.componentId`);
                            const comp = allProducts.find(p => p.id === selectedProdId);
                            
                            return (
                                <div key={field.id} className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-blue-100 transition-all group">
                                    <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                                        <div className="col-span-7">
                                            <select 
                                                {...register(`formulaLines.${index}.componentId`)} 
                                                className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all"
                                            >
                                                <option value="">Sélectionner un produit...</option>
                                                {allProducts.filter(p => p.articleType === 'RAW_MATERIAL' || p.articleType === 'SEMI_FINISHED').map(p => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.name} ({p.stockQuantity} {p.unit})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-span-3 flex items-center gap-2">
                                            <input 
                                                type="number" 
                                                placeholder="Qté"
                                                {...register(`formulaLines.${index}.quantity`, { valueAsNumber: true })}
                                                className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-sm font-black focus:ring-2 focus:ring-blue-100 placeholder:font-medium"
                                            />
                                            <select 
                                                {...register(`formulaLines.${index}.unit` as any)}
                                                className="bg-slate-50 border-none rounded-lg px-1 py-1 text-[9px] font-black uppercase text-slate-400"
                                            >
                                                <option value="KG">KG</option>
                                                <option value="L">L</option>
                                                <option value="PCS">PCS</option>
                                                <option value="G">G</option>
                                                <option value="ML">ML</option>
                                            </select>
                                        </div>
                                        <div className="col-span-2 text-right">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Coût unit.</p>
                                            <p className="text-[11px] font-black text-slate-900">{formatCurrency(Number(comp?.standardCost || comp?.purchasePriceHt || 0), locale)}</p>
                                        </div>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => remove(index)}
                                        className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            );
                        })}

                        {fields.length === 0 && (
                            <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                                <Factory size={40} className="mx-auto text-slate-100 mb-4" />
                                <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em]">Aucun composant défini</p>
                            </div>
                        )}
                    </div>

                    {fields.length > 0 && (
                        <div className="p-6 bg-slate-50 rounded-[2rem] flex items-center justify-between border border-slate-100">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Coût total production (HT)</span>
                             <span className="text-2xl font-black text-slate-900">{formatCurrency(bomCost, locale)}</span>
                        </div>
                    )}
                 </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-8 border-t border-slate-100 flex items-center justify-between bg-slate-50/10">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <input type="checkbox" id="isActiveFinal" {...register('isActive')} className="h-4 w-4 rounded-md accent-slate-900" />
                    <label htmlFor="isActiveFinal" className="text-xs font-black text-slate-700 cursor-pointer">ARTICE ACTIF</label>
                </div>
                <button
                    disabled={isSubmitting}
                    className="px-10 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-[0.3em] text-xs shadow-2xl shadow-slate-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center gap-3"
                >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" /> {ct.has('submitting') ? ct('submitting') : 'Enregistrement...'}
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={16} /> {ct('save')}
                      </>
                    )}
                </button>
            </div>
          </form>
        </FormProvider>
      </div>

      <style jsx global>{`
        .form-input {
          width: 100%;
          padding: 1rem 1.25rem;
          background-color: #f8fafc;
          border: 2px solid #f1f5f9;
          border-radius: 1rem;
          outline: none;
          transition: all 0.2s;
          font-weight: 700;
          font-size: 0.875rem;
          color: #1e293b;
        }
        .form-input:focus {
          border-color: #cbd5e1;
          background-color: white;
          box-shadow: 0 0 0 4px #f1f5f9;
        }
        .form-input-readonly {
          width: 100%;
          padding: 1rem 1.25rem;
          border: 2px solid #f1f5f9;
          border-radius: 1rem;
          outline: none;
          font-weight: 900;
          font-size: 0.875rem;
          color: #94a3b8;
          cursor: not-allowed;
        }
        .form-select {
          width: 100%;
          padding: 1rem 1.25rem;
          background-color: #f8fafc;
          border: 2px solid #f1f5f9;
          border-radius: 1rem;
          outline: none;
          transition: all 0.2s;
          font-weight: 700;
          font-size: 0.875rem;
          color: #1e293b;
        }
        .form-select:focus {
          border-color: #cbd5e1;
          box-shadow: 0 0 0 4px #f1f5f9;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

function TabButton({ active, icon, label, onClick, hasError }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void, hasError?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`py-6 flex items-center gap-2 border-b-2 transition-all group relative ${
        active ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'
      } ${hasError ? 'text-rose-500' : ''}`}
    >
      <span className={`transition-transform duration-300 ${active ? 'scale-110' : 'scale-100 group-hover:scale-105'}`}>
        {icon}
      </span>
      <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
      {hasError && (
        <span className="absolute top-4 -right-1 h-2 w-2 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
      )}
      {active && (
        <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-slate-900 rounded-full animate-in fade-in zoom-in-50 duration-300" />
      )}
    </button>
  );
}

function FieldLabel({ label }: { label: string }) {
  return <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{label}</label>;
}
