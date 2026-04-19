import CustomersClient from './customers-client';

export const metadata = {
  title: 'Annuaire Clients | AtlasERP',
  description: 'Gérez votre base de clients et les limites de crédit.',
};

export default function CustomersPage() {
  return <CustomersClient />;
}
