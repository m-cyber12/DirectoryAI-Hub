'use client';

import React, { useState } from 'react';
import { Share2, Twitter, Link2, Check } from 'lucide-react';

/**
 * Audit fix 3.4 — share buttons. The site had zero sharing mechanism:
 * no Twitter button, no copy link, nothing. This adds a compact share
 * component for tool detail pages and blog posts.
 */
export function ShareButtons({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `Check out ${title} on CreatorAI Hub`
  )}&url=${encodeURIComponent(url)}`;

  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-1.5 text-2xs text-zinc-500">
        <Share2 className="h-3 w-3" aria-hidden="true" />
        Share
      </span>
      <a
        href={tweetUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Twitter/X"
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-surface-2 px-2.5 py-1.5 text-2xs font-semibold text-zinc-400 transition-colors hover:border-sky-500/40 hover:text-sky-400"
      >
        <Twitter className="h-3 w-3" aria-hidden="true" />
        Twitter
      </a>
      <button
        onClick={copyLink}
        aria-label="Copy link to clipboard"
        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-2xs font-semibold transition-colors ${
          copied
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
            : 'border-white/10 bg-surface-2 text-zinc-400 hover:border-white/20 hover:text-white'
        }`}
      >
        {copied ? (
          <>
            <Check className="h-3 w-3" aria-hidden="true" />
            Copied!
          </>
        ) : (
          <>
            <Link2 className="h-3 w-3" aria-hidden="true" />
            Copy link
          </>
        )}
      </button>
    </div>
  );
}
