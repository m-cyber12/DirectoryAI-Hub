import type { Metadata } from 'next';
import { PromptBuilder } from '@/components/studio/PromptBuilder';
import { StudioToolChrome } from '@/components/studio/StudioToolChrome';
export const metadata: Metadata = { title: 'Prompt Builder — AI Studio', description: 'Build structured creator prompts locally in your browser.' };
export default function Page(){return <StudioToolChrome eyebrow="Write / local generator" title="Prompt Builder" description="Turn a clear creative brief into short, standard, detailed, and negative prompts. The rule-based generator stays in your browser."><PromptBuilder/></StudioToolChrome>}
