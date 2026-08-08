import type { Metadata } from 'next';
import { ThumbnailTextGenerator } from '@/components/studio/ThumbnailTextGenerator';
import { StudioToolChrome } from '@/components/studio/StudioToolChrome';
export const metadata: Metadata = { title: 'Thumbnail Text — AI Studio', description: 'Generate concise thumbnail text options in your browser.' };
export default function Page(){return <StudioToolChrome eyebrow="Write / short-form copy" title="Thumbnail Text" description="Generate 15 concise options across useful angles. The templates keep to your word limit and do not invent outcomes or clickbait claims."><ThumbnailTextGenerator/></StudioToolChrome>}
