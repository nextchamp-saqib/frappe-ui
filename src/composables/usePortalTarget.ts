/**
 * usePortalTarget — opt-in portal target for floating UI primitives.
 *
 * Several frappe-ui components teleport content out of the normal DOM tree
 * (Dialog overlays via `<DialogPortal>`, Combobox popovers via
 * `<ComboboxPortal>`, DatePicker via `<PopoverPortal>`, etc.). By default
 * reka-ui sends them to `<body>` which is correct for standalone apps
 * built on the frappe-ui design system.
 *
 * Host applications that **embed** frappe-ui inside a non-frappe-ui DOM
 * (notably Frappe Desk, where frappe-ui lives as a `[data-frappe-ui]`
 * island inside a Bootstrap 4 layout) need every popover/overlay to stay
 * inside their scoped subtree — otherwise the host's `[data-frappe-ui]`-
 * scoped Tailwind utilities don't apply and host CSS (Bootstrap defaults
 * here) bleeds through.
 *
 * Such a host calls `app.provide(PORTAL_TARGET_KEY, '#my-portal')` once
 * at mount, then every component below consumes it via this composable.
 * Components must still accept an explicit `portalTo` / `:to` prop so
 * callers can override per-instance; this composable supplies the
 * default.
 *
 * Returning `undefined` (rather than `null` or `'body'`) preserves the
 * downstream component's own default behaviour — `<DialogPortal>` and
 * friends fall back to `<body>` themselves when no `:to` is set.
 */
import { inject } from 'vue'

/**
 * String injection key. Deliberately a plain string (not a Symbol) so
 * embedding applications can `provide()` it without having to import
 * anything from frappe-ui:
 *
 *   // In the host application's mount code:
 *   app.provide('frappe-ui:portal-target', '#frappe-ui-portal')
 *
 * The trade-off — string keys can collide across libraries — is
 * acceptable here because the namespace prefix (`frappe-ui:`) makes
 * collisions extremely unlikely.
 */
export const PORTAL_TARGET_KEY = 'frappe-ui:portal-target'

/**
 * Resolve the portal target an embedding application has provided, or
 * `undefined` if none was set (standalone use).
 *
 * Components should pass the return value through to the underlying
 * reka-ui portal primitive, e.g.:
 *
 *   const portalTarget = usePortalTarget()
 *   // <DialogPortal :to="portalTarget">
 *
 * When `portalTarget` is `undefined` reka-ui's own default ('body') is
 * used.
 */
export function usePortalTarget(): string | HTMLElement | undefined {
  return inject<string | HTMLElement | undefined>(PORTAL_TARGET_KEY, undefined)
}
