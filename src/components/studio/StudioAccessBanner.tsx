'use client';
import Link from '@/i18n/navigation';
import { CheckCircle2, LockKeyhole } from 'lucide-react';
import { useAuth } from '@/context/AppProviders';
export function StudioAccessBanner() { const { user, loading } = useAuth(); if (loading) return null; if (!user) return <div className="studio-access-banner"><LockKeyhole className="h-4 w-4"/><span>Sign in to use every Studio utility — free during launch.</span><Link href="/login?next=/ai-studio">Sign in</Link></div>; return <div className="studio-access-banner"><CheckCircle2 className="h-4 w-4"/><span>Studio access active · all utilities are free and unlimited during launch.</span></div> }
