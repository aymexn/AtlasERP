import React from 'react';
import { Page, Text, View, Document } from '@react-pdf/renderer';
import {
  sharedStyles, COLORS, fmtCurrency, fmtQty, safe,
  DocHeader, DocFooter, SignatureBlock
} from '../components/PDFLayout';

interface Props { order: any; company: any; }

export const DeliveryNoteTemplate: React.FC<Props> = ({ order, company }) => {
  const lines = order?.lines ?? [];

  const dateStr = order?.updatedAt
    ? new Date(order.updatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const totalQty = lines.reduce((sum: number, l: any) =>
    sum + parseFloat(String(l?.quantity ?? 0)), 0
  );

  return (
    <Document>
      <Page size="A4" style={sharedStyles.page}>
        <DocHeader
          docType="Bon de Livraison"
          reference={`BL-${safe(order?.reference)}`}
          date={dateStr}
          company={company}
          extra={[{ label: 'BC Réf.', value: safe(order?.reference) }]}
        />

        {/* Parties — NO prices on a delivery note */}
        <View style={sharedStyles.partiesRow}>
          <View style={sharedStyles.partyBox}>
            <Text style={sharedStyles.partyLabel}>Destinataire</Text>
            <Text style={sharedStyles.partyName}>{safe(order?.customer?.name)}</Text>
            <Text style={sharedStyles.partyDetail}>{safe(order?.customer?.address, '')}</Text>
            <Text style={sharedStyles.partyDetail}>{safe(order?.customer?.city ?? order?.customer?.contact, '')}</Text>
          </View>
          <View style={[sharedStyles.partyBox, sharedStyles.partyBoxLast]}>
            <Text style={sharedStyles.partyLabel}>Transport</Text>
            <Text style={sharedStyles.partyDetail}>Mode: Livraison directe</Text>
            <Text style={sharedStyles.partyDetail}>Date livraison: {dateStr}</Text>
            <Text style={sharedStyles.partyDetail}>
              Nb articles: {lines.length} ligne{lines.length > 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Items Table — NO price columns on BL */}
        <View style={sharedStyles.table}>
          <View style={sharedStyles.tableHeaderRow}>
            <Text style={[sharedStyles.thText, { width: '6%' }]}>#</Text>
            <Text style={[sharedStyles.thText, { flex: 1 }]}>Désignation de l'Article</Text>
            <Text style={[sharedStyles.thText, { width: '12%', color: COLORS.slate400, fontSize: 7 }]}>Référence</Text>
            <Text style={[sharedStyles.thText, { width: '18%', textAlign: 'center' }]}>Quantité Commandée</Text>
            <Text style={[sharedStyles.thText, { width: '18%', textAlign: 'center' }]}>Quantité Livrée</Text>
            <Text style={[sharedStyles.thText, { width: '10%', textAlign: 'center' }]}>Unité</Text>
          </View>

          {lines.map((line: any, i: number) => {
            const orderedQty = parseFloat(String(line?.quantity ?? 0));
            const shippedQty = parseFloat(String(line?.shippedQuantity ?? line?.quantity ?? 0));
            const isPartial = shippedQty < orderedQty;

            return (
              <View key={i} style={[
                sharedStyles.tableRow,
                i % 2 !== 0 ? sharedStyles.tableRowAlt : {},
                isPartial ? { backgroundColor: '#fffbeb' } : {}
              ]}>
                <Text style={[sharedStyles.tdText, { width: '6%', color: COLORS.slate400 }]}>{i + 1}</Text>
                <Text style={[sharedStyles.tdText, { flex: 1, fontFamily: 'Helvetica-Bold' }]}>
                  {safe(line?.product?.name)}
                </Text>
                <Text style={[sharedStyles.tdText, { width: '12%', fontSize: 7, color: COLORS.slate400 }]}>
                  {safe(line?.product?.sku, 'SANS REF')}
                </Text>
                <Text style={[sharedStyles.tdMono, { width: '18%', textAlign: 'center' }]}>
                  {fmtQty(orderedQty)}
                </Text>
                <Text style={[sharedStyles.tdMono, { width: '18%', textAlign: 'center', fontFamily: 'Helvetica-Bold', color: isPartial ? '#b45309' : COLORS.slate900 }]}>
                  {fmtQty(shippedQty)}
                </Text>
                <Text style={[sharedStyles.tdText, { width: '10%', textAlign: 'center', color: COLORS.slate600 }]}>
                  {safe(line?.unit, 'U')}
                </Text>
              </View>
            );
          })}

          {/* Totals row */}
          <View style={{ flexDirection: 'row', backgroundColor: COLORS.slate100, paddingVertical: 6, paddingHorizontal: 4, marginTop: 1 }}>
            <Text style={[sharedStyles.tdText, { flex: 1, fontFamily: 'Helvetica-Bold' }]}>
              TOTAL — {lines.length} article{lines.length > 1 ? 's' : ''}
            </Text>
            <Text style={[sharedStyles.tdMono, { width: '18%', textAlign: 'center', fontFamily: 'Helvetica-Bold' }]}>
              {fmtQty(totalQty)} colis
            </Text>
          </View>
        </View>

        {/* Observation box */}
        {order?.notes && (
          <View style={{ marginBottom: 16, padding: 8, borderLeftWidth: 2, borderLeftColor: COLORS.slate400, backgroundColor: COLORS.slate50 }}>
            <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: COLORS.slate600, marginBottom: 2 }}>OBSERVATIONS / RÉSERVES</Text>
            <Text style={{ fontSize: 7.5, color: COLORS.slate600 }}>{order.notes}</Text>
          </View>
        )}

        {/* Conformity note */}
        <View style={{ padding: 8, borderWidth: 0.5, borderColor: COLORS.border, marginBottom: 16, backgroundColor: COLORS.slate50 }}>
          <Text style={{ fontSize: 7.5, color: COLORS.slate600, textAlign: 'center', fontStyle: 'italic' }}>
            La signature du présent bon de livraison vaut acceptation de la marchandise sans réserve.
          </Text>
        </View>

        <SignatureBlock labels={['Le Réceptionnaire', 'Le Livreur']} />
        <DocFooter company={company} />
      </Page>
    </Document>
  );
};
