import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

/**
 * Audit fixes 4.1, 4.2, 4.7:
 *  - #030305 was hardcoded in 15 files. Now a token (`surface-0`).
 *  - No font was ever defined; the site rendered in the system default and
 *    looked different on Windows / Android / macOS. Wired to next/font vars.
 *  - Art direction moved off the generic "purple AI SaaS" template toward a
 *    professional video-tool language (neutral graphite + a single amber
 *    accent, monospace tabular numerals for measurements).
 */
const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './content/**/*.{md,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Neutral graphite surfaces — replaces the purple-tinted near-black.
        // Audit fix 4.1 — now driven by CSS variables so light/dark mode
        // can override them without duplicating every utility class.
        surface: {
          0: 'var(--surface-0, #0E0F12)',
          1: 'var(--surface-1, #15171C)',
          2: 'var(--surface-2, #1C1F26)',
          3: 'var(--surface-3, #252932)',
        },
        background: 'var(--surface-0, #0E0F12)',
        foreground: 'var(--foreground, #F4F4F5)',

        // Single accent: signal amber, borrowed from timeline/scope UI.
        // v2.1 (Infinity Gauntlet easter egg): values read from CSS variables
        // so the whole palette can flip yellow→red site-wide on the snap.
        accent: {
          50: 'var(--accent-50, #FFF8EB)',
          200: 'var(--accent-200, #FDE9B8)',
          300: 'var(--accent-300, #FBD87F)',
          400: 'var(--accent-400, #F7C948)',
          500: 'var(--accent-500, #E8AE1C)',
          600: 'var(--accent-600, #C08A0F)',
          700: 'var(--accent-700, #8F650B)',
        },

        // Retained so existing purple utility classes keep compiling during
        // the incremental redesign.
        primary: {
          50: '#FAF5FF',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
        },

        // Semantic verification colours (used by the trust badges).
        verified: '#34D399',
        partial: '#F7C948',
        listed: '#71717A',
      },

      fontFamily: {
        sans: ['var(--font-sans)', ...defaultTheme.fontFamily.sans],
        mono: ['var(--font-mono)', ...defaultTheme.fontFamily.mono],
      },

      /**
       * Audit fix 4.2 — the codebase contained dozens of text-[9px],
       * text-[10px] and text-[11px] declarations. 9px body text is unreadable
       * on mobile and fails WCAG. Nothing in this scale goes below 12px.
       */
      fontSize: {
        '2xs': ['0.75rem', { lineHeight: '1rem' }], // 12px — the hard floor
        xs: ['0.8125rem', { lineHeight: '1.125rem' }], // 13px
        sm: ['0.875rem', { lineHeight: '1.375rem' }], // 14px
        base: ['0.9375rem', { lineHeight: '1.5rem' }], // 15px
        lg: ['1.0625rem', { lineHeight: '1.625rem' }], // 17px
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '1.9rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1.1' }],
        '6xl': ['3.5rem', { lineHeight: '1.05' }],
      },

      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow':
          'radial-gradient(circle at 50% 0%, rgba(247, 201, 72, 0.10) 0%, rgba(14, 15, 18, 0) 70%)',
      },

      fontVariantNumeric: {
        tabular: 'tabular-nums',
      },
    },
  },
  plugins: [],
};

export default config;
