import type { Metadata } from 'next';
import { Suspense } from 'react';
import StackBuilderClient from './StackBuilderClient';

/*
  Bug fix — the Stack Builder was previously a single `'use client'` page with
  no exported `metadata`, so Next.js fell back to the root layout's metadata:
  the page's canonical URL in the HTML pointed at `/` instead of
  `/stack-builder`, and its share preview showed the generic site title.

  Splitting it into a server page (this file, which exports real Metadata)
  + a client component (StackBuilderClient.tsx, which keeps all the
  interactivity) fixes the canonical URL and gives the page a proper,
  page-specific Open Graph share preview — without touching the design.
*/
export const metadata: Metadata = {
  title: 'Creator Workflow Stack Builder — Plan Your AI Video Tool Stack',
  description:
    'Plan a full video-creator workflow in minutes: pick your goal and budget, assign a tool to each role in the pipeline, and share the stack as a URL. Editorial picks from the catalog — no invented scores.',
  alternates: { canonical: '/stack-builder' },
  openGraph: {
    title: 'Creator Workflow Stack Builder — CreatorAI Hub',
    description:
      'Plan a full video-creator workflow in minutes and share it as a link. Editorial picks, verification badges, and estimated entry costs.',
    type: 'website',
  },
};

export default function StackBuilderPage() {
  return (
    <Suspense>
      <StackBuilderClient />
    </Suspense>
  );
}
