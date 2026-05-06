import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import {
  sharedStyles, COLORS, fmtCurrency, safe,
  DocHeader, DocFooter, SignatureBlock
} from '../components/PDFLayout';

const styles = StyleSheet.create({
  ...sharedStyles,
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.blue600,
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.blue600,
    paddingBottom: 4,
    marginBottom: 12,
    marginTop: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridItem: {
    width: '48%',
    marginBottom: 10,
  },
  label: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.slate400,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  value: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: COLORS.slate900,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.white,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: COLORS.slate50,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    padding: 10,
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.slate900,
  },
  kpiLabel: {
    fontSize: 6,
    color: COLORS.slate400,
    textTransform: 'uppercase',
    marginTop: 2,
  },
});

interface Props {
  customer: any;
  kpis: any;
  topProducts: any[];
  company: any;
}

export const CustomerDossierTemplate: React.FC<Props> = ({ customer, kpis, topProducts, company }) => {
  const reference = `DOS-${customer.id.slice(0, 8)}`;
  
  const getSegmentColor = (s: string) => {
    if (s === 'A') return '#b45309'; // Amber 700
    if (s === 'B') return '#475569'; // Slate 600
    return '#2563eb'; // Blue 600
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <DocHeader
          docType="Fiche Dossier Client"
          reference={reference}
          date={new Date().toLocaleDateString('fr-FR')}
          company={company}
        />

        {/* Profile Section */}
        <Text style={styles.sectionTitle}>Profil Identité</Text>
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Nom / Raison Sociale</Text>
            <Text style={styles.value}>{safe(customer.name)}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Type de Client</Text>
            <Text style={styles.value}>{safe(customer.customerType || 'RETAILER')}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>NIF / Identifiant Fiscal</Text>
            <Text style={styles.value}>{safe(customer.taxId)}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Segment Intelligence</Text>
            <View style={[styles.badge, { backgroundColor: getSegmentColor(customer.segment) }]}>
              <Text>SEGMENT {customer.segment || 'C'}</Text>
            </View>
          </View>
        </View>

        {/* Contact Section */}
        <Text style={styles.sectionTitle}>Coordonnées & Contact</Text>
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{safe(customer.email)}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Téléphone</Text>
            <Text style={styles.value}>{safe(customer.phone)}</Text>
          </View>
          <View style={{ width: '100%' }}>
            <Text style={styles.label}>Adresse</Text>
            <Text style={styles.value}>{safe(customer.address)}</Text>
          </View>
        </View>

        {/* Financial KPIs */}
        <Text style={styles.sectionTitle}>Performance Financière</Text>
        <View style={styles.kpiRow}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiValue}>{fmtCurrency(kpis.totalRevenueAllTime)}</Text>
            <Text style={styles.kpiLabel}>Chiffre d'Affaires Total</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={[styles.kpiValue, { color: COLORS.red600 }]}>{fmtCurrency(kpis.outstandingBalance)}</Text>
            <Text style={styles.kpiLabel}>Encours Actuel</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiValue}>{kpis.avgPaymentDelay} Jours</Text>
            <Text style={styles.kpiLabel}>Délai Moyen Paiement</Text>
          </View>
        </View>

        {/* Top Products */}
        <Text style={styles.sectionTitle}>Top Produits Commandés</Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.thText, { width: '15%' }]}>SKU</Text>
            <Text style={[styles.thText, { width: '45%' }]}>Désignation</Text>
            <Text style={[styles.thText, { width: '15%', textAlign: 'right' }]}>Qté</Text>
            <Text style={[styles.thText, { width: '25%', textAlign: 'right' }]}>Total HT</Text>
          </View>
          {topProducts.map((p, i) => (
            <View key={i} style={[styles.tableRow, i % 2 !== 0 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.tdText, { width: '15%' }]}>{safe(p.sku)}</Text>
              <Text style={[styles.tdText, { width: '45%' }]}>{safe(p.name)}</Text>
              <Text style={[styles.tdMono, { width: '15%', textAlign: 'right' }]}>{p.qty}</Text>
              <Text style={[styles.tdMono, { width: '25%', textAlign: 'right' }]}>{fmtCurrency(p.revenue)}</Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 40 }}>
          <SignatureBlock labels={['Département Commercial', 'Direction Générale']} />
        </View>

        <DocFooter company={company} />
      </Page>
    </Document>
  );
};
