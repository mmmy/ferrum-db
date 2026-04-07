# Design System Specification: The Kinetic Console

## 1. Overview & Creative North Star
**Creative North Star: "The Precision Engine"**

This design system is engineered for the high-performance database professional. It rejects the "web-page" aesthetic in favor of a "software-instrument" philosophy. We are moving beyond the standard grid to embrace **Technical Brutalism with High-End Editorial polish**. 

The system avoids the generic "card-heavy" look of modern SaaS. Instead, it utilizes **Tonal Layering** and **Intentional Asymmetry** to create a dense, information-rich environment that feels fast and lightweight. By utilizing deep charcoal foundations and surgical strikes of vibrant color, we create an interface that recedes when you’re thinking and reacts instantly when you’re acting.

---

## 2. Colors & Surface Philosophy

### The "No-Line" Rule
Traditional 1px borders are banned for structural sectioning. In a high-density IDE environment, borders create "visual noise" that slows down cognitive processing. 
- **Method:** Define boundaries through background shifts. Use `surface-container-low` for the main workspace and `surface-container-high` for sidebars or property panels.
- **The Transition:** If two areas need separation, use a 4px padding gap to let the `background` color show through, acting as a "negative space" divider.

### Surface Hierarchy & Nesting
We treat the UI as a physical stack of light-absorbing materials.
- **Base Layer:** `surface` (#0e0e0e) for the primary editor/code viewport.
- **Recessed Layer:** `surface-container-lowest` (#000000) for "sunken" utility bars or terminal outputs.
- **Elevated Layer:** `surface-container-highest` (#262626) for active modals or context menus.

### Environment Tagging (The Signature Accents)
Accents are not decorative; they are functional state-indicators.
- **Development:** `primary` (#79b0ff) – A cooling blue for safe-zone work.
- **Staging:** `secondary` (#fddc9a) – A cautionary amber for pre-production.
- **Production:** `tertiary` (#ff716b) – A high-alert red for live environments.

### The "Glass & Gradient" Rule
For floating command palettes (CMD+K), use `surface-variant` at 80% opacity with a `24px` backdrop blur. Apply a subtle linear gradient border (top-left to bottom-right) using `primary` to `primary-container` at 15% opacity to give the element a "laser-etched" edge.

---

## 3. Typography: The Information Hierarchy

The typography system balances the humanity of `Inter` with the technical precision of `Space Grotesk` (Labels) and `JetBrains Mono` (Data).

*   **Display & Headlines (`Inter`):** Used sparingly for high-level dashboard views. Keep tracking (letter-spacing) tight (-0.02em) to maintain a modern, "tucked" look.
*   **The UI Workhorse (`Inter`):** `body-md` and `body-sm` are the primary engines for table data and property names.
*   **Technical Labels (`Space Grotesk`):** All `label-md` and `label-sm` elements (tags, status indicators) must use Space Grotesk. This introduces a subtle "architectural" feel that distinguishes metadata from content.
*   **The Code Core (`JetBrains Mono`):** Reserved strictly for SQL queries, JSON outputs, and schema definitions. Use `on-surface` for primary code and `primary` for keywords.

---

## 4. Elevation & Depth

### The Layering Principle
Depth is achieved through **Luminance Stacking**. 
1.  **Level 0 (Deepest):** `surface-container-lowest` (#000000) – Terminal/Logs.
2.  **Level 1 (Base):** `surface` (#0e0e0e) – Main Workspace.
3.  **Level 2 (Raised):** `surface-container` (#191a1a) – Sidebar Navigation.
4.  **Level 3 (Interactive):** `surface-container-highest` (#262626) – Hover states and active selections.

### Ambient Shadows
Avoid heavy black shadows. When an element floats (e.g., a dropdown), use a shadow with a spread of `30px`, blur of `60px`, and a color of `rgba(0, 0, 0, 0.5)`. To create a "glow" effect for environment alerts, tint the shadow with the `tertiary` (red) or `primary` (blue) color at 5% opacity.

### The "Ghost Border" Fallback
If a border is required for accessibility in data tables, use the `outline-variant` (#484848) at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### Buttons (Precision Triggers)
*   **Primary:** Background: `primary_container`; Text: `on_primary_container`. No rounded corners—use `sm` (0.125rem) for a sharp, "machined" look.
*   **Tertiary (Ghost):** No background. Text: `primary`. Hover state: `surface_container_high`.

### Input Fields (Data Entry)
*   **Aesthetic:** "Underlined" style or subtle `surface_container_low` fill. 
*   **State:** When focused, the `outline` becomes `primary` but only at the bottom 2px, mimicking an IDE cursor.

### Chips (Environment Tags)
*   Use `label-sm` (Space Grotesk). 
*   **Dev:** Background: `primary_container` (20% opacity); Text: `primary`.
*   **Prod:** Background: `error_container` (20% opacity); Text: `error`.

### Cards & Data Lists
*   **Forbid Dividers:** Use `16px` or `24px` of vertical white space to separate records.
*   **Hover State:** Shift the background from `surface` to `surface_container_low`. Do not use shadows for row selection.

### New Component: The "Breadcrumb-Path"
*   In place of a standard header, use a dense, monospaced breadcrumb path: `Cluster / Production / Databases / users_v2`. This acts as both navigation and a high-visibility environment status bar.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use extreme density. Developers prefer seeing 50 rows of data over 10 rows with "breathing room."
*   **Do** use monochromatic icons. Use color only for status (online/offline) or environment (Dev/Prod).
*   **Do** prioritize keyboard shortcuts in tooltips. E.g., "Run Query (⌘+Enter)."

### Don't:
*   **Don't** use large border-radii. Anything over `md` (0.375rem) feels too "consumer" and soft for this system.
*   **Don't** use pure white (#FFFFFF) for body text. Use `on_surface_variant` (#adabaa) to reduce eye strain, reserving pure white for active headings.
*   **Don't** use animations that exceed 150ms. Transitions must feel instantaneous.