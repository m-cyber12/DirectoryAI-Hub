import type { Metadata } from 'next';
import { VideoInspector } from '@/components/studio/VideoInspector';
import { StudioToolChrome } from '@/components/studio/StudioToolChrome';
export const metadata: Metadata={title:'Video Inspector — AI Studio',description:'Inspect local video metadata and extract poster frames in your browser.'};
export default function Page(){return <StudioToolChrome eyebrow="Media utilities / local metadata" title="Video Inspector" description="Read dimensions, duration, and aspect ratio; check simple platform fit; and extract a poster frame without uploading your video."><VideoInspector/></StudioToolChrome>}
