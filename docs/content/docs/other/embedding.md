# Embedding frappe-ui in a host app

This guide is for **host applications that embed frappe-ui as islands
inside a different design system** — most notably Frappe Desk, where
frappe-ui components live inside a Bootstrap 4 layout — rather than
greenfield apps built top-to-bottom on frappe-ui.

If you're building a standalone frappe-ui app, you can skip this page.

## The three invariants

Embedded frappe-ui rests on three invariants that the host must honour.
Breaking any one of them causes visible regressions: utilities don't
apply, popovers escape the scoped subtree, host CSS bleeds into dialogs.

### 1. Every island is wrapped in `[data-frappe-ui]`

Hosts that use `tailwind.config.js`'s `important: '[data-frappe-ui]'`
option only emit utility rules that fire inside that attribute. Every
mount root must carry the attribute, e.g.:

```html
<div data-frappe-ui data-theme="light" class="my-island">
  <!-- frappe-ui content -->
</div>
```

`data-theme="light"` (or `"dark"`) is recommended even when the host
hasn't wired theme switching — it makes the design-token cascade
unambiguous when the host might independently flip `<html>` themes.

### 2. The host provides a portal target

Several components teleport content out of the normal DOM tree:
`<Dialog>` (overlay), `<Combobox>` / `<Select>` / `<MultiSelect>` /
`<Dropdown>` (popover), `<Tooltip>` (bubble), `<DatePicker>` family
(calendar popover). Without intervention, reka-ui sends them to
`<body>` — outside any `[data-frappe-ui]` ancestor — so utility classes
no longer apply and the host's own CSS shows through.

The host should create a body-level portal element carrying
`[data-frappe-ui]` and provide it via the `frappe-ui:portal-target`
injection key. The mount helper used by Frappe Desk does this once per
island:

```ts
const portalEl = document.createElement('div')
portalEl.id = 'frappe-ui-portal-' + Math.random().toString(36).slice(2)
portalEl.setAttribute('data-frappe-ui', '')
portalEl.setAttribute('data-theme', 'light')
document.body.appendChild(portalEl)

const app = createApp(MyIsland)
// String key (not a Symbol) so hosts don't need to import anything from
// frappe-ui to provide it.
app.provide('frappe-ui:portal-target', `#${portalEl.id}`)
app.mount(myMountRoot)
```

Standalone frappe-ui apps don't provide the key and get the default
(teleport to `<body>`), exactly like before.

### 3. New popover components must consume the inject

Every frappe-ui component that uses a reka-ui `<*Portal>` MUST resolve
its portal target through the shared `usePortalTarget()` composable so
embedded use cases keep working. The pattern, mirrored across every
popover-using component today:

```vue
<script setup lang="ts">
import { usePortalTarget } from '../../composables/usePortalTarget'

// For components that don't expose a `portalTo` prop:
const portalTarget = usePortalTarget()
</script>

<template>
  <FooPortal :to="portalTarget">
    ...
  </FooPortal>
</template>
```

For components that DO expose a `portalTo` prop, the precedence is
**explicit prop > host inject > reka-ui default**:

```vue
<script setup lang="ts">
const props = withDefaults(defineProps<Props>(), {
  portalTo: undefined, // not 'body' — let the inject win when the user didn't set this
})

const _hostPortalTarget = usePortalTarget()
const effectivePortalTo = computed(() => props.portalTo ?? _hostPortalTarget)
</script>

<template>
  <FooPortal :to="effectivePortalTo">...</FooPortal>
</template>
```

Components currently following this pattern: `Dialog`, `Combobox`,
`Select`, `MultiSelect`, `Dropdown`, `DropdownMenuList`, `Tooltip`
(via `TooltipBubble`), the DatePicker family (via `PickerShell`).

## Test it embedded

Cypress stories that wrap the component in a fake host scope:

```ts
cy.mount(
  () => h('div', { 'data-frappe-ui': '' }, [
    h('div', { id: 'host-portal', 'data-frappe-ui': '' }),
    h(MyComponent, { ... }),
  ]),
  {
    global: {
      provide: { 'frappe-ui:portal-target': '#host-portal' },
    },
  },
)
cy.get('#host-portal').find('[data-state="open"]').should('exist')
```

If you add a popover-using component without this verification it will
silently break Frappe Desk's `frappe-ui-poc` page and the wider
`mount_vue_island` host.
