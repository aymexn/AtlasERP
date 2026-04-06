import { ExpensesClient } from './expenses-client';

export const metadata = {
  title: 'Dépenses - AtlasERP',
  description: 'Gestion des dépenses et des charges de l\'entreprise',
};

export default function ExpensesPage() {
  return <ExpensesClient />;
}
