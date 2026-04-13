/**
 * Desk-safe frappe-ui entry.
 *
 * Exports only the components needed for Desk islands.
 * `vue` is externalized – Desk supplies it at runtime.
 * Everything else (reka-ui, headlessui, lucide icons, …) is bundled in.
 */

// Desk-specific stylesheet (Tailwind utilities + tokens, no preflight reset)
import './style.css'

// Base components
export { Button } from '../components/Button'
export type { ButtonProps } from '../components/Button'

export { Dialog } from '../components/Dialog'
export type { DialogProps } from '../components/Dialog'

// Form components
export { FormControl } from '../components/FormControl'
export type { FormControlProps } from '../components/FormControl'

// Utility components useful in dialogs
export { default as FeatherIcon } from '../components/FeatherIcon.vue'
export { default as LoadingIndicator } from '../components/LoadingIndicator.vue'
