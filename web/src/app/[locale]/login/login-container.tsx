'use client';

import dynamic from 'next/dynamic';

const LoginClient = dynamic(
    () => import('./login-client').then((mod) => mod.LoginClient),
    { ssr: false }
);

export function LoginContainer() {
    return <LoginClient />;
}
