import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import {
  sharedStyles, COLORS, fmtQty, safe,
  DocHeader, DocFooter, SignatureBlock
} from '../components/PDFLayout';

const styles = StyleSheet.create({
  ...sharedStyles,
  checkbox: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: COLORS.slate800,
    marginRight: 10,
    borderRadius: 2,
  },
  tableColCheck: { width: '5%', alignItems: 'center' },
  tableColName: { width: '60%' },
  tableColQty: { width: '15%', textAlign: 'center' },
  tableColUnit: { width: '10%', textAlign: 'center' },
  instructionBox: {
    padding: 10,
    backgroundColor: COLORS.slate50,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    marginTop: 15,
  },
  instructionTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', marginBottom: 5, color: COLORS.blue600 },
  instructionText: { fontSize: 8, color: COLORS.slate600 },
});

interface Props {
  mo: any;
  company: any;
}

export const ProductionOrderTemplate: React.FC<Props> = ({ mo, company }) => {
  const components = mo.billOfMaterials?.components || [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <DocHeader
          docType="Fiche de Production"
          reference={safe(mo.reference)}
          date={new Date(mo.startDate || Date.now()).toLocaleDateString('fr-FR')}
          company={company}
          extra={[
            { label: 'Priorité', value: safe(mo.priority, 'Normale') },
            { label: 'Délai', value: mo.dueDate ? new Date(mo.dueDate).toLocaleDateString('fr-FR') : '---' }
          ]}
        />

        <View style={sharedStyles.partiesRow}>
          <View style={sharedStyles.partyBox}>
            <Text style={sharedStyles.partyLabel}>Produit à Fabriquer</Text>
            <Text style={styles.partyName}>{safe(mo.product?.name)}</Text>
            <Text style={styles.partyDetail}>SKU: {safe(mo.product?.sku)}</Text>
            <Text style={styles.partyDetail}>Quantité Cible: {fmtQty(mo.quantity)} {safe(mo.product?.unit)}</Text>
          </View>
          <View style={[sharedStyles.partyBox, sharedStyles.partyBoxLast]}>
            <Text style={sharedStyles.partyLabel}>Atelier / Ligne</Text>
            <Text style={styles.partyName}>Zone de Production Principale</Text>
            <Text style={styles.partyDetail}>Opérateur: __________________</Text>
          </View>
        </View>

        <View style={{ marginBottom: 10 }}>
          <Text style={sharedStyles.partyLabel}>Liste des Ingrédients (BOM)</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.thText, styles.tableColCheck]}></Text>
            <Text style={[styles.thText, styles.tableColName]}>Composant</Text>
            <Text style={[styles.thText, styles.tableColQty]}>Qté Requise</Text>
            <Text style={[styles.thText, styles.tableColUnit]}>Unité</Text>
          </View>

          {components.map((c: any, i: number) => {
            const requiredQty = c.quantity * mo.quantity;
            return (
              <View key={i} style={[styles.tableRow, i % 2 !== 0 ? styles.tableRowAlt : {}]}>
                <View style={styles.tableColCheck}>
                  <View style={styles.checkbox} />
                </View>
                <Text style={[styles.tdText, styles.tableColName]}>{safe(c.rawMaterial?.name)}</Text>
                <Text style={[styles.tdMono, styles.tableColQty, { fontFamily: 'Helvetica-Bold' }]}>
                  {fmtQty(requiredQty)}
                </Text>
                <Text style={[styles.tdText, styles.tableColUnit]}>{safe(c.rawMaterial?.unit, 'U')}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.instructionBox}>
          <Text style={styles.instructionTitle}>INSTRUCTIONS DE TRAVAIL</Text>
          <Text style={styles.instructionText}>
            1. Vérifier la conformité des matières premières avant pesée.{"\n"}
            2. Respecter scrupuleusement les dosages indiqués.{"\n"}
            3. Noter tout écart de rendement ou incident sur le rapport de production.
          </Text>
        </View>

        <View style={{ marginTop: 30 }}>
          <SignatureBlock labels={['L\'Opérateur', 'Le Responsable Production']} />
        </View>

        <DocFooter company={company} />
      </Page>
    </Document>
  );
};
