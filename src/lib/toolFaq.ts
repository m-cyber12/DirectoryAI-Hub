import { hasVerifiedScore, type Tool } from '@/data/tools';

export interface FaqEntry {
  q: string;
  a: string;
}

/**
 * Auto-generated, honest FAQ for every tool page (critique §4 tool-detail +
 * §7 missing FAQ schema). Every answer is derived only from data the catalog
 * actually holds — pricing, verification state, alternatives — so a page can
 * never promise something the rest of the site does not back up.
 *
 * Pure function → unit-tested in tests/toolFaq.test.ts.
 */
export function buildToolFaq(
  tool: Tool,
  alternativeNames: string[],
  custom: FaqEntry[] = []
): FaqEntry[] {
  const faqs: FaqEntry[] = [...custom];

  // 1 — Cost
  faqs.push({
    q: `How much does ${tool.name} cost?`,
    a:
      tool.pricing === 'Free'
        ? `${tool.name} is free to use.${
            tool.startingPrice ? ` (${tool.startingPrice})` : ''
          }`
        : tool.startingPrice
          ? `${tool.name} is a ${tool.pricing.toLowerCase()} product. Entry pricing starts at ${tool.startingPrice}.${
              tool.pricingSourceUrl
                ? ' We confirmed this on the vendor pricing page on ' +
                  tool.pricingCheckedAt +
                  '.'
                : ' Confirm current pricing on the vendor page before committing.'
            }`
          : `${tool.name} uses a ${tool.pricing.toLowerCase()} model; check the vendor page for current plan pricing.`,
  });

  // 2 — Free access
  if (tool.pricing === 'Freemium') {
    faqs.push({
      q: `Is ${tool.name} free?`,
      a: `${tool.name} has a free tier with usage limits, plus paid plans that unlock more capacity and features. For monetised channels, check what the free tier permits commercially before relying on it.`,
    });
  } else if (tool.pricing === 'Free Trial') {
    faqs.push({
      q: `Is there a free trial for ${tool.name}?`,
      a: `Yes — ${tool.name} offers a free trial so you can evaluate it before subscribing. Check the trial's export limits and whether a card is required up front.`,
    });
  } else if (tool.pricing === 'Free') {
    faqs.push({
      q: `Is ${tool.name} really free?`,
      a: `The core product is free. As with most free tools, watch for optional paid add-ons and double-check the commercial-use terms if you publish monetised content.`,
    });
  }

  // 3 — Verification status (the honesty question)
  faqs.push({
    q: `Has CreatorAI Hub tested ${tool.name} hands-on?`,
    a: hasVerifiedScore(tool)
      ? `Yes. We ran ${tool.name} on our standard benchmark brief on ${tool.testedAt} and published the evidence and sub-scores on this page.`
      : tool.verificationLevel === 'pricing-verified'
        ? `Not yet. So far a human has verified ${tool.name}'s pricing on the vendor's page (${tool.pricingCheckedAt}), but we have not run the tool ourselves. No score is published until a test with public evidence exists.`
        : `Not yet. ${tool.name} is catalogued from public information and carries no test claim and no score. Tools earn a score only after a hands-on test with published evidence.`,
  });

  // 4 — Alternatives
  if (alternativeNames.length > 0) {
    faqs.push({
      q: `What are the best alternatives to ${tool.name}?`,
      a: `In our catalog, the closest ${tool.category.toLowerCase()} alternatives include ${alternativeNames
        .slice(0, 3)
        .join(', ')}. Each has its own page with pricing and verification status so you can compare on facts, not hype.`,
    });
  }

  return faqs.slice(0, 7);
}
