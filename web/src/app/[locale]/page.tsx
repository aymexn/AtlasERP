import { redirect } from 'next/navigation';

export default async function RootPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Standard Next.js redirect is more reliable for build stability here
  // while ensuring we stay within the correct locale path.
  redirect(`/${locale}/login`);
}
