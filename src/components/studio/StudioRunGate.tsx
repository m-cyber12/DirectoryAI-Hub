'use client';

import type { MouseEvent, ReactNode } from 'react';
import { useState } from 'react';
import Link from '@/i18n/navigation';
import { LockKeyhole } from 'lucide-react';
import { useAuth } from '@/context/AppProviders';

/** Login-only gate for the free launch: no quota, payment, or usage limit. */
export function StudioRunGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [notice, setNotice] = useState(false);
  const next = typeof window === 'undefined' ? '/ai-studio' : window.location.pathname;
  const onClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('.studio-generate');
    if (!button || button.disabled || user) return;
    event.preventDefault();
    event.stopPropagation();
    setNotice(true);
  };
  return <div onClickCapture={onClickCapture}>{children}{!loading && notice && <div className="studio-access-error"><LockKeyhole className="h-4 w-4"/>Sign in is required before using this Studio utility.<Link href={`/login?next=${encodeURIComponent(next)}`}>Sign in</Link></div>}</div>;
}
