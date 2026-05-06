import { z } from 'zod';

export const productFormSchema = z.object({
  // GENERAL TAB
  name: z.string().min(1, "Désignation requise"),
  secondaryName: z.string().optional().nullable(),
  sku: z.string().min(1, "Référence (SKU) requise"),
  familyId: z.string().optional().nullable(),
  articleType: z.enum([
    'FINISHED_PRODUCT',
    'SEMI_FINISHED',
    'RAW_MATERIAL',
    'PACKAGING',
    'CONSUMABLE',
    'SERVICE'
  ]),
  
  // TARIFICATION TAB
  salePriceHt: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(1).default(0.19),
  purchasePriceHt: z.number().min(0).default(0),
  standardCost: z.number().min(0).default(0),
  
  // INVENTAIRE TAB
  unit: z.string().default('PCS'),
  minStock: z.number().min(0).default(5),
  trackStock: z.boolean().default(true),
  description: z.string().optional().nullable(),
  
  // SYSTEM
  isActive: z.boolean().default(true),
  
  // FORMULATION
  formulaLines: z.array(z.object({
    componentId: z.string(),
    quantity: z.number().min(0.0001, "Quantité invalide"),
    unit: z.string().default('KG')
  })).default([])
  
}).superRefine((data, ctx) => {
  const isSold = ['FINISHED_PRODUCT', 'SEMI_FINISHED', 'SERVICE'].includes(data.articleType);

  // Business Rule: Sold products MUST have a valid sale price
  if (isSold) {
    if (data.salePriceHt <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Un prix de vente est obligatoire pour ce type d'article",
        path: ['salePriceHt']
      });
    }
  }
  
  // Note: For RAW_MATERIAL, PACKAGING, and CONSUMABLE, we no longer enforce 0 price/tax
  // as per user request to loosen validation and avoid blocking manual creation.
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
