import type { Config } from 'tailwindcss'

/**
 * Tailwind CSS v4 config.
 * Theme extensions live in tokens.css via @theme inline — not here.
 * This file is referenced via @config in index.css.
 */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
} satisfies Config
