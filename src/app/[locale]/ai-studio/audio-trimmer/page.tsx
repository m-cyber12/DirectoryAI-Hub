import type { Metadata } from 'next';
import { AudioTrimmer } from '@/components/studio/AudioTrimmer';
import { StudioToolChrome } from '@/components/studio/StudioToolChrome';
export const metadata: Metadata={title:'Audio Trimmer — AI Studio',description:'Preview and trim local audio files to a downloadable WAV.'};
export default function Page(){return <StudioToolChrome eyebrow="Media utilities / Web Audio" title="Audio Trimmer" description="Read a local audio file, choose an in/out range, preview the selection, and download a WAV trim. Processing stays in your browser."><AudioTrimmer/></StudioToolChrome>}
