import type { Metadata } from 'next';
import { ContentCalendarBuilder } from '@/components/studio/ContentCalendarBuilder';
import { StudioToolChrome } from '@/components/studio/StudioToolChrome';
export const metadata: Metadata = { title: 'Content Calendar — AI Studio', description: 'Build an editable creator content calendar and export it to CSV.' };
export default function Page(){return <StudioToolChrome eyebrow="Write / planning utility" title="Content Calendar" description="Build an editable 7, 14, or 30-day calendar around your niche and goals; then copy or download it as CSV. It does not claim live trend research."><ContentCalendarBuilder/></StudioToolChrome>}
