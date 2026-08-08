import Link from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';

export function StudioLinkStatus({ href, ready }: { href?: string; ready: boolean }) {
  if (!ready || !href) return <div className="mt-5 flex items-center gap-2 text-2xs font-bold uppercase tracking-[0.16em] text-zinc-500"><span className="h-1.5 w-1.5 rounded-full bg-zinc-600" /> In build</div>;
  return <Link href={href} className="mt-5 inline-flex items-center gap-2 text-2xs font-bold uppercase tracking-[0.16em] text-cyan-200 transition-colors hover:text-white">Open utility <ArrowRight className="h-3.5 w-3.5" /></Link>;
}
