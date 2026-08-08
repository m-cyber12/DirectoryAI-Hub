'use client';

import React, { useState } from 'react';
import { ALL_TOOLS, Tool, hasVerifiedScore, computeOverall } from '@/data/tools';
import { byRankDesc } from '@/lib/ranking';
import { SmartImage } from '@/components/SmartImage';
import { Sparkles, X, ArrowRight, ExternalLink, Check, Trophy, ShieldCheck } from 'lucide-react';
import Link from '@/i18n/navigation';
import { VerificationBadge } from '@/components/VerificationBadge';

interface RecommenderModalProps {
  open: boolean;
  onClose: () => void;
}

export function ToolRecommenderModal({ open, onClose }: RecommenderModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 'result'>(1);
  const [task, setTask] = useState<string>('clipping');
  const [budget, setBudget] = useState<string>('budget');
  const [priority, setPriority] = useState<string>('quality');

  if (!open) return null;

  const handleReset = () => {
    setStep(1);
    setTask('clipping');
    setBudget('budget');
    setPriority('quality');
  };

  // Recommend best tools based on choices
  const getRecommendations = (): Tool[] => {
    let matches = [...ALL_TOOLS];

    if (task === 'clipping') {
      matches = matches.filter((t) => t.slug === 'opusclip' || t.slug === 'submagic' || t.slug === 'klap' || t.slug === 'vizard' || t.slug === 'capcut');
    } else if (task === 'faceless') {
      matches = matches.filter((t) => t.slug === 'elevenlabs' || t.slug === 'autoshorts' || t.slug === 'heygen' || t.slug === 'midjourney' || t.slug === 'runway');
    } else if (task === 'dubbing') {
      matches = matches.filter((t) => t.slug === 'elevenlabs' || t.slug === 'heygen' || t.slug === 'rask-ai');
    } else if (task === 'broll') {
      matches = matches.filter((t) => t.slug === 'runway' || t.slug === 'sora' || t.slug === 'luma-dream-machine' || t.slug === 'kling-ai');
    } else if (task === 'podcast') {
      matches = matches.filter((t) => t.slug === 'descript' || t.slug === 'riverside' || t.slug === 'adobe-podcast' || t.slug === 'podcastle');
    }

    if (budget === 'free') {
      const freeMatches = matches.filter((t) => t.pricing === 'Free' || t.pricing === 'Freemium' || t.slug === 'capcut' || t.slug === 'adobe-podcast');
      if (freeMatches.length > 0) matches = freeMatches;
    }

    // Sort by priority
    return matches.sort((a, b) => {
      const aTested = hasVerifiedScore(a);
      const bTested = hasVerifiedScore(b);
      if (aTested !== bTested) return bTested ? 1 : -1;

      if (priority === 'speed' && a.scores && b.scores) {
        return b.scores.speed - a.scores.speed;
      }
      if (priority === 'ease' && a.scores && b.scores) {
        return b.scores.easeOfUse - a.scores.easeOfUse;
      }
      // default quality — honest (audit fix 2.4): verified score if we have
      // one, otherwise verification level, never fabricated rating.
      if (a.scores || b.scores) {
        const aScore = a.scores ? computeOverall(a.scores) : -1;
        const bScore = b.scores ? computeOverall(b.scores) : -1;
        const d = bScore - aScore;
        if (d !== 0) return d;
      }
      return byRankDesc(a, b);
    }).slice(0, 3);
  };

  const recommended = getRecommendations();
  const topMatch = recommended[0];
  const runnersUp = recommended.slice(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-surface-1 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-zinc-950/80 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-500/10 text-accent-400">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-white">Find Me a Tool</h3>
              <p className="text-2xs text-zinc-400">Interactive Creator Workflow Recommender</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <span className="text-2xs font-bold uppercase tracking-wider text-accent-400">Question 1 of 3</span>
                <h4 className="mt-1 text-xl font-extrabold text-white">What task are you trying to accomplish?</h4>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { id: 'clipping', title: '✂️ Viral Shorts from Long-Form', desc: 'OpusClip, Submagic, Klap' },
                  { id: 'faceless', title: '🎬 Faceless YouTube Automation', desc: 'ElevenLabs, AutoShorts, HeyGen' },
                  { id: 'dubbing', title: '🌍 Multilingual Voice Dubbing', desc: 'Voice translation across 29+ languages' },
                  { id: 'broll', title: '🎥 Cinematic B-Roll Generation', desc: 'Runway, Sora, Luma Dream Machine' },
                  { id: 'podcast', title: '🎙️ Studio Podcast Editing', desc: 'Descript, Riverside, clean audio' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setTask(item.id);
                      setStep(2);
                    }}
                    className={`flex flex-col items-start rounded-2xl border p-4 text-left transition-all ${
                      task === item.id
                        ? 'border-accent-500 bg-accent-500/15 text-white font-extrabold'
                        : 'border-white/10 bg-zinc-950 text-zinc-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <span className="text-sm font-bold">{item.title}</span>
                    <span className="mt-1 text-2xs opacity-70">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <span className="text-2xs font-bold uppercase tracking-wider text-accent-400">Question 2 of 3</span>
                <h4 className="mt-1 text-xl font-extrabold text-white">What is your monthly tool budget?</h4>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { id: 'free', title: '$0 / Free Tiers', desc: 'No credit card needed' },
                  { id: 'budget', title: 'Under $25 / mo', desc: 'Starter creator plans' },
                  { id: 'pro', title: 'Pro Studio ($25+)', desc: 'Unlimited exports & 4K' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setBudget(item.id);
                      setStep(3);
                    }}
                    className={`flex flex-col items-center justify-center rounded-2xl border p-5 text-center transition-all ${
                      budget === item.id
                        ? 'border-accent-500 bg-accent-500/15 text-white font-extrabold'
                        : 'border-white/10 bg-zinc-950 text-zinc-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <span className="text-sm font-bold">{item.title}</span>
                    <span className="mt-1 text-2xs opacity-70">{item.desc}</span>
                  </button>
                ))}
              </div>

              <button onClick={() => setStep(1)} className="text-xs text-zinc-500 hover:text-white underline">
                &larr; Back
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <span className="text-2xs font-bold uppercase tracking-wider text-accent-400">Question 3 of 3</span>
                <h4 className="mt-1 text-xl font-extrabold text-white">What matters most in your workflow?</h4>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { id: 'quality', title: '🏆 Highest Output Quality', desc: 'Top benchmark scores' },
                  { id: 'speed', title: '⚡ Fastest Processing', desc: 'Shortest wall-clock time' },
                  { id: 'ease', title: '✨ Easiest to Use', desc: 'Beginner-friendly UI' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setPriority(item.id);
                      setStep('result');
                    }}
                    className={`flex flex-col items-center justify-center rounded-2xl border p-5 text-center transition-all ${
                      priority === item.id
                        ? 'border-accent-500 bg-accent-500/15 text-white font-extrabold'
                        : 'border-white/10 bg-zinc-950 text-zinc-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <span className="text-sm font-bold">{item.title}</span>
                    <span className="mt-1 text-2xs opacity-70">{item.desc}</span>
                  </button>
                ))}
              </div>

              <button onClick={() => setStep(2)} className="text-xs text-zinc-500 hover:text-white underline">
                &larr; Back
              </button>
            </div>
          )}

          {step === 'result' && topMatch && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-300">
                    <Trophy className="h-3.5 w-3.5" /> Best Verified Match
                  </span>
                  <button onClick={handleReset} className="text-xs text-zinc-400 hover:text-white underline">
                    Start over
                  </button>
                </div>

                <div className="mt-4 rounded-3xl border border-accent-500/40 bg-gradient-to-br from-accent-500/15 via-zinc-900 to-zinc-950 p-6">
                  <div className="flex items-start gap-4">
                    <SmartImage
                      src={topMatch.logo}
                      alt=""
                      width={56}
                      height={56}
                      className="h-14 w-14 rounded-2xl border border-white/10 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/tool/${topMatch.slug}`}
                          onClick={onClose}
                          className="text-xl font-black text-white hover:text-accent-300"
                        >
                          {topMatch.name}
                        </Link>
                        <span className="text-sm font-mono font-bold text-emerald-400">
                          {topMatch.startingPrice || 'Free'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-300">{topMatch.tagline}</p>

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        {hasVerifiedScore(topMatch) ? (
                          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
                            ★ {computeOverall(topMatch.scores!)} / 10 Tested
                          </span>
                        ) : (
                          <VerificationBadge level={topMatch.verificationLevel} compact />
                        )}

                        <Link
                          href={`/tool/${topMatch.slug}`}
                          onClick={onClose}
                          className="text-xs font-bold text-accent-400 hover:underline"
                        >
                          Read Verified Review &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {runnersUp.length > 0 && (
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                    Also Consider (Runners-Up):
                  </h5>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {runnersUp.map((alt) => (
                      <div
                        key={alt.slug}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-zinc-900/60 p-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <SmartImage
                            src={alt.logo}
                            alt=""
                            width={32}
                            height={32}
                            className="h-8 w-8 rounded-lg object-cover"
                          />
                          <div className="min-w-0">
                            <Link
                              href={`/tool/${alt.slug}`}
                              onClick={onClose}
                              className="text-xs font-bold text-white hover:text-accent-300 truncate block"
                            >
                              {alt.name}
                            </Link>
                            <span className="text-2xs font-mono text-emerald-400">
                              {alt.startingPrice || 'Free'}
                            </span>
                          </div>
                        </div>

                        <Link
                          href={`/tool/${alt.slug}`}
                          onClick={onClose}
                          className="text-2xs font-bold text-accent-400 hover:underline"
                        >
                          View &rarr;
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between border-t border-white/10">
                <Link
                  href={`/compare?tools=${recommended.map((r) => r.slug).join(',')}`}
                  onClick={onClose}
                  className="text-xs font-bold text-accent-400 hover:underline"
                >
                  Compare All {recommended.length} Side-by-Side &rarr;
                </Link>

                <button
                  onClick={onClose}
                  className="rounded-xl bg-accent-500 px-6 py-2.5 text-xs font-bold text-black hover:bg-accent-400"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
