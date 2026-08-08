import { describe, it, expect } from 'vitest';
import { parseFeed } from '@/lib/rss';

const FEED = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>T</title>
<item>
  <title><![CDATA[Rogue AI agents create online identities]]></title>
  <link>https://example.com/a</link>
  <description><![CDATA[Yet more rogue agents.]]></description>
  <pubDate>Tue, 04 Aug 2026 10:00:00 GMT</pubDate>
</item>
<item>
  <title>Plain &amp; simple title</title>
  <link>https://example.com/b</link>
  <description>Entities &quot;quoted&quot;</description>
  <pubDate>Mon, 03 Aug 2026 10:00:00 GMT</pubDate>
</item>
</channel></rss>`;

describe('rss parser', () => {
  it('unwraps CDATA and decodes entities in titles', () => {
    const { entries } = parseFeed(FEED);
    expect(entries[0].title).toBe('Rogue AI agents create online identities');
    expect(entries[1].title).toBe('Plain & simple title');
    expect(entries[1].description).toContain('"quoted"');
  });
});
