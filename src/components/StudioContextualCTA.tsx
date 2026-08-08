import Link from '@/i18n/navigation';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { ToolCategory } from '@/data/tools';

const STUDIO_DESTINATION: Partial<Record<ToolCategory, { href: string; label: string; text: string }>> = {
  'Thumbnails & Design': {
    href: '/ai-studio/thumbnail-brief',
    label: 'Build a thumbnail brief',
    text: 'Turn your video idea into a designer-ready brief in AI Studio.',
  },
  'Prompts & Templates': {
    href: '/ai-studio/prompt-builder',
    label: 'Create a prompt in AI Studio',
    text: 'Build a structured prompt locally, then use it with the tool you choose.',
  },
  'Scripting & Writing': {
    href: '/ai-studio/content-calendar',
    label: 'Build a content calendar',
    text: 'Create an editable publishing plan locally in AI Studio.',
  },
  'Transcription & Captions': {
    href: '/ai-studio/subtitle-tools',
    label: 'Clean an SRT file',
    text: 'Repair, convert, or validate existing subtitle text locally in AI Studio.',
  },
  'Voice & Audio': {
    href: '/ai-studio/audio-trimmer',
    label: 'Trim local audio',
    text: 'Preview and export an audio selection locally in AI Studio.',
  },
  'Video Generation': {
    href: '/ai-studio/prompt-builder',
    label: 'Create a video prompt',
    text: 'Build a structured video prompt locally in AI Studio.',
  },
  'Video Editing & VFX': {
    href: '/ai-studio/video-inspector',
    label: 'Inspect a local video',
    text: 'Check dimensions, duration, and platform fit locally in AI Studio.',
  },
};

/** A small, neutral handoff from a Directory detail page to a native utility. */
export function StudioContextualCTA({ category }: { category: ToolCategory }) {
  const destination = STUDIO_DESTINATION[category];
  if (!destination) return null;
  return (
    <aside className="mt-6 flex flex-col gap-4 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.045] p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="flex items-center gap-2 text-2xs font-bold uppercase tracking-[0.14em] text-cyan-200">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> AI Studio utility
        </p>
        <p className="mt-2 text-sm text-zinc-300">{destination.text}</p>
      </div>
      <Link href={destination.href} className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-cyan-200 hover:text-cyan-100">
        {destination.label} <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </aside>
  );
}
