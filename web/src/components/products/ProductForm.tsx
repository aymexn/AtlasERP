'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productFormSchema, ProductFormValues } from '@/schemas/product.schema';
import { productsService, Product } from '@/services/products';
import { familiesService, ProductFamily } from '@/services/families';
import { MarginGauge } from './MarginGauge';
import { BOMTable } from './BOMTable';
import { VariantTable } from './VariantTable';
import { useRouter } from '@/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { 
  Tag, BarChart3, Package, Factory, Layers, 
  Save, RefreshCw, AlertCircle, ArrowLeft, Loader2 
} from 'lucide-react';
import { formatCurrency } from '@/lib/format';

interface ProductFormProps {
  initialProduct?: Product | null;
}

type TabType = 'general' | 'pricing' | 'stock' | 'formula' | 'variants';

export const ProductForm: React.FC<ProductFormProps> = ({ initialProduct }) => {
  const t = useTranslations('products');
  const ct = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [families, setFamilies] = useState<ProductFamily[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(true);
  
  // SKU check state
  const [skuChecking, setSkuChecking] = useState(false);
  const [skuError, setSkuError] = useState<string | null>(null);

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
      formulaLines: [],
      trackStock: true
    }
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = methods;

  const articleType = watch('articleType');
  const salePriceHt = watch('salePriceHt') || 0;
  const taxRate = watch('taxRate') || 0;
  const purchasePriceHt = watch('purchasePriceHt') || 0;
  const formulaLines = watch('formulaLines') || [];
  const skuValue = watch('sku');

  // Load families metadata on mount
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const familiesData = await familiesService.list();
        setFamilies(familiesData || []);
      } catch (err) {
        console.error('Failed to load form metadata', err);
        toast.error('Erreur lors du chargement des familles');
      } finally {
        setLoadingMetadata(false);
      }
    };
    loadMetadata();
  }, []);

  // Initialize values if modifying existing product
  const initialProductId = initialProduct?.id;
  useEffect(() => {
    if (initialProduct) {
      const activeFormula = (initialProduct as any).bomsAsFinishedProduct?.[0];
      const existingLines = activeFormula?.components?.map((c: any) => ({
        componentId: c.componentProductId,
        componentName: c.component?.name || '',
        componentSku: c.component?.sku || '',
        quantity: Number(c.quantity),
        unit: c.unit || 'KG',
        unitCost: c.unitCost !== null && c.unitCost !== undefined ? Number(c.unitCost) : Number(c.component?.standardCost || c.component?.purchasePriceHt || 0)
      })) || [];

      reset({
        name: initialProduct.name,
        secondaryName: initialProduct.secondaryName || '',
        sku: initialProduct.sku,
        familyId: initialProduct.familyId,
        articleType: (initialProduct.articleType || 'FINISHED_PRODUCT') as any,
        salePriceHt: Number(initialProduct.salePriceHt || 0),
        taxRate: Number(initialProduct.taxRate || 0.19),
        purchasePriceHt: Number(initialProduct.purchasePriceHt || 0),
        standardCost: Number(initialProduct.standardCost || 0),
        unit: initialProduct.unit || 'PCS',
        minStock: Number(initialProduct.minStock || 5),
        trackStock: initialProduct.trackStock,
        description: initialProduct.description || '',
        isActive: initialProduct.isActive,
        formulaLines: existingLines
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProductId, reset]);

  // Validation SKU Uniqueness (debounce/check on blur or SKU change with 1000ms delay)
  useEffect(() => {
    if (!skuValue) {
      setSkuError(null);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      // Don't check if SKU is unchanged from the initial product SKU
      if (initialProduct && skuValue.trim() === initialProduct.sku.trim()) {
        setSkuError(null);
        return;
      }

      setSkuChecking(true);
      try {
        const res = await fetch(`/api/products/check-sku?sku=${encodeURIComponent(skuValue)}`);
        const data = await res.json();
        if (data.exists) {
          setSkuError("Cette référence (SKU) est déjà utilisée.");
        } else {
          setSkuError(null);
        }
      } catch (err) {
        console.error('SKU validation failed', err);
      } finally {
        setSkuChecking(false);
      }
    }, 1500); // 1500ms debounce guard

    return () => clearTimeout(delayDebounceFn);
  }, [skuValue, initialProduct]);

  // Visibility logic
  const isInternalOnly = ['RAW_MATERIAL', 'PACKAGING', 'CONSUMABLE'].includes(articleType);
  const canHaveFormula = articleType === 'FINISHED_PRODUCT' || articleType === 'SEMI_FINISHED';

  // Calculate BOM total cost directly from formulaLines
  const bomCost = useMemo(() => {
    return formulaLines.reduce((acc, line) => {
      const cost = line.unitCost !== undefined && line.unitCost !== null ? Number(line.unitCost) : 0;
      return acc + cost * Number(line.quantity || 0);
    }, 0);
  }, [formulaLines]);

  // Set default units based on type
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'articleType') {
        const type = value.articleType;
        if (type === 'RAW_MATERIAL') setValue('unit', 'KG');
        else if (type === 'PACKAGING' || type === 'FINISHED_PRODUCT') setValue('unit', 'PCS');
        else if (type === 'SERVICE') setValue('unit', 'UNIT');
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue]);

  // Handle SKU auto generation (for standard ERP feel)
  const handleGenerateSKU = () => {
    const random = Math.floor(1000 + Math.random() * 9000);
    const prefix = articleType ? articleType.substring(0, 3) : 'ART';
    const sku = `${prefix}-${random}`;
    setValue('sku', sku, { shouldValidate: true });
    toast.info("SKU généré automatiquement");
  };

  const marginCost = canHaveFormula ? bomCost : purchasePriceHt;
  const priceTtc = salePriceHt * (1 + taxRate);

  const onSubmit = async (values: any) => {
    if (skuError) {
      toast.error("Veuillez corriger les erreurs de SKU avant de soumettre.");
      return;
    }

    try {
      if (initialProduct?.id) {
        await productsService.update(initialProduct.id, values);
        toast.success("Produit mis à jour avec succès");
      } else {
        await productsService.create(values);
        toast.success("Produit créé avec succès");
      }
      router.push('/catalogue/products');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "La soumission du produit a échoué.");
    }
  };

  const onError = (formErrors: any) => {
    console.error('Validation Errors', formErrors);
    toast.error("Formulaire invalide", {
      description: "Veuillez vérifier les champs obligatoires dans les différents onglets."
    });
  };

  if (loadingMetadata) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="animate-spin text-slate-900" size={40} />
        <p className="text-xs font-black text-slate-450 uppercase tracking-widest">
          Chargement de l'éditeur...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16 animate-in fade-in duration-500">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push('/catalogue/products')}
            className="p-3 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-900 rounded-2xl border border-slate-200 shadow-3xs transition-all"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
              {initialProduct ? "Modifier l'article" : "Créer un article"}
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              {initialProduct
                ? `Édition des paramètres de l'article : ${initialProduct.name}`
                : "Ajout d'un nouvel article au catalogue AtlasERP"}
            </p>
          </div>
        </div>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit, onError)} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Form Fields (Tabs Card) */}
          <div className="lg:col-span-8 bg-white border border-slate-150 rounded-[2rem] shadow-sm overflow-hidden">
            {/* Tabs List */}
            <div className="flex px-8 py-2 gap-6 border-b border-slate-100 bg-slate-50/20 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`py-5 flex items-center gap-2 border-b-2 font-black text-[10px] uppercase tracking-wider transition-all ${
                  activeTab === 'general'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Tag size={14} />
                Général
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pricing')}
                className={`py-5 flex items-center gap-2 border-b-2 font-black text-[10px] uppercase tracking-wider transition-all ${
                  activeTab === 'pricing'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <BarChart3 size={14} />
                Tarification
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('stock')}
                className={`py-5 flex items-center gap-2 border-b-2 font-black text-[10px] uppercase tracking-wider transition-all ${
                  activeTab === 'stock'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Package size={14} />
                Stock
              </button>
              {canHaveFormula && (
                <button
                  type="button"
                  onClick={() => setActiveTab('formula')}
                  className={`py-5 flex items-center gap-2 border-b-2 font-black text-[10px] uppercase tracking-wider transition-all ${
                    activeTab === 'formula'
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Factory size={14} />
                  Formulation
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveTab('variants')}
                className={`py-5 flex items-center gap-2 border-b-2 font-black text-[10px] uppercase tracking-wider transition-all ${
                  activeTab === 'variants'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Layers size={14} />
                Variants
              </button>
            </div>

            {/* Tabs Content */}
            <div className="p-8 space-y-6">
              {/* Tab 1: General */}
              {activeTab === 'general' && (
                <div className="space-y-6 animate-in slide-in-from-right-3 duration-300">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest px-1">
                      Nom du produit <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('name')}
                      placeholder="Nom / Désignation commerciale..."
                      className="form-input"
                    />
                    {errors.name && (
                      <p className="text-[10px] text-rose-500 font-bold px-1">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest px-1">
                        Référence SKU <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          {...register('sku')}
                          placeholder="SKU-XXXX"
                          className={`form-input uppercase font-mono font-bold ${
                            skuError ? 'border-rose-350 bg-rose-50/20' : ''
                          }`}
                        />
                        <button
                          type="button"
                          onClick={handleGenerateSKU}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                          title="Générer SKU"
                        >
                          <RefreshCw size={14} className={skuChecking ? 'animate-spin' : ''} />
                        </button>
                      </div>
                      {skuError ? (
                        <p className="text-[10px] text-rose-500 font-bold px-1">{skuError}</p>
                      ) : (
                        errors.sku && (
                          <p className="text-[10px] text-rose-500 font-bold px-1">
                            {errors.sku.message}
                          </p>
                        )
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest px-1">
                        Type de produit <span className="text-rose-500">*</span>
                      </label>
                      <select {...register('articleType')} className="form-select">
                        <option value="FINISHED_PRODUCT">Produit Fini (Fabriqué)</option>
                        <option value="SEMI_FINISHED">Semi-Fini (Intermédiaire)</option>
                        <option value="RAW_MATERIAL">Matière Première</option>
                        <option value="PACKAGING">Emballage</option>
                        <option value="CONSUMABLE">Consommable</option>
                        <option value="SERVICE">Service</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest px-1">
                        Unité de vente
                      </label>
                      <select {...register('unit')} className="form-select uppercase">
                        <option value="PCS">PCS (Pièce)</option>
                        <option value="KG">KG (Kilogramme)</option>
                        <option value="L">L (Litre)</option>
                        <option value="M">M (Mètre)</option>
                        <option value="M2">M2 (Mètre Carré)</option>
                        <option value="UNIT">UNIT (Unité)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest px-1">
                        Catégorie / Famille
                      </label>
                      <select {...register('familyId')} className="form-select">
                        <option value="">Sélectionner une famille...</option>
                        {families.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest px-1">
                      Description commerciale
                    </label>
                    <textarea
                      rows={3}
                      {...register('description')}
                      placeholder="Spécifications, détails..."
                      className="form-textarea"
                    />
                  </div>

                  <div className="flex items-center gap-3 p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <input
                      type="checkbox"
                      id="isActive"
                      {...register('isActive')}
                      className="h-5 w-5 rounded border-slate-200 accent-slate-900 cursor-pointer"
                    />
                    <label htmlFor="isActive" className="cursor-pointer select-none">
                      <p className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        Article actif
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                        Permettre l'utilisation de cet article dans les commandes et mouvements
                      </p>
                    </label>
                  </div>
                </div>
              )}

              {/* Tab 2: Pricing */}
              {activeTab === 'pricing' && (
                <div className="space-y-6 animate-in slide-in-from-right-3 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest px-1">
                          Prix de vente HT (DA)
                        </label>
                        <input
                          type="number"
                          step="any"
                          {...register('salePriceHt', { valueAsNumber: true })}
                          placeholder="0.00"
                          className="form-input text-lg font-black"
                        />
                        {errors.salePriceHt && (
                          <p className="text-[10px] text-rose-500 font-bold px-1">
                            {errors.salePriceHt.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest px-1">
                          Taux de TVA
                        </label>
                        <select
                          {...register('taxRate', { valueAsNumber: true })}
                          className="form-select"
                        >
                          <option value={0.19}>19% (Standard)</option>
                          <option value={0.09}>9% (Réduit)</option>
                          <option value={0.07}>7%</option>
                          <option value={0.10}>10%</option>
                          <option value={0.25}>25%</option>
                          <option value={0}>0% (Exonéré)</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest px-1">
                          Coût d'achat unitaire (DA)
                        </label>
                        {canHaveFormula ? (
                          <div className="relative group">
                            <input
                              type="number"
                              readOnly
                              value={bomCost.toFixed(2)}
                              className="form-input bg-slate-50 text-slate-400 font-black cursor-not-allowed"
                            />
                            <p className="text-[9px] text-slate-400 font-bold mt-1 flex items-center gap-1">
                              <AlertCircle size={10} /> Coût estimé par la formule de production.
                            </p>
                          </div>
                        ) : (
                          <input
                            type="number"
                            step="any"
                            {...register('purchasePriceHt', { valueAsNumber: true })}
                            placeholder="0.00"
                            className="form-input text-blue-600 font-black"
                          />
                        )}
                      </div>
                    </div>

                    {/* Profit Gauge */}
                    <div className="space-y-6">
                      <MarginGauge
                        salePriceHt={Number(salePriceHt || 0)}
                        costPrice={Number(marginCost || 0)}
                      />

                      {/* Dynamic TTC Display Banner */}
                      <div className="p-6 bg-blue-600 rounded-3xl text-white shadow-xl shadow-blue-100 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-widest opacity-75">
                            PRIX TTC CLIENT
                          </span>
                          <p className="text-[9px] text-white/60 font-bold mt-0.5 uppercase">
                            TVA incluse
                          </p>
                        </div>
                        <span className="text-3xl font-black">{formatCurrency(priceTtc)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Inventory */}
              {activeTab === 'stock' && (
                <div className="space-y-6 animate-in slide-in-from-right-3 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest px-1">
                        Stock initial de départ
                      </label>
                      <input
                        type="number"
                        {...register('stockQuantity', { valueAsNumber: true })}
                        placeholder="0"
                        className="form-input font-black"
                        disabled={!!initialProduct} // Disable for editing
                      />
                      <p className="text-[9px] text-slate-400 font-bold italic px-1">
                        Déterminable uniquement lors de la création.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest px-1">
                        Seuil d'alerte (Stock Bas)
                      </label>
                      <input
                        type="number"
                        {...register('minStock', { valueAsNumber: true })}
                        placeholder="5"
                        className="form-input text-orange-600 font-black"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <input
                      type="checkbox"
                      id="trackStock"
                      {...register('trackStock')}
                      className="h-5 w-5 rounded border-slate-200 accent-slate-900 cursor-pointer"
                    />
                    <label htmlFor="trackStock" className="cursor-pointer select-none">
                      <p className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        Activer le suivi d'inventaire
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                        Génère des mouvements et bloque les ventes si le stock est épuisé.
                      </p>
                    </label>
                  </div>
                </div>
              )}

              {/* Tab 4: Formula BOM */}
              {activeTab === 'formula' && canHaveFormula && (
                <div className="animate-in slide-in-from-right-3 duration-300">
                  <BOMTable excludeId={initialProduct?.id} />
                </div>
              )}

              {/* Tab 5: Variants */}
              {activeTab === 'variants' && (
                <div className="animate-in slide-in-from-right-3 duration-300">
                  <VariantTable productId={initialProduct?.id} />
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-8 border-t border-slate-100 flex items-center justify-between bg-slate-50/10">
              <span className="text-[10px] text-slate-450 font-black uppercase tracking-wider">
                * Champs obligatoires
              </span>
              <button
                type="submit"
                disabled={isSubmitting || skuChecking || !!skuError}
                className="px-10 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> {ct('submitting')}
                  </>
                ) : (
                  <>
                    <Save size={14} /> {ct('save')}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sidebar Summary Card */}
          <div className="lg:col-span-4 bg-white border border-slate-150 rounded-[2rem] shadow-sm p-8 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-450">
              Synthèse de l'article
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase">Statut</span>
                <span
                  className={`text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wide border ${
                    watch('isActive')
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : 'bg-rose-50 text-rose-700 border-rose-100'
                  }`}
                >
                  {watch('isActive') ? 'Actif' : 'Inactif'}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase">Type</span>
                <span className="text-xs font-bold text-slate-700">
                  {articleType ? t(`article_types.${articleType}`) : 'Indéfini'}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase">Réf (SKU)</span>
                <span className="text-xs font-mono font-black uppercase text-blue-600">
                  {skuValue || 'NON DÉFINI'}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase">Prix HT</span>
                <span className="text-xs font-black text-slate-900">
                  {formatCurrency(Number(salePriceHt || 0))}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase">Coût de Revient</span>
                <span className="text-xs font-black text-slate-900">
                  {formatCurrency(Number(marginCost || 0))}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase">Marge brute</span>
                <span className={`text-xs font-black ${
                  salePriceHt > 0 && ((salePriceHt - marginCost) / salePriceHt * 100) >= 30
                    ? 'text-emerald-600'
                    : (salePriceHt > 0 && ((salePriceHt - marginCost) / salePriceHt * 100) >= 10)
                      ? 'text-amber-600'
                      : 'text-rose-600'
                }`}>
                  {salePriceHt > 0 ? `${(((salePriceHt - marginCost) / salePriceHt) * 100).toFixed(1)}%` : '0.0%'}
                  <span className="text-[9px] font-bold text-slate-400 ml-1">
                    ({formatCurrency(salePriceHt - marginCost)})
                  </span>
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase">TVA</span>
                <span className="text-xs font-bold text-slate-500">{(taxRate * 100).toFixed(0)}%</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-[10px] font-black text-slate-400 uppercase">Prix TTC</span>
                <span className="text-sm font-black text-blue-600">
                  {formatCurrency(priceTtc)}
                </span>
              </div>
            </div>
          </div>
        </form>
      </FormProvider>

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
        .form-textarea {
          width: 100%;
          padding: 1rem 1.25rem;
          background-color: #f8fafc;
          border: 2px solid #f1f5f9;
          border-radius: 1.25rem;
          outline: none;
          transition: all 0.2s;
          font-weight: 700;
          font-size: 0.875rem;
          color: #1e293b;
        }
        .form-textarea:focus {
          border-color: #cbd5e1;
          background-color: white;
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
};
