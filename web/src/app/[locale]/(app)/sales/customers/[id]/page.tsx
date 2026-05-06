import { useLocale } from 'next-intl';
import CustomerDashboardClient from './dashboard-client';

export default async function CustomerDashboardPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <CustomerDashboardClient customerId={id} />;
}
