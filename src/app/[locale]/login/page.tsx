import type { Metadata } from 'next';
import { LoginClient } from './LoginClient';

export const metadata: Metadata = {
  title: 'Sign In — CreatorAI Hub',
  description: 'Sign in to CreatorAI Hub to save tools, sync bookmarks, and post reviews.',
  alternates: { canonical: '/login' },
  robots: { index: false },
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  // Only same-site paths are forwarded to the client; avoid open redirects.
  const nextPath = next?.startsWith('/') && !next.startsWith('//') ? next : '/account';
  return <LoginClient nextPath={nextPath} />;
}
