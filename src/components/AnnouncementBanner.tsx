'use client';

import { useEffect, useState } from 'react';
import { Megaphone, X } from 'lucide-react';

/**
 * AnnouncementBanner — audit fix 2.3.
 *
 * The admin panel could save an announcement (title / desc / enabled) but no
 * component ever rendered it, so the operator believed it was live while the
 * site never changed. This banner reads the allowlisted `announcement_*`
 * settings from GET /api/settings and shows a slim, dismissible bar at the
 * top of the page when it is enabled.
 *
 * It is intentionally lightweight: one GET, no cookies, purely progressive.
 */
interface Settings {
  announcement_title?: string;
  announcement_desc?: string;
  announcement_enabled?: string;
}

export function AnnouncementBanner() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/settings')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) setSettings(d);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const enabled = settings?.announcement_enabled === 'true';
  const title = settings?.announcement_title?.trim();
  if (!enabled || !title || dismissed) return null;

  return (
    <div
      role="region"
      aria-label="Announcement"
      className="relative z-[60] border-b border-accent-500/30 bg-gradient-to-r from-accent-500/15 via-fuchsia-500/10 to-cyan-400/15 px-4 py-2.5"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 pr-8 text-center">
        <Megaphone className="h-4 w-4 shrink-0 text-accent-300" aria-hidden="true" />
        <p className="text-2xs font-semibold leading-relaxed text-zinc-200">
          <span className="font-bold text-accent-200">{title}</span>
          {settings?.announcement_desc ? ` — ${settings.announcement_desc}` : ''}
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss announcement"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-400 transition-colors hover:text-white"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
