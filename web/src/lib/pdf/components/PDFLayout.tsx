import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';

// ─── Palette ─────────────────────────────────────────────────────────────────
export const COLORS = {
  slate900: '#0f172a',
  slate800: '#1e293b',
  slate600: '#475569',
  slate400: '#94a3b8',
  slate100: '#f1f5f9',
  slate50:  '#f8fafc',
  blue600:  '#2563eb',
  white:    '#ffffff',
  red100:   '#fee2e2',
  red600:   '#dc2626',
  border:   '#e2e8f0',
};

// ─── Currency Formatter (French/Algerian style: 1 250 000,00 DA) ─────────────
// NOTE: toLocaleString('fr-DZ') produces '/' separators in Node.js – use manual formatting.
export const fmtCurrency = (val: any): string => {
  const n = parseFloat(String(val ?? 0));
  if (isNaN(n)) return '0,00 DA';
  const [intPart, decPart] = n.toFixed(2).split('.');
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0'); // non-breaking space
  return `${intFormatted},${decPart} DA`;
};

export const fmtQty = (val: any): string => {
  const n = parseFloat(String(val ?? 0));
  if (isNaN(n)) return '0,00';
  const [intPart, decPart] = n.toFixed(2).split('.');
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  return `${intFormatted},${decPart}`;
};

const safe = (val: any, fallback = '---') =>
  (val === null || val === undefined || val === '') ? fallback : String(val);

// ─── Number to French Words ───────────────────────────────────────────────────
const ONES = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
const TENS = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];

function threeDigits(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ONES[n];
  if (n < 100) {
    const t = Math.floor(n / 10), o = n % 10;
    if (t === 7 || t === 9) return TENS[t - 1] + '-' + ONES[10 + o];
    return TENS[t] + (o > 0 ? '-' + ONES[o] : '');
  }
  const h = Math.floor(n / 100), rest = n % 100;
  const hStr = h === 1 ? 'cent' : ONES[h] + ' cent';
  return hStr + (rest > 0 ? ' ' + threeDigits(rest) : '');
}

export function numberToWords(amount: number): string {
  const intPart = Math.floor(amount);
  const cents = Math.round((amount - intPart) * 100);
  if (intPart === 0) return 'zéro dinars';

  const billions = Math.floor(intPart / 1_000_000_000);
  const millions = Math.floor((intPart % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((intPart % 1_000_000) / 1_000);
  const remainder = intPart % 1_000;

  let words = '';
  if (billions) words += threeDigits(billions) + ' milliard' + (billions > 1 ? 's' : '') + ' ';
  if (millions) words += threeDigits(millions) + ' million' + (millions > 1 ? 's' : '') + ' ';
  if (thousands) words += (thousands === 1 ? 'mille' : threeDigits(thousands) + ' mille') + ' ';
  if (remainder) words += threeDigits(remainder);

  words = words.trim() + ' dinar' + (intPart > 1 ? 's' : '');
  if (cents > 0) words += ' et ' + threeDigits(cents) + ' centime' + (cents > 1 ? 's' : '');
  // Capitalize first letter
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// ─── Shared Styles ────────────────────────────────────────────────────────────
export const sharedStyles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: COLORS.slate900,
    lineHeight: 1.4,
  },

  // Header Grid
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.slate900,
  },
  headerLeft: { flex: 1, paddingRight: 20 },
  headerRight: { alignItems: 'flex-end', justifyContent: 'flex-start' },
  companyName: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.slate900,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  companyDetail: { fontSize: 7.5, color: COLORS.slate600, marginTop: 1 },
  legalLine: { fontSize: 7.5, color: COLORS.slate600, marginTop: 4 },

  docType: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.slate900,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  docMeta: {
    backgroundColor: COLORS.slate50,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    padding: 8,
    minWidth: 160,
  },
  docMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  docMetaLabel: { fontSize: 7, color: COLORS.slate600, fontFamily: 'Helvetica-Bold' },
  docMetaValue: { fontSize: 8, color: COLORS.slate900, fontFamily: 'Helvetica-Bold' },

  // Parties
  partiesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  partyBox: {
    flex: 1,
    backgroundColor: COLORS.slate50,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    padding: 10,
    marginRight: 8,
  },
  partyBoxLast: { marginRight: 0 },
  partyLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.blue600,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  partyName: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLORS.slate900, marginBottom: 3 },
  partyDetail: { fontSize: 7.5, color: COLORS.slate600, marginTop: 1 },

  // Table
  table: { marginBottom: 20 },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.slate800,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  tableRowAlt: { backgroundColor: COLORS.slate50 },
  tableRowAlert: { backgroundColor: '#fef2f2' },
  thText: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.white,
    textTransform: 'uppercase',
  },
  tdText: { fontSize: 8, color: COLORS.slate900 },
  tdMono: { fontSize: 8, color: COLORS.slate900, fontFamily: 'Helvetica' },

  // Totals
  totalsWrapper: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 },
  totalsBox: { width: '38%' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  totalLabel: { fontSize: 8, color: COLORS.slate600 },
  totalValue: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLORS.slate900 },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    paddingHorizontal: 8,
    backgroundColor: COLORS.blue600,
    marginTop: 2,
  },
  grandTotalLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.white },
  grandTotalValue: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLORS.white },

  // Amount in letters
  amountInWords: {
    borderWidth: 0.5,
    borderColor: COLORS.border,
    padding: 8,
    marginBottom: 20,
    backgroundColor: COLORS.slate50,
  },
  amountInWordsLabel: { fontSize: 7, color: COLORS.slate600, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  amountInWordsText: { fontSize: 8, color: COLORS.slate900, fontStyle: 'italic' },

  // Signatures
  signRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30, gap: 16 },
  signBox: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: COLORS.slate400,
    borderStyle: 'dashed',
    padding: 10,
    minHeight: 70,
    alignItems: 'center',
  },
  signLabel: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: COLORS.slate600, textTransform: 'uppercase', letterSpacing: 0.5 },
  signSublabel: { fontSize: 7, color: COLORS.slate400, marginTop: 2 },

  // Footer
  pageFooter: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: { fontSize: 6.5, color: COLORS.slate400 },
});

