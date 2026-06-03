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
  stockQuantity: z.number().min(0).default(0),
  trackStock: z.boolean().default(true),
  description: z.string().optional().nullable(),
  
  // SYSTEM
  isActive: z.boolean().default(true),
  
  // FORMULATION
  formulaLines: z.array(z.object({
    componentId: z.string(),
    quantity: z.number().min(0.0001, "Quantité invalide"),
    unit: z.string().default('KG'),
    unitCost: z.number().min(0).optional().nullable()
  })).default([])
  
}).superRefine((data, ctx) => {
  const isFinished = data.articleType === 'FINISHED_PRODUCT';

  // Business Rule: Finished products MUST have a valid sale price
  if (isFinished) {
    if (data.salePriceHt <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Un prix de vente est obligatoire pour ce type d'article",
        path: ['salePriceHt']
      });
    }
  } else {
    // Business Rule: Non-finished products cannot have a sale price
    if (data.salePriceHt > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Seuls les produits finis peuvent avoir un prix de vente.",
        path: ['salePriceHt']
      });
    }
  }
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
