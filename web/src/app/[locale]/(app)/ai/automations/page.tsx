import { Metadata } from 'next';
import AiAutomationsClient from './ai-automations-client';

export const metadata: Metadata = {
  title: 'Automations AI | AtlasERP',
  description: 'Contrôlez et gérez vos flux de travail automatisés par l\'IA.',
};

export default function AiAutomationsPage() {
  return <AiAutomationsClient />;
}
