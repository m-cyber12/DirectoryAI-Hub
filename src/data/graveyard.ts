/**
 * The AI Video Tool Graveyard.
 *
 * Audit fixes 1.5 + 7.3. The old /graveyard page had three hardcoded entries
 * and was linked from nowhere, while the live catalog still pointed users at
 * three tools whose servers no longer answer at all. Competitor directories
 * are full of dead links; being the directory that actually removes them is a
 * real, defensible differentiator — and this page attracts natural links.
 *
 * Entries here are excluded from ALL_TOOLS automatically (see tools.ts) so a
 * dead tool can never be recommended again.
 */

export interface DeadTool {
  slug: string;
  name: string;
  category: string;
  /** Approximate month the service stopped working. */
  diedAt: string;
  /** What happened, in one sentence. */
  cause: string;
  /** Longer context: acquisition, wind-down timeline, data deletion. */
  detail: string;
  /** Can users still get their data out? */
  dataMigration: string;
  /** Slugs of live tools in ALL_TOOLS that replace it. */
  replacements: string[];
  /** How we know — vendor notice, DNS failure, press coverage. */
  evidence: string;
  lastChecked: string;
}

export const GRAVEYARD: DeadTool[] = [
  {
    slug: 'play-ht',
    name: 'Play.ht (PlayAI)',
    category: 'Voice & Audio',
    diedAt: '2025-12-31',
    cause: 'Team acqui-hired by Meta; the commercial platform was shut down.',
    detail:
      'Meta acquired the PlayAI team in July 2025 and folded it into its Superintelligence Labs group. New signups stopped in August 2025, the API went offline shortly after, and the service terminated permanently on 31 December 2025. The play.ht domain no longer resolves.',
    dataMigration:
      'None. Accounts and generated audio were deleted with no export path. Re-generate any voiceovers you still need from your original scripts.',
    replacements: ['elevenlabs', 'murf-ai'],
    evidence: 'DNS for play.ht returns no address record; vendor shutdown notice.',
    lastChecked: '2026-08-03',
  },
  {
    slug: 'hour-one',
    name: 'Hour One',
    category: 'AI Avatars',
    diedAt: '2025-10-01',
    cause: 'Discontinued as a standalone product after being absorbed into Wix.',
    detail:
      'Hour One’s avatar technology was folded into Wix’s ecosystem and the standalone platform was retired. hourone.ai now serves only a notice reading “HourOne Is No Longer Available — the platform has been discontinued.”',
    dataMigration:
      'No self-serve export. Existing avatar likenesses cannot be transferred; you will need to re-record a custom avatar on a new platform.',
    replacements: ['heygen', 'synthesia'],
    evidence: 'hourone.ai serves a discontinuation notice and does not respond to requests.',
    lastChecked: '2026-08-03',
  },
  {
    slug: 'morningfame',
    name: 'Morningfame',
    category: 'SEO & Analytics',
    diedAt: '2025-01-01',
    cause: 'Quietly wound down; the domain now sits on a parking host.',
    detail:
      'The invite-only YouTube analytics tool stopped being maintained and morningfame.com no longer serves a site — the domain resolves to a registrar parking address that never completes a request.',
    dataMigration:
      'None available. Channel analytics can be rebuilt from YouTube Studio, which is free.',
    replacements: ['vidiq', 'tubebuddy'],
    evidence: 'morningfame.com resolves to a parking IP and times out on HTTP and HTTPS.',
    lastChecked: '2026-08-03',
  },
];

/** Fast lookup used by tools.ts to keep dead tools out of the live catalog. */
export const DEAD_TOOL_SLUGS = new Set(GRAVEYARD.map((t) => t.slug));
