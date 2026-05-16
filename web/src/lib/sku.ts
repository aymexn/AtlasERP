/**
 * ERP SKU Generation Utility
 * Generates standardized codes based on product type and family
 */

export function generateSmartSKU(type: string, familyName?: string): string {
  const prefixMap: Record<string, string> = {
    'FINISHED_PRODUCT': 'FP',
    'SEMI_FINISHED': 'SF',
    'RAW_MATERIAL': 'RM',
    'PACKAGING': 'PK',
    'CONSUMABLE': 'CS',
    'SERVICE': 'SV'
  };

  const prefix = prefixMap[type] || 'PRD';
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  
  // Get family prefix (first 3 letters uppercase)
  const familyPrefix = familyName 
    ? familyName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X')
    : 'GEN';

  // Random 4-digit sequence (ideally this would come from backend for true uniqueness)
  const sequence = Math.floor(1000 + Math.random() * 9000);

  return `${prefix}-${familyPrefix}-${year}${month}-${sequence}`;
}
