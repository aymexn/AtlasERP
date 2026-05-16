import { Metadata } from 'next';
import AnalyticsDashboardClient from './analytics-dashboard-client';

export const metadata: Metadata = {
  title: 'Centre d\'Analyse & Prédictions | AtlasERP',
  description: 'Tableau de bord décisionnel et analyses prédictives',
};

export default function AnalyticsPage() {
  return <AnalyticsDashboardClient />;
}
