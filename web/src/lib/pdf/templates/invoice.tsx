import React from 'react';
import { Page, Text, View, Document } from '@react-pdf/renderer';
import {
  sharedStyles, COLORS, fmtCurrency, fmtQty, safe,
  DocHeader, DocFooter, SignatureBlock, numberToWords
} from '../components/PDFLayout';

interface Props { invoice: any; company: any; }

export const InvoiceTemplate: React.FC<Props> = ({ invoice, company }) => {
  const lines = invoice?.salesOrder?.lines ?? [];
  const ht    = parseFloat(String(invoice?.totalAmountHt  ?? 0));
  const tva   = parseFloat(String(invoice?.totalAmountTva ?? 0));
  const stamp = parseFloat(String(invoice?.totalAmountStamp ?? 0));
  const ttc   = parseFloat(String(invoice?.totalAmountTtc ?? 0));

  const dateStr = invoice?.date
    ? new Date(invoice.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '---';
  const dueStr = invoice?.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : 'À réception';

  return (
    <Document>
      <Page size="A4" style={sharedStyles.page}>
        <DocHeader
          docType="Facture"
          reference={safe(invoice?.reference)}
          date={dateStr}
          company={company}
          extra={[{ label: 'Échéance', value: dueStr }]}
        />

        {/* Parties */}
        <View style={sharedStyles.partiesRow}>
          <View style={sharedStyles.partyBox}>
            <Text style={sharedStyles.partyLabel}>Client</Text>
            <Text style={sharedStyles.partyName}>{safe(invoice?.customer?.name)}</Text>
            <Text style={sharedStyles.partyDetail}>{safe(invoice?.customer?.address, '')}</Text>
            {invoice?.customer?.taxId && (
              <Text style={sharedStyles.partyDetail}>NIF: {invoice.customer.taxId}</Text>
            )}
          </View>
          <View style={[sharedStyles.partyBox, sharedStyles.partyBoxLast]}>
            <Text style={sharedStyles.partyLabel}>Paiement</Text>
            <Text style={sharedStyles.partyDetail}>Mode: {safe(invoice?.paymentMethod)}</Text>
            <Text style={sharedStyles.partyDetail}>Statut: {safe(invoice?.status)}</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={sharedStyles.table}>
          <View style={sharedStyles.tableHeaderRow}>
            <Text style={[sharedStyles.thText, { width: '8%' }]}>#</Text>
            <Text style={[sharedStyles.thText, { flex: 1 }]}>Désignation</Text>
            <Text style={[sharedStyles.thText, { width: '8%' }]}>Réf.</Text>
            <Text style={[sharedStyles.thText, { width: '12%', textAlign: 'center' }]}>Qté</Text>
            <Text style={[sharedStyles.thText, { width: '14%', textAlign: 'right' }]}>P.U HT</Text>
            <Text style={[sharedStyles.thText, { width: '14%', textAlign: 'right' }]}>Total HT</Text>
          </View>

          {lines.map((line: any, i: number) => (
            <View key={i} style={[sharedStyles.tableRow, i % 2 !== 0 ? sharedStyles.tableRowAlt : {}]}>
              <Text style={[sharedStyles.tdText, { width: '8%', color: COLORS.slate400 }]}>{i + 1}</Text>
              <Text style={[sharedStyles.tdText, { flex: 1 }]}>{safe(line?.product?.name)}</Text>
              <Text style={[sharedStyles.tdText, { width: '8%', color: COLORS.slate400, fontSize: 7 }]}>
                {safe(line?.product?.sku, 'SANS REF')}
              </Text>
              <Text style={[sharedStyles.tdMono, { width: '12%', textAlign: 'center' }]}>
                {fmtQty(line?.quantity)} {safe(line?.unit, 'U')}
              </Text>
              <Text style={[sharedStyles.tdMono, { width: '14%', textAlign: 'right' }]}>
                {fmtCurrency(line?.unitPriceHt)}
              </Text>
              <Text style={[sharedStyles.tdMono, { width: '14%', textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>
                {fmtCurrency(line?.lineTotalHt)}
              </Text>
            </View>
          ))}
        </View>

        {/* Financial Summary */}
        <View style={sharedStyles.totalsWrapper}>
          <View style={sharedStyles.totalsBox}>
            <View style={sharedStyles.totalRow}>
              <Text style={sharedStyles.totalLabel}>Total HT</Text>
              <Text style={sharedStyles.totalValue}>{fmtCurrency(ht)}</Text>
            </View>
            <View style={sharedStyles.totalRow}>
              <Text style={sharedStyles.totalLabel}>TVA (19%)</Text>
              <Text style={sharedStyles.totalValue}>{fmtCurrency(tva)}</Text>
            </View>
            {stamp > 0 && (
              <View style={sharedStyles.totalRow}>
                <Text style={sharedStyles.totalLabel}>Droit de Timbre</Text>
                <Text style={sharedStyles.totalValue}>{fmtCurrency(stamp)}</Text>
              </View>
            )}
            <View style={sharedStyles.grandTotalRow}>
              <Text style={sharedStyles.grandTotalLabel}>TOTAL TTC</Text>
              <Text style={sharedStyles.grandTotalValue}>{fmtCurrency(ttc)}</Text>
            </View>
          </View>
        </View>

        {/* Amount in Words */}
        <View style={sharedStyles.amountInWords}>
          <Text style={sharedStyles.amountInWordsLabel}>Arrêté la présente facture à la somme de :</Text>
          <Text style={sharedStyles.amountInWordsText}>{numberToWords(ttc)} Algériens</Text>
        </View>

        {/* Notes */}
        {invoice?.notes && (
          <View style={{ marginBottom: 16, padding: 8, backgroundColor: COLORS.slate50, borderLeftWidth: 2, borderLeftColor: COLORS.blue600 }}>
            <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: COLORS.slate600, marginBottom: 2 }}>OBSERVATIONS</Text>
            <Text style={{ fontSize: 7.5, color: COLORS.slate600 }}>{invoice.notes}</Text>
          </View>
        )}

        <SignatureBlock labels={['Le Client', 'La Direction']} />
        <DocFooter company={company} />
      </Page>
    </Document>
  );
};
