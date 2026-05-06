import React from 'react';
import { Page, Text, View, Document } from '@react-pdf/renderer';
import {
  sharedStyles, COLORS, fmtCurrency, fmtQty, safe,
  DocHeader, DocFooter, SignatureBlock, numberToWords
} from '../components/PDFLayout';

interface Props { order: any; company: any; }

export const SalesOrderTemplate: React.FC<Props> = ({ order, company }) => {
  const lines  = order?.lines ?? [];
  const ht     = parseFloat(String(order?.totalAmountHt  ?? 0));
  const tva    = parseFloat(String(order?.totalAmountTva ?? 0));
  const ttc    = parseFloat(String(order?.totalAmountTtc ?? 0));

  const dateStr = order?.date
    ? new Date(order.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '---';

  const statusLabel: Record<string, string> = {
    DRAFT: 'Brouillon', VALIDATED: 'Validé', PREPARING: 'En préparation',
    SHIPPED: 'Livré', INVOICED: 'Facturé', CANCELLED: 'Annulé',
  };

  return (
    <Document>
      <Page size="A4" style={sharedStyles.page}>
        <DocHeader
          docType="Bon de Commande"
          reference={safe(order?.reference)}
          date={dateStr}
          company={company}
          extra={[{ label: 'Statut', value: statusLabel[order?.status] ?? safe(order?.status) }]}
        />

        {/* Parties */}
        <View style={sharedStyles.partiesRow}>
          <View style={sharedStyles.partyBox}>
            <Text style={sharedStyles.partyLabel}>Client</Text>
            <Text style={sharedStyles.partyName}>{safe(order?.customer?.name)}</Text>
            <Text style={sharedStyles.partyDetail}>{safe(order?.customer?.address, '')}</Text>
            {order?.customer?.taxId && (
              <Text style={sharedStyles.partyDetail}>NIF: {order.customer.taxId}</Text>
            )}
          </View>
          <View style={[sharedStyles.partyBox, sharedStyles.partyBoxLast]}>
            <Text style={sharedStyles.partyLabel}>Informations</Text>
            <Text style={sharedStyles.partyDetail}>Ref: {safe(order?.reference)}</Text>
            {order?.notes && <Text style={sharedStyles.partyDetail}>Note: {order.notes}</Text>}
          </View>
        </View>

        {/* Items Table */}
        <View style={sharedStyles.table}>
          <View style={sharedStyles.tableHeaderRow}>
            <Text style={[sharedStyles.thText, { width: '6%' }]}>#</Text>
            <Text style={[sharedStyles.thText, { flex: 1 }]}>Désignation</Text>
            <Text style={[sharedStyles.thText, { width: '8%', color: COLORS.slate400, fontSize: 7 }]}>Réf.</Text>
            <Text style={[sharedStyles.thText, { width: '14%', textAlign: 'center' }]}>Qté / Unité</Text>
            <Text style={[sharedStyles.thText, { width: '16%', textAlign: 'right' }]}>Prix U. HT</Text>
            <Text style={[sharedStyles.thText, { width: '16%', textAlign: 'right' }]}>Total HT</Text>
          </View>

          {lines.map((line: any, i: number) => (
            <View key={i} style={[sharedStyles.tableRow, i % 2 !== 0 ? sharedStyles.tableRowAlt : {}]}>
              <Text style={[sharedStyles.tdText, { width: '6%', color: COLORS.slate400 }]}>{i + 1}</Text>
              <Text style={[sharedStyles.tdText, { flex: 1 }]}>{safe(line?.product?.name)}</Text>
              <Text style={[sharedStyles.tdText, { width: '8%', color: COLORS.slate400, fontSize: 7 }]}>
                {safe(line?.product?.sku, 'SANS REF')}
              </Text>
              <Text style={[sharedStyles.tdMono, { width: '14%', textAlign: 'center' }]}>
                {fmtQty(line?.quantity)} {safe(line?.unit, 'U')}
              </Text>
              <Text style={[sharedStyles.tdMono, { width: '16%', textAlign: 'right' }]}>
                {fmtCurrency(line?.unitPriceHt)}
              </Text>
              <Text style={[sharedStyles.tdMono, { width: '16%', textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>
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
            <View style={sharedStyles.grandTotalRow}>
              <Text style={sharedStyles.grandTotalLabel}>TOTAL TTC</Text>
              <Text style={sharedStyles.grandTotalValue}>{fmtCurrency(ttc)}</Text>
            </View>
          </View>
        </View>

        {/* Amount in Words */}
        <View style={sharedStyles.amountInWords}>
          <Text style={sharedStyles.amountInWordsLabel}>Montant arrêté à :</Text>
          <Text style={sharedStyles.amountInWordsText}>{numberToWords(ttc)} Algériens</Text>
        </View>

        <SignatureBlock labels={['Le Client', 'La Direction']} />
        <DocFooter company={company} />
      </Page>
    </Document>
  );
};