// ─── Reusable Components ──────────────────────────────────────────────────────
interface HeaderProps {
  docType: string;
  reference: string;
  date: string;
  company: any;
  extra?: { label: string; value: string }[];
}

export const DocHeader: React.FC<HeaderProps> = ({ docType, reference, date, company, extra }) => (
  <View style={sharedStyles.header}>
    <View style={sharedStyles.headerLeft}>
      <Text style={sharedStyles.companyName}>{safe(company?.name, 'SOCIÉTÉ')}</Text>
      <Text style={sharedStyles.companyDetail}>{safe(company?.address, '')}</Text>
      <Text style={sharedStyles.companyDetail}>
        Tél: {safe(company?.phone)} | Email: {safe(company?.email)}
      </Text>
      <Text style={sharedStyles.legalLine}>
        RC: {safe(company?.rc)} | NIF: {safe(company?.nif)} | AI: {safe(company?.ai)}
      </Text>
    </View>
    <View style={{ alignItems: 'flex-end', justifyContent: 'flex-start' }}>
      <View style={{ backgroundColor: COLORS.slate900, paddingHorizontal: 20, paddingVertical: 10, marginBottom: 8 }}>
        <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', color: COLORS.white, textTransform: 'uppercase', letterSpacing: 1 }}>{docType}</Text>
      </View>
      <View style={sharedStyles.docMeta}>
        <View style={sharedStyles.docMetaRow}>
          <Text style={sharedStyles.docMetaLabel}>N° Référence</Text>
          <Text style={sharedStyles.docMetaValue}>{reference}</Text>
        </View>
        <View style={sharedStyles.docMetaRow}>
          <Text style={sharedStyles.docMetaLabel}>Date</Text>
          <Text style={sharedStyles.docMetaValue}>{date}</Text>
        </View>
        {extra?.map((e, i) => (
          <View key={i} style={sharedStyles.docMetaRow}>
            <Text style={sharedStyles.docMetaLabel}>{e.label}</Text>
            <Text style={sharedStyles.docMetaValue}>{e.value}</Text>
          </View>
        ))}
      </View>
    </View>
  </View>
);

export const DocFooter: React.FC<{ company: any }> = ({ company }) => (
  <View style={sharedStyles.pageFooter} fixed>
    <View style={{ flex: 1 }}>
      <Text style={sharedStyles.footerText}>
        {safe(company?.name, 'SOCIÉTÉ')} — {safe(company?.address, '')}
      </Text>
      <Text style={[sharedStyles.footerText, { marginTop: 2, fontSize: 6, color: COLORS.slate400 }]}>
        RC: {safe(company?.rc, '-----------------')} | NIF: {safe(company?.nif, '-----------------')} | AI: {safe(company?.ai, '-----------------')} | CB: {safe(company?.rib, '-----------------')}
      </Text>
    </View>
    <View style={{ alignItems: 'flex-end' }}>
      <Text style={sharedStyles.footerText}>Document généré par AtlasERP</Text>
      <Text style={sharedStyles.footerText} render={({ pageNumber, totalPages }) =>
        `Page ${pageNumber} / ${totalPages}`
      } />
    </View>
  </View>
);

export const SignatureBlock: React.FC<{ labels: string[] }> = ({ labels }) => (
  <View style={sharedStyles.signRow}>
    {labels.map((label, i) => (
      <View key={i} style={sharedStyles.signBox}>
        <Text style={sharedStyles.signLabel}>{label}</Text>
        <Text style={sharedStyles.signSublabel}>Cachet et Signature</Text>
      </View>
    ))}
  </View>
);

// Re-export safe for use in templates
export { safe };
