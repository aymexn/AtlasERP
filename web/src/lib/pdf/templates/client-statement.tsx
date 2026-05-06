import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import {
  sharedStyles, COLORS, fmtCurrency, safe,
  DocHeader, DocFooter
} from '../components/PDFLayout';

const styles = StyleSheet.create({
  ...sharedStyles,
  balanceCard: {
    backgroundColor: COLORS.slate50,
    borderWidth: 1,
    borderColor: COLORS.red600,
    padding: 15,
    marginBottom: 20,
    alignItems: 'flex-end',
  },
  balanceLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLORS.slate600, textTransform: 'uppercase' },
  balanceValue: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: COLORS.red600, marginTop: 5 },
  tableColDate: { width: '12%' },
  tableColType: { width: '15%' },
  tableColRef: { width: '18%' },
  tableColDebit: { width: '18%', textAlign: 'right' },
  tableColCredit: { width: '18%', textAlign: 'right' },
  tableColBalance: { width: '19%', textAlign: 'right' },
});

interface Props {
  customer: any;
  transactions: any[];
  currentBalance: number;
  company: any;
  dateRange: string;
}

export const ClientStatementTemplate: React.FC<Props> = ({ customer, transactions, currentBalance, company, dateRange }) => {
  const reference = `STMT-${customer.id.slice(0, 8)}`;
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <DocHeader
          docType="Relevé de Compte Client"
          reference={reference}
          date={new Date().toLocaleDateString('fr-FR')}
          company={company}
          extra={[{ label: 'Période', value: dateRange }]}
        />

        <View style={sharedStyles.partiesRow}>
          <View style={sharedStyles.partyBox}>
            <Text style={sharedStyles.partyLabel}>Client</Text>
            <Text style={sharedStyles.partyName}>{safe(customer.name)}</Text>
            <Text style={sharedStyles.partyDetail}>{safe(customer.address)}</Text>
            <Text style={sharedStyles.partyDetail}>Tél: {safe(customer.phone)}</Text>
          </View>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Reste à Payer</Text>
            <Text style={styles.balanceValue}>{fmtCurrency(currentBalance)}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.thText, styles.tableColDate]}>Date</Text>
            <Text style={[styles.thText, styles.tableColType]}>Type</Text>
            <Text style={[styles.thText, styles.tableColRef]}>Référence</Text>
            <Text style={[styles.thText, styles.tableColDebit]}>Débit (+)</Text>
            <Text style={[styles.thText, styles.tableColCredit]}>Crédit (-)</Text>
            <Text style={[styles.thText, styles.tableColBalance]}>Solde</Text>
          </View>

          {transactions.map((t, i) => (
            <View key={i} style={[styles.tableRow, i % 2 !== 0 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.tdText, styles.tableColDate]}>{new Date(t.date).toLocaleDateString('fr-FR')}</Text>
              <Text style={[styles.tdText, styles.tableColType]}>{safe(t.type)}</Text>
              <Text style={[styles.tdText, styles.tableColRef]}>{safe(t.reference)}</Text>
              <Text style={[styles.tdMono, styles.tableColDebit]}>{t.debit > 0 ? fmtCurrency(t.debit) : '---'}</Text>
              <Text style={[styles.tdMono, styles.tableColCredit]}>{t.credit > 0 ? fmtCurrency(t.credit) : '---'}</Text>
              <Text style={[styles.tdMono, styles.tableColBalance, { fontFamily: 'Helvetica-Bold' }]}>{fmtCurrency(t.balance)}</Text>
            </View>
          ))}
        </View>

        <DocFooter company={company} />
      </Page>
    </Document>
  );
};
