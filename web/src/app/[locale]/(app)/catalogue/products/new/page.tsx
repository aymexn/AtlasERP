import { setRequestLocale } from 'next-intl/server';
import { ProductForm } from '@/components/products/ProductForm';

export default async function NewProductPage({
    params
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);

    return (
        <div className="container mx-auto px-4 py-8">
            <ProductForm />
        </div>
    );
}
