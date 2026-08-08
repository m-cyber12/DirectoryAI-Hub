import type { Metadata } from 'next';
import Link from '@/i18n/navigation';
import {
  ArrowRight,
  AudioLines,
  CalendarDays,
  CheckCircle2,
  FileText,
  ImageIcon,
  Keyboard,
  Languages,
  LockKeyhole,
  Scissors,
  Sparkles,
  Video,
} from 'lucide-react';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { StudioOrbitalScene } from '@/components/studio/StudioOrbitalScene';
import { StudioLinkStatus } from '@/components/studio/StudioLinkStatus';
import { StudioMotion } from '@/components/studio/StudioMotion';

export const metadata: Metadata = {
  title: 'AI Studio — CreatorAI Hub',
  description: 'A separate, privacy-first workspace for practical creator utilities built into CreatorAI Hub.',
  alternates: { canonical: '/ai-studio' },
};

const WRITE_UTILITIES = [
  { icon: Sparkles, title: 'Prompt Builder', text: 'Structure a prompt for an image, video, script, avatar, or B-roll.', accent: 'violet', href: '/ai-studio/prompt-builder', ready: true },
  { icon: ImageIcon, title: 'Thumbnail Brief', text: 'Turn a video idea into a clear brief for a designer or image model.', accent: 'pink', href: '/ai-studio/thumbnail-brief', ready: true },
  { icon: Keyboard, title: 'Thumbnail Text', text: 'Generate concise, readable thumbnail-copy options without misleading claims.', accent: 'amber', href: '/ai-studio/thumbnail-text', ready: true },
  { icon: CalendarDays, title: 'Content Calendar', text: 'Build an editable publishing plan around your niche and content pillars.', accent: 'cyan', href: '/ai-studio/content-calendar', ready: true },
];

const MEDIA_UTILITIES = [
  { icon: ImageIcon, title: 'Image Tools', text: 'Resize, crop, convert, compress, and inspect images locally.', accent: 'cyan', href: '/ai-studio/image-tools', ready: true },
  { icon: Languages, title: 'Subtitle Tools', text: 'Clean SRT files, validate timing, and convert between SRT and VTT.', accent: 'violet', href: '/ai-studio/subtitle-tools', ready: true },
  { icon: AudioLines, title: 'Audio Trimmer', text: 'Trim a local audio clip with a simple waveform and browser preview.', accent: 'pink', href: '/ai-studio/audio-trimmer', ready: true },
  { icon: Video, title: 'Video Inspector', text: 'Read local video metadata and check target-platform fit before publishing.', accent: 'amber', href: '/ai-studio/video-inspector', ready: true },
];

function UtilityCard({ item }: { item: (typeof WRITE_UTILITIES)[number] | (typeof MEDIA_UTILITIES)[number] }) {
  const Icon = item.icon;
  return (
    <article className="studio-utility-card group" data-accent={item.accent} data-studio-reveal>
      <div className="studio-utility-icon"><Icon className="h-5 w-5" aria-hidden="true" /></div>
      <div className="min-w-0">
        <h3 className="text-base font-bold text-white">{item.title}</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-400">{item.text}</p>
      </div>
      <StudioLinkStatus href={'href' in item ? item.href : undefined} ready={item.ready} />
    </article>
  );
}

export default function AIStudioPage() {
  return (
    <div className="studio-shell min-h-screen overflow-hidden bg-[#070711] text-white">
      <Header />
      <main id="main">
        <StudioMotion />
        <section className="studio-hero relative isolate overflow-hidden">
          <div className="studio-hero-noise" aria-hidden="true" />
          <div className="studio-hero-aurora" aria-hidden="true" />
          <div className="mx-auto grid min-h-[640px] max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.03fr_0.97fr] lg:py-24">
            <div className="relative z-10 max-w-2xl" data-studio-reveal>
              <div className="studio-kicker"><span className="studio-live-dot" /> CreatorAI Hub / Native workspace · free launch access</div>
              <h1 className="mt-6 text-5xl font-black leading-[0.94] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
                Make the next
                <span className="studio-gradient-text block">move yourself.</span>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-zinc-300 sm:text-xl">
                AI Studio is a separate workspace for practical creator utilities — briefs, prompts, calendars, and local media tasks. No tool rankings. No hidden uploads.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#workspace" className="studio-primary-button">
                  Explore the workspace <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
                <Link href="/tools" className="studio-secondary-button">
                  Browse the Directory
                </Link>
              </div>
              <div className="mt-9 flex flex-wrap gap-x-5 gap-y-3 text-2xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
                <span className="inline-flex items-center gap-2"><LockKeyhole className="h-3.5 w-3.5 text-cyan-300" /> Privacy-first by design</span>
                <span className="inline-flex items-center gap-2"><Scissors className="h-3.5 w-3.5 text-fuchsia-300" /> Practical, single-purpose utilities</span>
              </div>
            </div>
            <StudioOrbitalScene />
          </div>
        </section>

        <section id="workspace" className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="studio-section-line" aria-hidden="true" />
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="studio-eyebrow">Studio workspace / phase 01</p>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-5xl">Made for doing, not deciding.</h2>
              <p className="mt-4 text-base leading-7 text-zinc-400">The Directory helps you evaluate external tools. AI Studio will help you produce ready-to-use outputs directly in your browser.</p>
            </div>
            <div className="studio-foundation-badge"><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Product foundation active</div>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            <section>
              <div className="mb-5 flex items-center gap-3"><FileText className="h-5 w-5 text-fuchsia-300" aria-hidden="true" /><h3 className="text-lg font-bold">Write</h3></div>
              <div className="grid gap-4 sm:grid-cols-2">{WRITE_UTILITIES.map((item) => <UtilityCard key={item.title} item={item} />)}</div>
            </section>
            <section>
              <div className="mb-5 flex items-center gap-3"><Scissors className="h-5 w-5 text-cyan-300" aria-hidden="true" /><h3 className="text-lg font-bold">Media utilities</h3></div>
              <div className="grid gap-4 sm:grid-cols-2">{MEDIA_UTILITIES.map((item) => <UtilityCard key={item.title} item={item} />)}</div>
            </section>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
          <div className="studio-principles-grid">
            <div><span className="studio-principle-number">01</span><h2>Separate by purpose.</h2><p>Directory is for discovering and comparing external products. Studio is for making useful outputs.</p></div>
            <div><span className="studio-principle-number">02</span><h2>Local where it matters.</h2><p>File-based utilities are designed to process in the browser. Your media is not a Studio upload queue.</p></div>
            <div><span className="studio-principle-number">03</span><h2>Honest scope.</h2><p>Each utility will say exactly what it does. No implied live research, model access, or background processing.</p></div>
          </div>
          <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:flex sm:items-center sm:justify-between sm:gap-8">
            <div><p className="text-lg font-bold">Need to choose an external AI tool first?</p><p className="mt-1 text-sm text-zinc-400">That belongs in the Directory — with sources, pricing status, and comparisons kept separate from this workspace.</p></div>
            <Link href="/tools" className="mt-5 inline-flex shrink-0 items-center gap-2 text-sm font-bold text-amber-300 hover:text-amber-200 sm:mt-0">Explore the Directory <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
