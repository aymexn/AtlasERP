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

    const suffix = activeLocale === 'ar' ? ' د.ج' : ' DA';
    // Normalize spacing to standard space for consistency
    return formatted.replace(/[\u202f\u00a0]/g, ' ') + suffix;
}

/**
 * Formats a number with standard thousand separators.
 */
export function formatNumber(amount: number | string | any): string {
    const value = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    if (isNaN(value)) return '0';

    return new Intl.NumberFormat('fr-FR').format(value);
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
