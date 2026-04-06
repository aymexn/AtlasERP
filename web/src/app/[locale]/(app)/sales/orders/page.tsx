import { SalesOrdersClient } from './orders-client';

export const metadata = {
  title: 'Bons de Commande Client | AtlasERP',
  description: 'Gérez vos ventes, suivez les expéditions et analysez la rentabilité.',
};

export default function SalesOrdersPage() {
  return <SalesOrdersClient />;
}
