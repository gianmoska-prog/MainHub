# Patch 16H — Record Entry Trigger Hard Suppression

Scope: narrow Dashboard / The Record UI bugfix only.

This patch fixes the remaining overlap where the **Open New Entry** trigger could still visually appear beneath the open **Index** dropdown.

Changes:

- Adds a hard CSS failsafe that hides `#dashboardEntryToggle` whenever the dashboard is in Index-filtering state.
- Adds `setDashboardEntryTriggerSuppressed()` to fully suppress the entry trigger with `hidden`, `aria-hidden`, `tabindex`, and `disabled` state rather than relying on opacity alone.
- Ensures the entry trigger is restored only when neither the Index dropdown nor the composer is open.
- Preserves the existing mutual-exclusion behaviour between Index, composer, and composer category menu.

No SQL, RLS, Storage, Auth, Home, Gallery, Divisions, attachment persistence, or Desk database changes.
