import type { Metadata } from 'next';
import { ThumbnailBriefBuilder } from '@/components/studio/ThumbnailBriefBuilder';
import { StudioToolChrome } from '@/components/studio/StudioToolChrome';
export const metadata: Metadata = { title: 'Thumbnail Brief — AI Studio', description: 'Create a clear, truthful thumbnail design brief locally.' };
export default function Page(){return <StudioToolChrome eyebrow="Write / design handoff" title="Thumbnail Brief" description="Make a concise, mobile-aware brief for a designer, Canva, or an image model. This creates direction — not an image."><ThumbnailBriefBuilder/></StudioToolChrome>}
