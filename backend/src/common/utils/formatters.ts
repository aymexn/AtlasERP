/**
 * Formats a number or Decimal as DZD (Algerian Dinar) or other localized currency
 */
export function formatCurrency(amount: any, currency: string = 'DZD'): string {
  const value = typeof amount === 'number' ? amount : parseFloat(amount.toString());
  
  return new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
  }).format(value);
}

/**
 * Standardized Date Formatter
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR').format(date);
}
