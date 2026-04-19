/**
 * AtlasERP Unified Formatting Utility
 * This is the single source of truth for all monetary and number formatting.
 */

/**
 * Formats a numeric value into a standardized currency string (DA).
 * Example: 1500 -> "1 500,00 DA"
 * 
 * @param amount - The numeric value or string to format
 * @returns A formatted string in Algerian Dinars
 */
export function formatCurrency(amount: number | string | any): string {
    if (amount === null || amount === undefined) return '0,00 DA';

    // Handle Prisma Decimal objects which have a toString() method
    let num: number;
    if (typeof amount === 'object' && 'toString' in amount) {
        num = parseFloat(amount.toString());
    } else if (typeof amount === 'string') {
        num = parseFloat(amount);
    } else {
        num = Number(amount);
    }

    if (isNaN(num)) return '0,00 DA';

    // Standard fr-FR: narrow no-break space (U+202F) as thousands, comma for decimals
    const formatted = new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);

    // Replace narrow NBSP and regular NBSP with regular space for cross-browser consistency
    // This ensures thousands separators are always visible as spaces
    return formatted.replace(/\u202f/g, ' ').replace(/\u00a0/g, ' ') + ' DA';
}

/**
 * Formats a number with standard thousand separators.
 */
export function formatNumber(amount: number | string | any): string {
    const value = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    if (isNaN(value)) return '0';

    return new Intl.NumberFormat('fr-FR').format(value);
}
