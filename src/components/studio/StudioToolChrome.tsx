import Link from '@/i18n/navigation';
import { ArrowLeft, LockKeyhole } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { StudioAccessBanner } from './StudioAccessBanner';
import { StudioRunGate } from './StudioRunGate';
import { Header } from '@/components/Header';

const links = [
  { href: '/ai-studio/prompt-builder', label: 'Prompt Builder' },
  { href: '/ai-studio/thumbnail-brief', label: 'Thumbnail Brief' },
  { href: '/ai-studio/thumbnail-text', label: 'Thumbnail Text' },
  { href: '/ai-studio/content-calendar', label: 'Content Calendar' },
  { href: '/ai-studio/image-tools', label: 'Image Tools' },
  { href: '/ai-studio/subtitle-tools', label: 'Subtitle Tools' },
  { href: '/ai-studio/audio-trimmer', label: 'Audio Trimmer' },
  { href: '/ai-studio/video-inspector', label: 'Video Inspector' },
];

export function StudioToolChrome({ title, eyebrow, description, children }: { title: string; eyebrow: string; description: string; children: React.ReactNode }) {
  return <div className="studio-shell min-h-screen bg-[#070711] text-white"><Header /><main id="main" className="studio-tool-page"><div className="mx-auto max-w-7xl px-4 pb-8 pt-7 sm:px-6"><Link href="/ai-studio" className="studio-back-link"><ArrowLeft className="h-4 w-4" /> AI Studio</Link><div className="mt-7 flex flex-col gap-5 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-2xl"><p className="studio-eyebrow">{eyebrow}</p><h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-5xl">{title}</h1><p className="mt-3 text-base leading-7 text-zinc-400">{description}</p></div><div className="studio-local-badge"><LockKeyhole className="h-3.5 w-3.5" /> Browser-only · no API</div></div><nav className="studio-tool-nav" aria-label="Studio writing utilities">{links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav></div><div className="mx-auto max-w-7xl px-4 sm:px-6"><StudioAccessBanner /></div><StudioRunGate>{children}</StudioRunGate></main><Footer /></div>;
}
