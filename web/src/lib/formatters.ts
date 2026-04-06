/**
 * Formats a numeric value into a currency string (DZD/DA).
 * 
 * @param amount - The numeric value to format
 * @param locale - The current locale (fr, ar, en)
 * @param currency - The currency code (default: DZD)
 */
export function formatCurrency(
    amount: number | string | any,
    locale: string = 'fr',
    currency: string = 'DZD'
): string {
    const value = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    
    if (isNaN(value)) return '0,00 DA';

    // Algérie specific formatting: 1 500,00 DA
    // The standard Intl.NumberFormat for DZD/dz is sometimes inconsistent across browsers/environments
    // We'll use a robust approach for DA (Dinars Algériens)

    if (locale === 'ar') {
        // Arabic: ١٬٥٠٠.٠٠ د.ج or similar
        return new Intl.NumberFormat('ar-DZ', {
            style: 'currency',
            currency: 'DZD',
            currencyDisplay: 'symbol',
        }).format(value);
    }

    if (locale === 'fr') {
        // French: 1 500,00 DA
        const formatted = new Intl.NumberFormat('fr-FR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
        return `${formatted} DA`;
    }

    // Default (EN or others): DZD 1,500.00
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'DZD',
        currencyDisplay: 'code',
    }).format(value);
}
