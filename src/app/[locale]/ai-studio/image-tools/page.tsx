import type { Metadata } from 'next';
import { ImageTools } from '@/components/studio/ImageTools';
import { StudioToolChrome } from '@/components/studio/StudioToolChrome';
export const metadata: Metadata={title:'Image Tools — AI Studio',description:'Resize, crop, convert, and inspect images locally in your browser.'};
export default function Page(){return <StudioToolChrome eyebrow="Media utilities / local canvas" title="Image Tools" description="Inspect, resize, centre-crop, convert, and export images inside your browser. Your image never enters an upload queue."><ImageTools/></StudioToolChrome>}
