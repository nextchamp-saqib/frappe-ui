/**
 * vite.config.desk.ts
 *
 * Vite library-mode build that produces a Desk-consumable artifact from
 * the minimal frappe-ui desk entry (`src/desk/index.ts`).
 *
 * Key decisions
 * ─────────────
 * • `vue` is externalised – Desk supplies it at runtime via window.Vue /
 *   SetVueGlobals.
 * • `vue-router` is externalised for the same reason.
 * • Everything else (reka-ui, @headlessui/vue, lucide-static, feather-icons,
 *   @floating-ui/…) is bundled so consumers don't need to install them.
 * • The lucideIcons() Vite plugin inlines icon SVGs as Vue components so that
 *   the `~icons/lucide/*` virtual imports resolve at build time and are absent
 *   from the output module.
 * • CSS is emitted as `dist/desk/style.css` using the desk-specific Tailwind
 *   config that disables the preflight browser reset.
 */

import path from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { lucideIcons } from './vite/lucideIcons.js'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  plugins: [vue(), lucideIcons()],
  resolve: {
    alias: {
      // Required by components that do `import tailwindConfig from 'tailwind.config.js'`
      'tailwind.config.js': path.resolve(__dirname, 'tailwind.config.js'),
    },
  },
  css: {
    postcss: {
      plugins: [
        // Use the desk-specific Tailwind config (no preflight, no global styles)
        tailwindcss(path.resolve(__dirname, 'tailwind.config.desk.js')),
        autoprefixer(),
        // Add !important to every declaration already scoped under [data-frappe-ui].
        //
        // Why: Tailwind's `important: '[data-frappe-ui]'` adds an ancestor selector
        // (outward containment + specificity boost) but does NOT add `!important`.
        // Frappe's desk.bundle.css contains Bootstrap utility overrides like
        //   .pt-5 { padding-top: 42px !important }
        // which beat our ancestor-selector rules on specificity grounds because
        // !important declarations form their own cascade layer where specificity
        // is re-evaluated — and `.pt-5` (0,1,0) beats `[data-frappe-ui] .pt-5`
        // (0,2,0) inside that layer only when the !important source wins origin.
        // Adding !important to our own scoped rules gives us the same origin, and
        // then our higher specificity (0,2,0 vs 0,1,0) correctly takes precedence.
        {
          postcssPlugin: 'frappe-ui-important',
          Declaration(decl) {
            const rule = decl.parent
            if (
              rule?.type === 'rule' &&
              typeof (rule as any).selector === 'string' &&
              (rule as any).selector.includes('[data-frappe-ui]') &&
              !decl.important
            ) {
              decl.important = true
            }
          },
        },
      ],
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/desk/index.ts'),
      formats: ['es'],
      fileName: () => 'index.js',
    },
    outDir: 'dist/desk',
    emptyOutDir: true,
    rollupOptions: {
      external: ['vue', 'vue-router'],
      output: {
        // CSS is extracted as a separate file via Vite's cssCodeSplit:false default
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'style.css'
          return assetInfo.name ?? 'asset'
        },
      },
    },
    // Keep source maps for debugging
    sourcemap: true,
  },
})
