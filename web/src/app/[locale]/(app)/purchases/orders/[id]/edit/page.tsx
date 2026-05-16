import { getLocale } from 'next-intl/server';
import OrderFormClient from '../../new/order-form-client';

export default async function EditOrderPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  return <OrderFormClient id={id} />;
}
