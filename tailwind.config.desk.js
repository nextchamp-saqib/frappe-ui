/**
 * Tailwind configuration for the frappe-ui Desk library build.
 *
 * Identical to the root tailwind.config.js with three key differences:
 *  1. Uses createPlugin({ skipGlobalStyles: true }) so global element rules
 *     (html font-family, body font-variation-settings, select, …) are NOT
 *     emitted, preventing them from clobbering Bootstrap-driven Desk elements.
 *  2. `corePlugins.preflight` is disabled so the Tailwind browser-reset does
 *     not clobber Bootstrap-driven Desk elements.
 *  3. `content` is narrowed to only the components in the desk entry so the
 *     generated CSS contains only utility classes actually used by Button and
 *     Dialog.
 */
import themePlugin from './tailwind/plugin.js'
import forms from '@tailwindcss/forms'
import typography from '@tailwindcss/typography'

export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  /**
   * Scope every generated utility class inside a [data-frappe-ui] ancestor.
   *
   * Why: Tailwind's `important` option with a selector string wraps each
   * utility rule in that selector, e.g.:
   *   [data-frappe-ui] .flex { display: flex }
   *
   * This achieves two things:
   *  1. Outward containment — Tailwind rules only fire inside
   *     [data-frappe-ui] DOM, so they cannot pollute Bootstrap-controlled
   *     parts of the Desk layout.
   *  2. Inward protection — the ancestor+class combo has specificity (0,2,0)
   *     which beats Bootstrap's plain element selectors (e.g. button { … })
   *     at (0,0,1), so Bootstrap cannot override frappe-ui component styling.
   *
   * CSS custom-property tokens emitted by addBase() are NOT affected by this
   * option — they still land at :root / [data-theme="dark"] as usual.
   */
  important: '[data-frappe-ui]',
  plugins: [forms, typography, themePlugin],
  /**
   * Only scan the source files reachable from the desk entry.
   * This keeps the CSS output small and avoids generating utilities
   * for components that are not part of the desk surface.
   */
  content: [
    './src/desk/**/*.{vue,js,ts,tsx}',
    './src/components/Button/**/*.{vue,js,ts,tsx}',
    './src/components/Dialog/**/*.{vue,js,ts,tsx}',
    './src/components/FormControl/**/*.{vue,js,ts,tsx}',
    './src/components/TextInput/**/*.{vue,js,ts,tsx}',
    './src/components/Textarea/**/*.{vue,js,ts,tsx}',
    './src/components/FeatherIcon.vue',
    './src/components/LoadingIndicator.vue',
    './src/components/Tooltip/**/*.{vue,js,ts,tsx}',
  ],
  corePlugins: {
    /**
     * Disable the Tailwind preflight (browser normalisation stylesheet).
     * A full scoped preflight is emitted manually in src/desk/style.css,
     * scoped to [data-frappe-ui] so it doesn't affect Bootstrap-owned DOM.
     */
    preflight: false,
    /**
     * Disable the container component. It emits unscoped .container rules
     * via @tailwind components, which are NOT affected by the `important`
     * selector option (that only covers @tailwind utilities). Those rules
     * would override Bootstrap's .container max-width on Desk pages.
     */
    container: false,
  },
  theme: {
    extend: {},
  },
}
