import React from 'react';
import { Page, Text, View, Document } from '@react-pdf/renderer';
import {
  sharedStyles, COLORS, fmtCurrency, fmtQty, safe,
  DocHeader, DocFooter, SignatureBlock, numberToWords
} from '../components/PDFLayout';

interface Props { order: any; company: any; }

export const PurchaseOrderTemplate: React.FC<Props> = ({ order, company }) => {
  const lines = order?.lines ?? [];
  const ht    = parseFloat(String(order?.totalHt  ?? 0));
  const tva   = parseFloat(String(order?.totalTva ?? 0));
  const ttc   = parseFloat(String(order?.totalTtc ?? 0));

  const dateStr = order?.orderDate
    ? new Date(order.orderDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '---';
  const expectedStr = order?.expectedDate
    ? new Date(order.expectedDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '---';

  const statusLabel: Record<string, string> = {
    DRAFT: 'Brouillon', CONFIRMED: 'Confirmé', SENT: 'Envoyé au fournisseur',
    PARTIALLY_RECEIVED: 'Partiellement reçu', RECEIVED: 'Reçu', CANCELLED: 'Annulé',
  };

  return (
    <Document>
      <Page size="A4" style={sharedStyles.page}>
        <DocHeader
          docType="Bon de Commande Fournisseur"
          reference={safe(order?.reference)}
          date={dateStr}
          company={company}
          extra={[
            { label: 'Livraison prévue', value: expectedStr },
            { label: 'Statut', value: statusLabel[order?.status] ?? safe(order?.status) },
          ]}
        />

        {/* Parties */}
        <View style={sharedStyles.partiesRow}>
          <View style={[sharedStyles.partyBox, { backgroundColor: COLORS.slate100 }]}>
            <Text style={sharedStyles.partyLabel}>Fournisseur</Text>
            <Text style={sharedStyles.partyName}>{safe(order?.supplier?.name)}</Text>
            <Text style={sharedStyles.partyDetail}>{safe(order?.supplier?.address ?? order?.supplier?.contact, '')}</Text>
          </View>
          <View style={[sharedStyles.partyBox, sharedStyles.partyBoxLast]}>
            <Text style={sharedStyles.partyLabel}>Acheteur</Text>
            <Text style={sharedStyles.partyName}>{safe(company?.name)}</Text>
            <Text style={sharedStyles.partyDetail}>{safe(company?.address, '')}</Text>
            <Text style={sharedStyles.partyDetail}>RC: {safe(company?.rc)} | NIF: {safe(company?.nif)}</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={sharedStyles.table}>
          <View style={sharedStyles.tableHeaderRow}>
            <Text style={[sharedStyles.thText, { width: '6%' }]}>#</Text>
            <Text style={[sharedStyles.thText, { flex: 1 }]}>Article / Désignation</Text>
            <Text style={[sharedStyles.thText, { width: '10%', color: COLORS.slate400, fontSize: 7 }]}>Réf.</Text>
            <Text style={[sharedStyles.thText, { width: '12%', textAlign: 'center' }]}>Qté</Text>
            <Text style={[sharedStyles.thText, { width: '8%', textAlign: 'center' }]}>U</Text>
            <Text style={[sharedStyles.thText, { width: '15%', textAlign: 'right' }]}>P.U HT</Text>
            <Text style={[sharedStyles.thText, { width: '15%', textAlign: 'right' }]}>Total HT</Text>
          </View>

          {lines.map((line: any, i: number) => (
            <View key={i} style={[sharedStyles.tableRow, i % 2 !== 0 ? sharedStyles.tableRowAlt : {}]}>
              <Text style={[sharedStyles.tdText, { width: '6%', color: COLORS.slate400 }]}>{i + 1}</Text>
              <Text style={[sharedStyles.tdText, { flex: 1 }]}>{safe(line?.product?.name)}</Text>
              <Text style={[sharedStyles.tdText, { width: '10%', fontSize: 7, color: COLORS.slate400 }]}>
                {safe(line?.product?.sku, 'SANS REF')}
              </Text>
              <Text style={[sharedStyles.tdMono, { width: '12%', textAlign: 'center' }]}>
                {fmtQty(line?.quantity)}
              </Text>
              <Text style={[sharedStyles.tdText, { width: '8%', textAlign: 'center', color: COLORS.slate600 }]}>
                {safe(line?.unit, 'U')}
              </Text>
              <Text style={[sharedStyles.tdMono, { width: '15%', textAlign: 'right' }]}>
                {fmtCurrency(line?.unitPriceHt)}
              </Text>
              <Text style={[sharedStyles.tdMono, { width: '15%', textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>
                {fmtCurrency(line?.totalHt)}
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

        {/* Amount in words */}
        <View style={sharedStyles.amountInWords}>
          <Text style={sharedStyles.amountInWordsLabel}>Montant arrêté à :</Text>
          <Text style={sharedStyles.amountInWordsText}>{numberToWords(ttc)} Algériens</Text>
        </View>

        {/* Notes */}
        {order?.notes && (
          <View style={{ marginBottom: 16, padding: 8, borderLeftWidth: 2, borderLeftColor: COLORS.blue600, backgroundColor: COLORS.slate50 }}>
            <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: COLORS.slate600, marginBottom: 2 }}>NOTES & CONDITIONS</Text>
            <Text style={{ fontSize: 7.5, color: COLORS.slate600 }}>{order.notes}</Text>
          </View>
        )}

        <SignatureBlock labels={['Le Fournisseur', 'Le Responsable Achats']} />
        <DocFooter company={company} />
      </Page>
    </Document>
  );
};
