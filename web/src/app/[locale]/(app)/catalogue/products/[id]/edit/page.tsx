import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getTenantId } from '@/lib/api-helpers';
import { setRequestLocale } from 'next-intl/server';
import { ProductForm } from '@/components/products/ProductForm';

export default async function EditProductPage({
    params
}: {
    params: Promise<{ id: string; locale: string }>;
}) {
    const { id, locale } = await params;
    setRequestLocale(locale);

    const companyId = await getTenantId();
    if (!companyId) {
        notFound();
    }

    const product = await prisma.product.findUnique({
        where: { id, companyId },
        include: {
            family: true,
            bomsAsFinishedProduct: {
                where: { isActive: true },
                include: {
                    components: {
                        include: {
                            component: true
                        }
                    }
                }
            }
        }
    });

    if (!product) {
        notFound();
    }

    // Convert decimal numbers to numbers for client-side frontend compatibility
    const serializedProduct = JSON.parse(JSON.stringify(product));

    return (
        <div className="container mx-auto px-4 py-8">
            <ProductForm initialProduct={serializedProduct} />
        </div>
    );
}
