import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import {
  sharedStyles, COLORS, safe,
  DocHeader, DocFooter
} from '../components/PDFLayout';

const styles = StyleSheet.create({
  ...sharedStyles,
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.slate900,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate900,
    paddingBottom: 4,
    marginBottom: 10,
    marginTop: 20,
    textTransform: 'uppercase',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.slate100,
    paddingBottom: 4,
  },
  infoLabel: { width: '30%', fontSize: 8, color: COLORS.slate400, fontFamily: 'Helvetica-Bold' },
  infoValue: { width: '70%', fontSize: 9, color: COLORS.slate900 },
});

interface Props {
  supplier: any;
  company: any;
}

export const SupplierCardTemplate: React.FC<Props> = ({ supplier, company }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <DocHeader
          docType="Fiche Partenaire Fournisseur"
          reference={safe(supplier.code, 'FOUR-' + supplier.id.slice(0,8))}
          date={new Date().toLocaleDateString('fr-FR')}
          company={company}
        />

        <View style={styles.sectionTitle}>
          <Text>Identification du Fournisseur</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Raison Sociale</Text>
          <Text style={styles.infoValue}>{safe(supplier.name)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Code Fournisseur</Text>
          <Text style={styles.infoValue}>{safe(supplier.code)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>NIF</Text>
          <Text style={styles.infoValue}>{safe(supplier.nif)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>AI</Text>
          <Text style={styles.infoValue}>{safe(supplier.ai)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>RC</Text>
          <Text style={styles.infoValue}>{safe(supplier.rc)}</Text>
        </View>

        <View style={styles.sectionTitle}>
          <Text>Contact & Localisation</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{safe(supplier.email)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Téléphone</Text>
          <Text style={styles.infoValue}>{safe(supplier.phone)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Adresse</Text>
          <Text style={styles.infoValue}>{safe(supplier.address)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ville / Pays</Text>
          <Text style={styles.infoValue}>{safe(supplier.city)} / {safe(supplier.country, 'Algérie')}</Text>
        </View>

        <View style={styles.sectionTitle}>
          <Text>Conditions Commerciales</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Délai de Paiement</Text>
          <Text style={styles.infoValue}>{safe(supplier.paymentTermsDays, '30')} Jours</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Statut</Text>
          <Text style={[styles.infoValue, { color: supplier.isActive ? '#10b981' : '#ef4444', fontFamily: 'Helvetica-Bold' }]}>
            {supplier.isActive ? 'ACTIF' : 'INACTIF'}
          </Text>
        </View>

        <DocFooter company={company} />
      </Page>
    </Document>
  );
};
