import { Metadata } from 'next';
import AiDashboardClient from './ai-dashboard-client';

export const metadata: Metadata = {
  title: 'Intelligence AI | AtlasERP',
  description: 'Assistant décisionnel et automatisation intelligente.',
};

export default function AiDashboardPage() {
  return <AiDashboardClient />;
}
