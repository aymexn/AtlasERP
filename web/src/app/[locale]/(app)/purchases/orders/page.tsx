import { setRequestLocale } from 'next-intl/server';
import OrdersClient from './orders-client';

export default async function PurchaseOrdersPage({
    params
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);

    return <OrdersClient />;
}
