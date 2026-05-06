import DeadStockClient from './dead-stock-client';

export const metadata = {
  title: 'Analyse Stock Mort | AtlasERP',
  description: 'Identification et gestion du stock dormant et obsolète',
};

export default function DeadStockPage() {
  return <DeadStockClient />;
}
