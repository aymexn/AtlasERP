import { 
    formatCurrency as unifiedFormatCurrency, 
    formatPrice as unifiedFormatPrice, 
    formatNumber as unifiedFormatNumber, 
    formatStock as unifiedFormatStock 
} from './format';

export function formatCurrency(
    amount: number | string | any,
    locale?: string,
    _currency?: string
): string {
    return unifiedFormatCurrency(amount, locale);
}

export function formatPrice(
    amount: number | null | undefined,
    currency: string = 'DA'
): string {
    return unifiedFormatPrice(amount, currency);
}

export function formatNumber(value: number | string | null | undefined): string {
    return unifiedFormatNumber(value);
}

export function formatStock(
    quantity: number | string | null | undefined,
    unit: string = ''
): string {
    return unifiedFormatStock(quantity, unit);
}

