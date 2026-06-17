import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import {
  sharedStyles, COLORS, fmtCurrency, fmtQty, safe,
  DocHeader, DocFooter
} from '../components/PDFLayout';

const styles = StyleSheet.create({
  ...sharedStyles,
  colSKU:        { width: '15%' },
  colDesignation:{ width: '40%' },
  colType:       { width: '15%', textAlign: 'center' },
  colPrice:      { width: '18%', textAlign: 'right' },
  colStock:      { width: '12%', textAlign: 'right' },

  headerBlue: {
    backgroundColor: COLORS.blue600,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  familyHeaderRow: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginTop: 10,
  },
  familyTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.slate800,
    textTransform: 'uppercase',
  },
  zebraRow: {
    backgroundColor: '#f8fafc',
  },
  typeBadge: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    alignSelf: 'center',
  },
});

interface Props {
  products: any[];
  company: any;
  date: string;
}

export const CataloguePDFTemplate: React.FC<Props> = ({ products, company, date }) => {
  // Width assertion
  const colWidths = [15, 40, 15, 18, 12];
  const sumWidths = colWidths.reduce((a, b) => a + b, 0);
  if (Math.abs(sumWidths - 100) > 0.01) {
    throw new Error(`Catalogue PDF columns percentage sum must be exactly 100%, but got ${sumWidths}%`);
  }

  const docRef = `CAT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
  const generationTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  // Group products by family
  const groupedProducts: Record<string, any[]> = {};
  for (const p of products) {
    const familyName = p.family?.name || 'SANS FAMILLE';
    if (!groupedProducts[familyName]) {
      groupedProducts[familyName] = [];
    }
    groupedProducts[familyName].push(p);
  }

  const families = Object.keys(groupedProducts).sort();

  return (
    <Document title={`Catalogue Produits - ${date}`}>
      <Page size="A4" style={styles.page}>
        <DocHeader
          docType="Catalogue Produits"
          reference={docRef}
          date={date}
          company={company}
        />

        {/* ── Table ─────────────────────────────────────────────────────────── */}
        <View style={styles.table}>
          {/* Header row */}
          <View style={[styles.tableHeaderRow, { backgroundColor: COLORS.blue600, paddingVertical: 8 }]}>
            <Text style={[styles.thText, styles.colSKU]}>Réf / SKU</Text>
            <Text style={[styles.thText, styles.colDesignation]}>Désignation</Text>
            <Text style={[styles.thText, styles.colType]}>Type</Text>
            <Text style={[styles.thText, styles.colPrice]}>Prix de vente HT</Text>
            <Text style={[styles.thText, styles.colStock]}>Stock</Text>
          </View>

          {families.map((family, fIdx) => (
            <View key={fIdx} wrap={false}>
              {/* Family Header */}
              <View style={styles.familyHeaderRow}>
                <Text style={styles.familyTitle}>{family}</Text>
              </View>

              {groupedProducts[family].map((p, i) => {
                const price = parseFloat(String(p.salePriceHt || p.standardCost || 0));
                const qty = parseFloat(String(p.stockQuantity || 0));
                const isFinished = p.productType === 'FINISHED_PRODUCT';
                const typeLabel = isFinished ? 'Fini' : 'M.P.';
                const typeColor = isFinished ? '#dbeafe' : '#fef3c7'; // Light blue vs light amber
                const typeTextColor = isFinished ? '#1e40af' : '#92400e';

                return (
                  <View key={i} style={[styles.tableRow, i % 2 !== 0 ? styles.zebraRow : {}]}>
                    <Text style={[styles.tdText, styles.colSKU, { fontFamily: 'Helvetica-Bold' }]}>
                      {safe(p.sku)}
                    </Text>
                    <Text style={[styles.tdText, styles.colDesignation]}>
                      {safe(p.name)}
                    </Text>
                    <View style={[styles.colType, { justifyContent: 'center' }]}>
                      <Text style={[styles.typeBadge, { backgroundColor: typeColor, color: typeTextColor }]}>
                        {typeLabel}
                      </Text>
                    </View>
                    <Text style={[styles.tdMono, styles.colPrice]}>
                      {isFinished ? fmtCurrency(price) : '—'}
                    </Text>
                    <Text style={[styles.tdMono, styles.colStock]}>
                      {fmtQty(qty)} {safe(p.unit, 'U')}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
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
