'use client';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AppProviders';
import { supabase } from '@/lib/supabase';

export type StudioToolSlug = 'prompt-builder' | 'thumbnail-brief' | 'thumbnail-text' | 'content-calendar' | 'image-tools' | 'subtitle-tools' | 'audio-trimmer' | 'video-inspector';
export type StudioAccess = { plan: 'free' | 'studio_unlimited'; remaining: number; history: StudioHistory[] };
export type StudioHistory = { id: string; tool_slug: string; created_at: string; input_summary: Record<string, unknown>; output_summary: Record<string, unknown> };

async function token() { const { data } = await supabase!.auth.getSession(); return data.session?.access_token; }
export function useStudioAccess() {
  const { user, loading } = useAuth();
  const [access, setAccess] = useState<StudioAccess | null>(null);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => { if (!user || !supabase) return; const t = await token(); const r = await fetch('/api/ai-studio/usage', { headers: { Authorization: `Bearer ${t}` } }); if (r.ok) setAccess(await r.json()); }, [user]);
  useEffect(() => { refresh(); }, [refresh]);
  const consume = useCallback(async (toolSlug: StudioToolSlug) => {
    if (!user) return { ok: false, login: true, message: 'Sign in to use AI Studio.' } as const;
    const t = await token(); const r = await fetch('/api/ai-studio/usage', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }, body: JSON.stringify({ toolSlug }) }); const body = await r.json();
    if (!r.ok) { setError(body.error ?? 'Studio access could not be checked.'); return { ok: false, upgrade: !!body.upgrade, message: body.error ?? 'Studio access could not be checked.' } as const; }
    setAccess((current) => current ? { ...current, remaining: body.remaining } : current); return { ok: true, eventId: body.eventId as string } as const;
  }, [user]);
  const save = useCallback(async (eventId: string, input: object, output: object) => { const t = await token(); if (!t) return; await fetch('/api/ai-studio/usage', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }, body: JSON.stringify({ eventId, input, output }) }); refresh(); }, [refresh]);
  return { user, loading, access, error, consume, save, refresh };
}
