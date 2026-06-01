import { setRequestLocale } from 'next-intl/server';
import ProductsClient from './products-client';

export default async function ProductsPage({
    params
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);

    return <ProductsClient />;
}
