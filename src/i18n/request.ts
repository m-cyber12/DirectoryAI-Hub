import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

/**
 * next-intl request config — wires every request to its locale's message
 * dictionary (messages/{locale}.json). The plugin declared in next.config.js
 * points here.
 *
 * Unknown locales are rejected with a 404 so `/xx/...` can never render a
 * half-broken page.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
