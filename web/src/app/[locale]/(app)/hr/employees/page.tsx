import { setRequestLocale } from 'next-intl/server';
import EmployeesClient from './employees-client';

export default async function EmployeesPage({
    params
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);

    return <EmployeesClient />;
}
