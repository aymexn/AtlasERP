import { useFormContext, useWatch } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export function ProductTarificationTab() {
  const { control, register, formState: { errors } } = useFormContext();
  
  // Watch the classification field to conditionally show/hide fields
  const classification = useWatch({
    control,
    name: 'classification',
    defaultValue: 'FINISHED_PRODUCT'
  });
  
  // Determine if this is a raw material (not sold)
  const isRawMaterial = classification === 'RAW_MATERIAL' || 
                        classification === 'PACKAGING' ||
                        classification === 'CONSUMABLE';
  
  // Determine if this is a finished product (sold)
  const isFinishedProduct = classification === 'FINISHED_PRODUCT' || 
                            classification === 'SEMI_FINISHED';

  return (
    <div className="space-y-6">
      
      {/* SECTION 1: SALE PRICE - Only for Finished Products */}
      {isFinishedProduct && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Prix de Vente</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Prix Vente HT</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('salePriceHt', { valueAsNumber: true })}
              />
              {errors.salePriceHt && (
                <p className="text-xs text-red-500 mt-1">{(errors.salePriceHt as any).message}</p>
              )}
            </div>
            
            <div>
              <label className="text-sm text-gray-600">TVA (%)</label>
              <select 
                {...register('taxRate')}
                className="w-full h-10 px-3 py-2 bg-background border border-input rounded-md text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="19">19% (Taux normal)</option>
                <option value="9">9% (Taux réduit)</option>
                <option value="0">0% (Exonéré)</option>
              </select>
            </div>
          </div>
          
          {/* Blue Banner - Sale Price TTC */}
          <div className="bg-blue-600 rounded-lg p-6 text-white">
            <div className="flex justify-between items-center">
              <span className="text-sm uppercase tracking-wide">Prix TTC</span>
              <span className="text-3xl font-bold">
                {(() => {
                  const salePrice = parseFloat(useWatch({ control, name: 'salePriceHt' }) || 0);
                  const taxRate = parseFloat(useWatch({ control, name: 'taxRate' }) || 19);
                  const priceTTC = salePrice * (1 + taxRate / 100);
                  return `${priceTTC.toFixed(2)} DA`;
                })()}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* SECTION 2: PURCHASE PRICE & COST - Always shown */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Coûts et Achats</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Prix Achat HT</label>
            <Input
              type="number"
              step="0.01"
              placeholder="0"
              {...register('purchasePriceHt', { valueAsNumber: true })}
            />
            <p className="text-xs text-gray-500 mt-1">
              {isRawMaterial ? 'Prix fournisseur' : 'Coût de revient'}
            </p>
          </div>
          
          <div>
            <label className="text-sm text-gray-600">Coût Standard / PMP</label>
            <Input
              type="number"
              step="0.01"
              placeholder="0"
              {...register('standardCost', { valueAsNumber: true })}
              disabled={isFinishedProduct} // Read-only for finished products (calculated from BOM)
              className={isFinishedProduct ? 'bg-gray-100 cursor-not-allowed' : ''}
            />
            <p className="text-xs text-gray-500 mt-1">
              {isFinishedProduct 
                ? 'Calculé par la formule (BOM)' 
                : 'Prix Moyen Pondéré'}
            </p>
          </div>
        </div>
        
        {/* Profitability Calculator - Only for finished products with both prices */}
        {isFinishedProduct && (
          <div className="bg-slate-900 rounded-lg p-4 text-white">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase text-slate-400">Marge Brute</p>
                <p className="text-2xl font-bold text-green-400">
                  {(() => {
                    const sale = parseFloat(useWatch({ control, name: 'salePriceHt' }) || 0);
                    const cost = parseFloat(useWatch({ control, name: 'purchasePriceHt' }) || 0);
                    const margin = sale - cost;
                    return `${margin.toFixed(2)} DA`;
                  })()}
                  <span className="text-xs ml-2 text-slate-400">ACHAT</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Basé sur le dernier prix d'achat HT
                </p>
              </div>
              
              <div>
                <p className="text-xs uppercase text-slate-400">% Marge</p>
                <p className="text-2xl font-bold text-green-400">
                  {(() => {
                    const sale = parseFloat(useWatch({ control, name: 'salePriceHt' }) || 0);
                    const cost = parseFloat(useWatch({ control, name: 'purchasePriceHt' }) || 0);
                    if (sale === 0) return '0%';
                    const marginPercent = ((sale - cost) / sale) * 100;
                    return `${marginPercent.toFixed(1)}%`;
                  })()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* SECTION 3: Information Alert for Raw Materials */}
      {isRawMaterial && (
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-800">
            <strong>Article de consommation interne</strong> - Ce produit n'est pas destiné à la vente directe. 
            Seul le prix d'achat fournisseur est nécessaire pour la valorisation des stocks et des ordres de fabrication.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
