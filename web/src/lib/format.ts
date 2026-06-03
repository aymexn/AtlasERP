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
export function formatCurrency(amount: number | string | any, locale?: string): string {
    if (amount === null || amount === undefined) {
        return locale === 'ar' ? '0,00 د.ج' : '0,00 DA';
    }

    // Handle Prisma Decimal objects which have a toString() method
    let num: number;
    if (typeof amount === 'object' && 'toString' in amount) {
        num = parseFloat(amount.toString());
    } else if (typeof amount === 'string') {
        num = parseFloat(amount);
    } else {
        num = Number(amount);
    }

    if (isNaN(num)) {
        return locale === 'ar' ? '0,00 د.ج' : '0,00 DA';
    }

    // Auto-detect locale from window if not provided
    let activeLocale = locale;
    if (!activeLocale && typeof window !== 'undefined') {
        const pathParts = window.location.pathname.split('/');
        const firstPart = pathParts[1];
        if (['ar', 'fr', 'en'].includes(firstPart)) {
            activeLocale = firstPart;
        }
    }
    if (!activeLocale) {
        activeLocale = 'fr';
    }

    // For ar-DZ standard currency formatting with Latin numbers:
    const numLocale = activeLocale === 'ar' ? 'ar-DZ' : 'fr-DZ';
    const formatted = new Intl.NumberFormat(numLocale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);

    const suffix = activeLocale === 'ar' ? '\u00a0د.ج' : '\u00a0DA';
    // Normalize spacing to non-breaking space for consistency
    return formatted.replace(/[\u202f\u00a0]/g, '\u00a0') + suffix;
}

/**
 * Formats a numeric value into a standardized price string (DA) using non-breaking spaces.
 */
export function formatPrice(
    amount: any,
    currency: string = 'DA'
): string {
    if (amount === null || amount === undefined) return '—';
    
    // Handle Prisma Decimal objects or strings
    let num: number;
    if (amount && typeof amount === 'object' && 'toString' in amount) {
        num = parseFloat(amount.toString());
    } else if (typeof amount === 'string') {
        num = parseFloat(amount);
    } else {
        num = Number(amount);
    }

    if (isNaN(num)) return '—';

    const formatted = new Intl.NumberFormat('fr-DZ', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
    
    return `${formatted.replace(/[\u202f\u00a0]/g, '\u00a0')}\u00a0${currency}`;
}

/**
 * Formats a number with Algerian standard thousand separators using non-breaking spaces.
 */
export function formatNumber(value: any): string {
    if (value === null || value === undefined) return '—';
    
    let num: number;
    if (value && typeof value === 'object' && 'toString' in value) {
        num = parseFloat(value.toString());
    } else if (typeof value === 'string') {
        num = parseFloat(value);
    } else {
        num = Number(value);
    }

    if (isNaN(num)) return '0';

    const formatted = new Intl.NumberFormat('fr-DZ', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(num);

    return formatted.replace(/[\u202f\u00a0]/g, '\u00a0');
}

/**
 * Formats stock quantities with unit suffixes and non-breaking spaces.
 */
export function formatStock(
    quantity: any,
    unit: string = ''
): string {
    if (quantity === null || quantity === undefined) return '—';
    
    let num: number;
    if (quantity && typeof quantity === 'object' && 'toString' in quantity) {
        num = parseFloat(quantity.toString());
    } else if (typeof quantity === 'string') {
        num = parseFloat(quantity);
    } else {
        num = Number(quantity);
    }

    if (isNaN(num)) return '—';

    const formatted = new Intl.NumberFormat('fr-DZ', {
        minimumFractionDigits: Number.isInteger(num) ? 0 : 1,
        maximumFractionDigits: Number.isInteger(num) ? 0 : 1,
    }).format(num);

    const normalizedNum = formatted.replace(/[\u202f\u00a0]/g, '\u00a0');
    return unit ? `${normalizedNum}\u00a0${unit}` : normalizedNum;
}

/**
 * Formats a date to relative time in French.
 */
export function formatRelativeTime(dateInput: Date | string | number): string {
    const date = new Date(dateInput);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours}h`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return date.toLocaleDateString('fr-FR');
}
