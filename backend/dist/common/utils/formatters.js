"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCurrency = formatCurrency;
exports.formatDate = formatDate;
function formatCurrency(amount, currency = 'DZD') {
    const value = typeof amount === 'number' ? amount : parseFloat(amount.toString());
    return new Intl.NumberFormat('fr-DZ', {
        style: 'currency',
        currency: currency,
        currencyDisplay: 'symbol',
    }).format(value);
}
function formatDate(date) {
    return new Intl.DateTimeFormat('fr-FR').format(date);
}
//# sourceMappingURL=formatters.js.map