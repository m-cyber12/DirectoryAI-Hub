/**
 * Minimal RSS 2.0 / Atom parser.
 *
 * Deliberately dependency-free and tolerant: the news feed must never crash a
 * build because one vendor's XML is a little unusual. It parses the fields we
 * actually use (title, link, description/summary/content, pubDate/published,
 * category) and ignores everything else. Unknown or malformed entries are
 * skipped rather than thrown.
 */

export interface ParsedFeedEntry {
  title: string;
  link: string;
  description: string;
  content: string;
  publishedAt: string; // ISO string, or '' if unavailable
  categories: string[];
}

export interface ParsedFeed {
  title: string;
  entries: ParsedFeedEntry[];
}

function decodeHtml(s: string): string {
  return s
    // v2.9: some feeds (The Verge) wrap titles in CDATA — unwrap before
    // entity decoding, otherwise the markers leak into headlines.
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#822[01];/g, '\u201c')
    .replace(/&#821[67];/g, '\u2018')
    .replace(/&#8211;/g, '\u2013')
    .replace(/&#8212;/g, '\u2014')
    .replace(/&#160;/g, ' ')
    .replace(/&nbsp;/g, ' ');
}

function stripTags(s: string): string {
  return s
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Extract a single (optionally self-closed) tag's content by name. */
function tagContent(xml: string, name: string): string {
  const re = new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i');
  const m = xml.match(re);
  return m ? decodeHtml(m[1]).trim() : '';
}

function tagOrAttr(xml: string, name: string, attr: string): string {
  // Atom <link href="..."/>
  const re = new RegExp(`<${name}[^>]*\\s${attr}=["']([^"']*)["'][^>]*\\/?>`, 'i');
  const m = xml.match(re);
  if (m) return decodeHtml(m[1]).trim();
  // RSS <link>https://...</link>
  return tagContent(xml, name);
}

function toIso(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '' : d.toISOString();
}

/** Parse an RSS 2.0 document. */
function parseRss(xml: string, channelTitle: string): ParsedFeedEntry[] {
  const items: ParsedFeedEntry[] = [];
  const itemRe = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];
    const title = tagContent(block, 'title');
    if (!title) continue;
    const link = tagContent(block, 'link');
    if (!link) continue;
    const description = stripTags(tagContent(block, 'description'));
    const contentRaw = stripTags(tagContent(block, 'content:encoded') || tagContent(block, 'content'));
    const categories = (block.match(/<category[^>]*>([\s\S]*?)<\/category>/gi) ?? []).map((c) =>
      stripTags(tagContent(c, 'category'))
    );
    const publishedAt = toIso(tagContent(block, 'pubDate'));
    items.push({
      title,
      link,
      description: description || contentRaw.slice(0, 240),
      content: contentRaw || description,
      publishedAt,
      categories,
    });
  }
  void channelTitle;
  return items;
}

/** Parse an Atom document. */
function parseAtom(xml: string): ParsedFeedEntry[] {
  const items: ParsedFeedEntry[] = [];
  const entryRe = /<entry[^>]*>([\s\S]*?)<\/entry>/gi;
  let m: RegExpExecArray | null;
  while ((m = entryRe.exec(xml)) !== null) {
    const block = m[1];
    const title = tagContent(block, 'title');
    if (!title) continue;
    const link = tagOrAttr(block, 'link', 'href');
    if (!link) continue;
    const summary = stripTags(tagContent(block, 'summary'));
    const content = stripTags(tagContent(block, 'content'));
    const categories = (block.match(/<category[^>]*>/gi) ?? []).map(
      (c) => /term=["']([^"']+)["']/.exec(c)?.[1] ?? ''
    ).filter(Boolean);
    const publishedAt = toIso(tagContent(block, 'published') || tagContent(block, 'updated'));
    items.push({
      title,
      link,
      description: summary || content.slice(0, 240),
      content: content || summary,
      publishedAt,
      categories,
    });
  }
  return items;
}

/** Parse an RSS or Atom XML string into a normalized feed. */
export function parseFeed(xml: string): ParsedFeed {
  const channelTitle = tagContent(xml, 'title');
  const rssEntries = parseRss(xml, channelTitle);
  const atomEntries = parseAtom(xml);
  const entries = rssEntries.length >= atomEntries.length ? rssEntries : atomEntries;
  return { title: channelTitle, entries };
}
