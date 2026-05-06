import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import {
  sharedStyles, COLORS, fmtCurrency, fmtQty, safe,
  DocHeader, DocFooter
} from '../components/PDFLayout';

const styles = StyleSheet.create({
  ...sharedStyles,
  // ── Table columns (landscape A4 = ~820pt usable width) ──────────────────────
  // Requested: Article/SKU (40%) | Famille (25%) | Quantité (15%) | Unité (10%) | Valorisation (10%)
  colArticle:    { width: '40%' },
  colFamily:     { width: '25%' },
  colQty:        { width: '15%', textAlign: 'right' },
  colUnit:       { width: '10%', textAlign: 'center' },
  colValuation:  { width: '10%', textAlign: 'right' },

  // ── Branding & Styles ───────────────────────────────────────────────────────
  headerBlue: {
    backgroundColor: COLORS.blue600,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  zebraRow: {
    backgroundColor: '#f8fafc', // Very light slate/gray
  },
  
  // ── Grand total bar ─────────────────────────────────────────────────────────
  totalBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: COLORS.blue600,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 20,
    borderRadius: 4,
  },
  totalLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.white,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginRight: 24,
  },
  totalValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.white,
  },

  // ── Article Cell ────────────────────────────────────────────────────────────
  articleBox: {
    flexDirection: 'column',
  },
  skuText: {
    fontSize: 6.5,
    color: COLORS.slate400,
    marginTop: 2,
    fontFamily: 'Helvetica-Bold',
  },
});

interface Props {
  products: any[];
  company: any;
  date: string;
}

export const InventoryReportTemplate: React.FC<Props> = ({ products, company, date }) => {
  const docRef = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
  const generationTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const totalInventoryValue = products.reduce((acc, p) => {
    const cost = parseFloat(String(p.purchasePriceHt || p.standardCost || 0));
    const qty  = parseFloat(String(p.stockQuantity || 0));
    return acc + (qty * cost);
  }, 0);

  return (
    <Document title={`État de Stock - ${date}`}>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Custom Header with AtlasERP Branding */}
        <View style={[styles.header, { borderBottomColor: COLORS.blue600 }]}>
          <View style={styles.headerLeft}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: COLORS.blue600 }}>ATLAS</Text>
              <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: COLORS.slate900 }}>ERP</Text>
            </View>
            <Text style={styles.companyName}>{safe(company?.name, 'AYMEXN COMPANY')}</Text>
            <Text style={styles.companyDetail}>{safe(company?.address)}</Text>
            <Text style={styles.companyDetail}>
              Tél: {safe(company?.phone)} | Email: {safe(company?.email)}
            </Text>
            <Text style={styles.legalLine}>
              RC: {safe(company?.rc)} | NIF: {safe(company?.nif)} | AI: {safe(company?.ai)}
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <View style={styles.headerBlue}>
              <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', color: COLORS.white, textTransform: 'uppercase', letterSpacing: 1 }}>
                État de Stock
              </Text>
            </View>
            <View style={[styles.docMeta, { marginTop: 4 }]}>
              <View style={styles.docMetaRow}>
                <Text style={styles.docMetaLabel}>Référence</Text>
                <Text style={styles.docMetaValue}>{docRef}</Text>
              </View>
              <View style={styles.docMetaRow}>
                <Text style={styles.docMetaLabel}>Date</Text>
                <Text style={styles.docMetaValue}>{date || new Date().toLocaleDateString('fr-FR')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Table ─────────────────────────────────────────────────────────── */}
        <View style={styles.table}>
          {/* Header row — Atlas Blue */}
          <View style={[styles.tableHeaderRow, { backgroundColor: COLORS.blue600, paddingVertical: 8 }]}>
            <Text style={[styles.thText, styles.colArticle]}>Article / SKU</Text>
            <Text style={[styles.thText, styles.colFamily]}>Famille</Text>
            <Text style={[styles.thText, styles.colQty]}>Quantité</Text>
            <Text style={[styles.thText, styles.colUnit]}>Unité</Text>
            <Text style={[styles.thText, styles.colValuation]}>Valorisation</Text>
          </View>

          {products.map((p, i) => {
            const cost  = parseFloat(String(p.purchasePriceHt || p.standardCost || 0));
            const qty   = parseFloat(String(p.stockQuantity || 0));
            const value = qty * cost;

            return (
              <View key={i} style={[styles.tableRow, i % 2 !== 0 ? styles.zebraRow : {}]}>
                <View style={[styles.articleBox, styles.colArticle]}>
                  <Text style={styles.tdText}>{safe(p.name)}</Text>
                  <Text style={styles.skuText}>{safe(p.sku)}</Text>
                </View>
                
                <Text style={[styles.tdText, styles.colFamily]}>{safe(p.family?.name)}</Text>
                <Text style={[styles.tdMono, styles.colQty, { fontFamily: 'Helvetica-Bold' }]}>{fmtQty(qty)}</Text>
                <Text style={[styles.tdText, styles.colUnit]}>{safe(p.unit, 'U')}</Text>
                <Text style={[styles.tdMono, styles.colValuation, { fontFamily: 'Helvetica-Bold', color: COLORS.blue600 }]}>
                  {fmtCurrency(value)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* ── Grand Total ───────────────────────────────────────────────────── */}
        <View style={styles.totalBar} wrap={false}>
          <Text style={styles.totalLabel}>Valeur Totale de l'Inventaire</Text>
          <Text style={styles.totalValue}>{fmtCurrency(totalInventoryValue)}</Text>
        </View>

        <View style={{ position: 'absolute', bottom: 40, right: 40 }}>
           <Text style={{ fontSize: 7, color: COLORS.slate400, textAlign: 'right' }}>
             Généré le {new Date().toLocaleDateString('fr-FR')} à {generationTime}
           </Text>
        </View>

        <DocFooter company={company} />
      </Page>
    </Document>
  );
};
