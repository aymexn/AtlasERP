import { formatCurrency as unifiedFormatCurrency } from './format';

/**
 * @deprecated Use formatCurrency from @/lib/format instead.
 */
export function formatCurrency(
    amount: number | string | any,
    _locale?: string,
    _currency?: string
): string {
    return unifiedFormatCurrency(amount);
}
