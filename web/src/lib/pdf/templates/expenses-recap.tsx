import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import {
  sharedStyles, COLORS, fmtCurrency, safe,
  DocHeader, DocFooter
} from '../components/PDFLayout';

const styles = StyleSheet.create({
  ...sharedStyles,
  // ── Category block ───────────────────────────────────────────────────────────
  catBlock: {
    marginBottom: 18,
  },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.slate900,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 0,
  },
  catTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.white,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    flex: 1,
  },
  catTotalInline: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.white,
  },
  // ── Table columns ────────────────────────────────────────────────────────────
  colDate:   { width: '14%' },
  colRef:    { width: '20%' },
  colLabel:  { width: '46%' },
  colAmount: { width: '20%', textAlign: 'right' },
  // ── Grand total ──────────────────────────────────────────────────────────────
  grandBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: COLORS.slate900,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  grandLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.white,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginRight: 20,
  },
  grandValue: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.white,
  },
});

interface Props {
  expenses: any[];
  company: any;
  dateRange: string;
}

export const ExpensesRecapTemplate: React.FC<Props> = ({ expenses, company, dateRange }) => {
  const reference = `EXP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;

  // Group by category
  const grouped = expenses.reduce((acc: any, exp: any) => {
    const cat = exp.category || 'Non classé';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(exp);
    return acc;
  }, {});

  const grandTotal = expenses.reduce(
    (acc, exp) => acc + parseFloat(String(exp.amount || 0)),
    0
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <DocHeader
          docType="État des Dépenses"
          reference={reference}
          date={new Date().toLocaleDateString('fr-FR')}
          company={company}
          extra={[{ label: 'Période', value: dateRange }]}
        />

        {Object.keys(grouped).map((cat, idx) => {
          const catExpenses = grouped[cat];
          const catTotal = catExpenses.reduce(
            (acc: number, exp: any) => acc + parseFloat(String(exp.amount || 0)),
            0
          );

          return (
            <View key={idx} style={styles.catBlock} wrap={false}>
              {/* Category header — full-width Slate-900 bar with inline total */}
              <View style={styles.catHeader}>
                <Text style={styles.catTitle}>{cat}</Text>
                <Text style={styles.catTotalInline}>{fmtCurrency(catTotal)}</Text>
              </View>

              {/* Table for this category */}
              <View style={styles.table}>
                {/* Column headers — Slate-800 */}
                <View style={[styles.tableHeaderRow, { backgroundColor: COLORS.slate800 }]}>
                  <Text style={[styles.thText, styles.colDate]}>Date</Text>
                  <Text style={[styles.thText, styles.colRef]}>Référence</Text>
                  <Text style={[styles.thText, styles.colLabel]}>Libellé</Text>
                  <Text style={[styles.thText, styles.colAmount]}>Montant</Text>
                </View>

                {catExpenses.map((exp: any, i: number) => (
                  <View key={i} style={[styles.tableRow, i % 2 !== 0 ? styles.tableRowAlt : {}]}>
                    <Text style={[styles.tdText, styles.colDate]}>
                      {new Date(exp.date).toLocaleDateString('fr-FR')}
                    </Text>
                    <Text style={[styles.tdText, styles.colRef]}>{safe(exp.reference)}</Text>
                    <Text style={[styles.tdText, styles.colLabel]}>{safe(exp.title)}</Text>
                    <Text style={[styles.tdMono, styles.colAmount]}>{fmtCurrency(exp.amount)}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}

        {/* ── Grand Total ─────────────────────────────────────────────────── */}
        <View style={styles.grandBar}>
          <Text style={styles.grandLabel}>Total Général des Dépenses</Text>
          <Text style={styles.grandValue}>{fmtCurrency(grandTotal)}</Text>
        </View>

        <DocFooter company={company} />
      </Page>
    </Document>
  );
};
