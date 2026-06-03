import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId } from '@/lib/api-helpers';
import { renderToStream } from '@react-pdf/renderer';
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Helper to sanitize decimals
function sanitizeDecimals(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'object' && typeof obj.toNumber === 'function') {
    return obj.toNumber();
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeDecimals);
  }
  if (obj instanceof Date) return obj;
  if (typeof obj === 'object') {
    const clean: any = {};
    for (const key of Object.keys(obj)) {
      clean[key] = sanitizeDecimals(obj[key]);
    }
    return clean;
  }
  return obj;
}

// PDF Formatter
function formatCurrency(amount: number) {
  const formatted = new Intl.NumberFormat('fr-DZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} DA`;
}

// React-PDF component styles
const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 8, color: '#1e293b', fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 2, borderBottomColor: '#0f172a', paddingBottom: 15, marginBottom: 20 },
  companyName: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  companyDetails: { fontSize: 7, color: '#64748b', marginTop: 3 },
  titleContainer: { alignItems: 'flex-end' },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#0f172a', textTransform: 'uppercase', letterSpacing: 0.5 },
  date: { fontSize: 8, color: '#64748b', marginTop: 5 },
  
  table: { width: '100%', marginTop: 10 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 6, alignItems: 'center' },
  tableHeader: { backgroundColor: '#f8fafc', borderBottomColor: '#cbd5e1', borderBottomWidth: 2, paddingVertical: 8 },
  thText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 },
  tdText: { fontSize: 8, color: '#0f172a' },
  skuText: { fontSize: 6.5, color: '#64748b', marginTop: 2, fontFamily: 'Helvetica-Bold' },
  
  col1: { width: '35%' },
  col2: { width: '15%' },
  col3: { width: '15%', textAlign: 'center' },
  col4: { width: '15%', textAlign: 'center' },
  col5: { width: '20%', textAlign: 'right' },
  
  summaryBar: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', padding: 12, marginTop: 20, borderRadius: 6 },
  summaryLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#64748b', marginRight: 15, textTransform: 'uppercase' },
  summaryValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#0f172a' },

  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerText: { fontSize: 7, color: '#94a3b8' }
});

const InventoryPDF = ({ products, company, filter, totalStockValue, date }: any) => {
  return (
    <Document title={`Etat de stock - ${date}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{company?.name || 'ATLAS ERP'}</Text>
            {company?.address && <Text style={styles.companyDetails}>{company?.address}</Text>}
            <Text style={styles.companyDetails}>
              {company?.phone ? `Tél: ${company?.phone}` : ''} 
              {company?.email ? ` | Email: ${company?.email}` : ''}
            </Text>
            {company?.rc && (
              <Text style={styles.companyDetails}>
                RC: {company?.rc} | NIF: {company?.nif} | AI: {company?.ai}
              </Text>
            )}
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>État des stocks</Text>
            <Text style={styles.date}>Généré le {date}</Text>
            {filter !== 'all' && (
              <Text style={{ fontSize: 7, color: '#ef4444', fontFamily: 'Helvetica-Bold', marginTop: 3, textTransform: 'uppercase' }}>
                Filtre : {filter === 'low_stock' ? 'Stock faible' : 'Rupture'}
              </Text>
            )}
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.thText, styles.col1, { paddingLeft: 8 }]}>Produit</Text>
            <Text style={[styles.thText, styles.col2]}>Famille</Text>
            <Text style={[styles.thText, styles.col3]}>Stock Actuel</Text>
            <Text style={[styles.thText, styles.col4]}>Seuil Min</Text>
            <Text style={[styles.thText, styles.col5, { paddingRight: 8 }]}>Valeur Stock</Text>
          </View>

          {/* Table Body */}
          {products.map((p: any, i: number) => (
            <View key={p.id} style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc' }]} wrap={false}>
              <View style={[styles.col1, { paddingLeft: 8 }]}>
                <Text style={[styles.tdText, { fontFamily: 'Helvetica-Bold' }]}>{p.name}</Text>
                <Text style={styles.skuText}>{p.sku}</Text>
              </View>
              <Text style={[styles.tdText, styles.col2]}>{p.family?.name || '—'}</Text>
              <Text style={[styles.tdText, styles.col3, { fontFamily: 'Helvetica-Bold' }]}>
                {p.stockQuantity} {p.unit}
              </Text>
              <Text style={[styles.tdText, styles.col4]}>
                {p.reorderPoint > 0 ? `${p.reorderPoint} ${p.unit}` : '—'}
              </Text>
              <Text style={[styles.tdText, styles.col5, { paddingRight: 8, fontFamily: 'Helvetica-Bold' }]}>
                {p.costPrice > 0 ? formatCurrency(p.stockValue) : '—'}
              </Text>
            </View>
          ))}
        </View>

        {/* Summary Bar */}
        <View style={styles.summaryBar} wrap={false}>
          <Text style={styles.summaryLabel}>Total Références : {products.length}</Text>
          <Text style={styles.summaryLabel}>Valeur Totale de l'Inventaire :</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalStockValue)}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} wrap={false}>
          <Text style={styles.footerText}>{company?.name || 'ATLAS ERP'} - Logiciel de gestion intégrée</Text>
          <Text style={styles.footerText}>Atlas Intelligence ERP</Text>
        </View>
      </Page>
    </Document>
  );
};

export async function GET(req: NextRequest) {
  try {
    const companyId = await getTenantId();
    if (!companyId) {
      return NextResponse.json({ error: 'Unauthorized: No active session' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all'; // 'all', 'low_stock', 'out_of_stock'
    const familyId = searchParams.get('familyId') || undefined;

    // Fetch company info
    const company = await prisma.company.findUnique({ where: { id: companyId } });

    // Fetch products
    const products = await prisma.product.findMany({
      where: {
        companyId,
        isActive: true,
        ...(familyId && familyId !== 'all' && { familyId }),
      },
      include: {
        family: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Map and calculate
    const mapped = products.map((p: any) => {
      const qty = Number(p.stockQuantity || 0);
      const reorder = Number(p.reorderPoint || 0);
      const cost = Number(p.purchasePriceHt || p.standardCost || 0);
      const value = qty * cost;

      let status: 'OK' | 'LOW' | 'OUT' = 'OK';
      if (qty <= 0) {
        status = 'OUT';
      } else if (reorder > 0 && qty <= reorder) {
        status = 'LOW';
      }

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        family: p.family ? { id: p.family.id, name: p.family.name } : null,
        unit: p.unit || 'PCS',
        stockQuantity: qty,
        reorderPoint: reorder,
        costPrice: cost,
        stockValue: cost > 0 ? value : 0,
        status
      };
    });

    // Apply Status Filters
    let filtered = mapped;
    if (filter === 'low_stock') {
      filtered = mapped.filter(p => p.status === 'LOW');
    } else if (filter === 'out_of_stock') {
      filtered = mapped.filter(p => p.status === 'OUT');
    }

    // Calculate total stock value for items with cost > 0
    const totalStockValue = filtered.reduce((sum, p) => {
      return sum + (p.costPrice > 0 ? p.stockValue : 0);
    }, 0);

    const dateStr = new Date().toLocaleDateString('fr-DZ');

    const stream = await renderToStream(
      <InventoryPDF 
        products={filtered} 
        company={sanitizeDecimals(company)} 
        filter={filter}
        totalStockValue={totalStockValue}
        date={dateStr}
      />
    );

    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename=Inventaire.pdf`,
      },
    });

  } catch (error: any) {
    console.error('API_PDF_INVENTORY_ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
