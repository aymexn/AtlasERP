'use client';

import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

export default function ShortcutProvider({ children }: { children: React.ReactNode }) {
    useKeyboardShortcuts();
    return <>{children}</>;
}
