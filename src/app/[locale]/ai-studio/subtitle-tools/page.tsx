import type { Metadata } from 'next';
import { SubtitleTools } from '@/components/studio/SubtitleTools';
import { StudioToolChrome } from '@/components/studio/StudioToolChrome';
export const metadata: Metadata={title:'Subtitle Tools — AI Studio',description:'Clean, convert, and validate SRT and VTT captions locally.'};
export default function Page(){return <StudioToolChrome eyebrow="Media utilities / text processing" title="Subtitle Tools" description="Clean an existing subtitle file, convert SRT and VTT, or inspect timing and line length. No transcription is claimed or sent to a server."><SubtitleTools/></StudioToolChrome>}
