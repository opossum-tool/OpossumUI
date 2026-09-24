<!--
SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>

SPDX-License-Identifier: CC0-1.0
-->

# Technical Debt Report

## Executive Summary

This report documents the widespread use of hardcoded pixel values for spacing and dimensions across the OpossumUI codebase. This represents a significant technical debt that hinders maintainability, theming, and responsive design. The migration to theme values described in the per-section tables below is complete; the residual table at the bottom lists the remaining known exceptions found in a later verification pass.

### Note: Pitfalls Found and Fixed During Migration of Hardcoded Spacing Values

Two MUI v9 pitfalls caused earlier conversions to silently not apply. Both were found by verifying the runtime behavior of the installed `@mui/system`/`@mui/styled-engine` source and have been fixed across the codebase:

1. **`styled()` style objects are not processed through the sx system.** Shorthand keys (`p`, `px`, `py`, `pl`, `gap`, …) inside `styled()` objects are serialized as literal CSS: invalid property names are dropped by the browser, and `gap: N` applies as `Npx` instead of `N × 4px`. All affected `*.style.ts(x)` files use the `({ theme }) => ({ ... theme.spacing(...) })` pattern (see PackagesPanel, SignalsList, MultiResourcePicker, SelectMenu, GroupedList, ProjectStatisticsPopup, ErrorFallback, ResizePanels, TextBox, PackageSubPanel, DialogLogDisplay, ProcessPopup, Toaster, ButtonRow, DiffPopup-style plain objects). **The rebase onto main partially rolled this back** (DiffPopup.style.ts, Toaster.tsx, LicenseNameField.tsx, ResourceBrowser.style.ts, DialogLogDisplay.style.ts, MultiResourcePicker's ExpandButton, ButtonRow's `p: 3`); the affected rows have since been re-fixed using the theme callback pattern (or plain sx-unit numbers where the object is sx-consumed, as in DiffPopup.style.ts / LicenseNameField.tsx).

2. **Nested `sx: { … }` keys are dead code.** A nested `sx` key inside an `sx` prop or inside an sx-consumed style object (e.g. a `classes` entry passed via `sx={classes.x}`) is emitted as a CSS selector matching nonexistent `<sx>` elements — its values never apply. 12 such instances (previously listed as converted but never applied) were fixed by hoisting the values to the object root, where sx resolves them correctly:

   - `TopBar.tsx` (`openFileIcon`, `versionInfo`)
   - `PathBar.tsx` (`root`)
   - `PackageCard.tsx` (`root`, `innerRoot`)
   - `ProgressBar.tsx` (`bar`, inline entry `sx`)
   - `SwitchableProgressBar.tsx` (`container`)
   - `Icons.tsx` (`resourceIcon`)
   - `AttributionForm/AuditingOptions/AuditingOptions.tsx` (`container`)
   - `ProjectStatisticsPopup.tsx` (chart grid `sx`)
   - `AttributionForm/PackageSubPanel/PackageSubPanel.tsx` (`DisplayRow`, converted to `theme.spacing(2)`)

   The "Converted to" values in the tables below describe styles that are genuinely applied at runtime.

## Hardcoded Pixel Values for Dimensions and Sizing

A repository-wide scan (fresh pass; excluding unit tests, test helpers, and e2e/performance tests) shows that hardcoded pixel values are not limited to margin/padding/gap: **150+ further instances across 45+ files** determine dimensions and sizing — element widths and heights, minimum/maximum sizes, font sizes, icon sizes, border widths, corner radii, positioning offsets, chart geometry, virtual-list geometry, and the Electron window size. All rows in the section tables below have since been migrated to theme values; the residual table at the bottom lists the hardcoded values that are not covered by those tables.

Scope conventions for the tables below:

- Unitless numbers (e.g. `height: 2`, `width={600}`) are pixel values by CSS/engine semantics and are listed with their effective px size.
- Zero values (`height: 0`, `top: 0`) and pure percentage values (`width: '100%'`, `borderRadius: '50%'`) are omitted; viewport-unit sizing is collected in a separate note at the end.
- Unlike margin/padding/gap, `width`/`height` are not auto-scaled by the `sx` prop (numbers there mean raw pixels), so a future migration needs `theme.spacing(...)` callbacks, shared dimension constants, or theme extensions (`theme.typography`, `theme.shape.borderRadius`) rather than plain sx shorthand.

### _DONE_ Shared styles and theme

All rows converted, including the `MuiInputBase` minHeight override (`theme.spacing(9)`). Font sizes read through the **shared theme typography**: the variants live in **`src/Frontend/app-typography.ts`** (`typographyVariants`, including the new `body3` = 13px and `dense` = 11px variants) and are registered in `App.style.ts` via `typography: typographyVariants`. The two non-standard variants are typed via **module augmentation** of MUI's `TypographyVariants`/`TypographyVariantsOptions` (declared in `app-typography.ts`), so `theme.typography.body3` / `theme.typography.dense` are natively typed everywhere — no casts, no helper accessor. Consumers read them as sx value callbacks (`(theme: Theme) => theme.typography.body3.fontSize`) since the shared objects are spread into consumers' sx (Icons/PathBar/ProjectMetadataTable precedent) so function values resolve at runtime. The remaining off-lattice spacing/dimension values (`baseIcon`, `maxWidth`, `borderRadius`) resolve through sx value callbacks (`({ spacing }: Theme) => spacing(...)`, `satisfies SxProps<Theme>`; the file carries a justified file-level `no-magic-numbers` disable). The recharts tooltip object was converted into a **theme-parameterized factory** `chartTooltipContentStyle(theme)` (raw `React.CSSProperties` can not resolve function values; it is consumed via recharts `contentStyle` — not sx); both consumers (`BarChart.tsx:64`, `PieChart.tsx:93`) call it with their in-scope `useTheme()` result. Exact spacing mapping (4px unit): 0.25 = 1px, 0.75 = 3px, 1 = 4px, 3.75 = 15px, 50 = 200px — all FP-exact integers/binary-exact halves.

| File                                          | Line | Property                                      | Value               | Determines                                                                                                                                                     | Converted to                                                                                                                     |
| --------------------------------------------- | ---- | --------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `src/Frontend/shared-styles.ts:57`            | 57   | `baseIcon.width`                              | `'15px'`            | size of all icons using `baseIcon`/`clickableIcon`                                                                                                             | `spacing(3.75)` (= 15px) value callback                                                                                          |
| `src/Frontend/shared-styles.ts:58`            | 58   | `baseIcon.height`                             | `'15px'`            | icon size (see above)                                                                                                                                          | `spacing(3.75)` (= 15px) value callback                                                                                          |
| `src/Frontend/shared-styles.ts:79`            | 79   | `tableClasses.head.fontSize`                  | `13`                | table head font size                                                                                                                                           | `theme.typography.body3.fontSize` (= 13px, `app-typography.ts` variant)                                                          |
| `src/Frontend/shared-styles.ts:84`            | 84   | `tableClasses.body.fontSize`                  | `11`                | table body font size                                                                                                                                           | `theme.typography.dense.fontSize` (= 11px, `app-typography.ts` variant)                                                          |
| `src/Frontend/shared-styles.ts:86`            | 86   | `tableClasses.body.maxWidth`                  | `'200px'`           | max table cell width                                                                                                                                           | `spacing(50)` (= 200px) value callback                                                                                           |
| `src/Frontend/shared-styles.ts:92`            | 92   | `tableClasses.footer.fontSize`                | `12`                | table footer font size                                                                                                                                         | `theme.typography.caption.fontSize` (= 12px, `app-typography.ts` variant)                                                        |
| `src/Frontend/shared-styles.ts:132`           | 132  | `treeItemClasses.matchesFilters.borderRadius` | `'3px'`             | corner radius of the "matches filters" highlight                                                                                                               | `spacing(0.75)` (= 3px) value callback                                                                                           |
| `src/Frontend/shared-styles.ts:149`           | 149  | `chartTooltipContentStyle.fontSize`           | `'12px'`            | recharts tooltip font size (factory parameterized by theme)                                                                                                    | `theme.typography.caption.fontSize` (= 12px, BarChart tickStyle precedent)                                                       |
| `src/Frontend/shared-styles.ts:151`           | 151  | `chartTooltipContentStyle.padding`            | `3`                 | recharts tooltip inner padding — raw `React.CSSProperties` (`contentStyle`), not sx-processed; **now spacing-scaled** via the factory (from the residual note) | `theme.spacing(0.75)` (= 3px) inside the factory                                                                                 |
| `src/Frontend/shared-styles.ts:153`           | 153  | `chartTooltipContentStyle.borderRadius`       | `'4px'`             | recharts tooltip corner radius                                                                                                                                 | `theme.spacing(1)` (= 4px) inside the factory                                                                                    |
| `src/Frontend/app-typography.ts:25`           | 25   | `typography.body1.fontSize`                   | `'14px'`            | app-wide body1 font size                                                                                                                                       | `typographyVariants.body1` in `app-typography.ts` (value unchanged)                                                              |
| `src/Frontend/app-typography.ts:26`           | 26   | `typography.body1.lineHeight`                 | `'20px'`            | body1 line box height                                                                                                                                          | `typographyVariants.body1` in `app-typography.ts` (value unchanged)                                                              |
| `src/Frontend/app-typography.ts:29`           | 29   | `typography.body2.fontSize`                   | `'14px'`            | app-wide body2 font size                                                                                                                                       | `typographyVariants.body2` in `app-typography.ts` (value unchanged)                                                              |
| `src/Frontend/app-typography.ts:30`           | 30   | `typography.body2.lineHeight`                 | `'18px'`            | body2 line box height                                                                                                                                          | `typographyVariants.body2` in `app-typography.ts` (value unchanged)                                                              |
| `src/Frontend/app-typography.ts:41`           | 41   | `typography.caption.fontSize`                 | `'12px'`            | app-wide caption font size                                                                                                                                     | `typographyVariants.caption` in `app-typography.ts` (value unchanged; consumers read it via `theme.typography.caption.fontSize`) |
| `src/Frontend/app-typography.ts:42`           | 42   | `typography.caption.lineHeight`               | `'20px'`            | caption line box height                                                                                                                                        | `typographyVariants.caption` in `app-typography.ts` (value unchanged)                                                            |
| `src/Frontend/Components/App/App.style.ts:62` | 62   | `MuiInputBase` override `minHeight`           | `'36px !important'` | min height of every input in the app                                                                                                                           | `` `${theme.spacing(9)} !important` `` (= 36px) inside the `MuiInputBase` styleOverrides                                         |

### _DONE_ Electron main process

Window size constants in `src/ElectronBackend/main/createWindow.ts` (screen-aware clamping uses `screen.getPrimaryDisplay().workAreaSize`) — the preferred size is clamped to the actual screen work area when the window opens, so on small screens (e.g. 1366×768 laptops) the window no longer opens taller than the desktop:

| File                                          | Line | Property                | Value  | Determines                                                 |
| --------------------------------------------- | ---- | ----------------------- | ------ | ---------------------------------------------------------- |
| `src/ElectronBackend/main/createWindow.ts:12` | 12   | `DEFAULT_WINDOW_WIDTH`  | `1920` | preferred initial app window width (clamped to work area)  |
| `src/ElectronBackend/main/createWindow.ts:13` | 13   | `DEFAULT_WINDOW_HEIGHT` | `1080` | preferred initial app window height (clamped to work area) |
| `src/ElectronBackend/main/createWindow.ts:14` | 14   | `MIN_WINDOW_WIDTH`      | `500`  | minimum window width (constraint, not a design token)      |
| `src/ElectronBackend/main/createWindow.ts:15` | 15   | `MIN_WINDOW_HEIGHT`     | `400`  | minimum window height (constraint, not a design token)     |

### _DONE_ Autocomplete

All rows converted via the theme spacing scale in `styled()` theme callbacks, except `AutocompleteUtil.tsx` (module-scope `occurrenceChipClass`, `satisfies SxProps<Theme>`; numbers in module-scope const class members are exempt from `no-magic-numbers`). The floating label font reads the shared `body3` typography variant (`theme.typography.body3.fontSize`, defined in `src/Frontend/app-typography.ts`, typed via module augmentation). Unit mapping (4px spacing unit): 0.25 units = 1px, 3 units = 12px, 3.5 units = 14px, 4 units = 16px, 5 units = 20px, 6 units = 24px, 7 units = 28px, 9.1675 units = 36.67px (`4 * 9.1675 === 36.67` exactly). Row 57 was already theme-scaled in code — only the stale Value description was corrected. Two behavioral px values found in a post-rebase verification pass (the `renderPopper` top-padding and the Listbox Virtuoso overscan) were converted inline via `parseFloat(theme.spacing(...))` with `useTheme()` — see the last two table rows:

| File                                                              | Line     | Property                       | Value                   | Determines                                                                                                                                                     | Converted to                                                                                                                                                |
| ----------------------------------------------------------------- | -------- | ------------------------------ | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:43`  | 43       | input label `fontSize`         | `'13px'`                | floating label font                                                                                                                                            | `theme.typography.body3.fontSize` (= 13px, `app-typography.ts` variant)                                                                                     |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:44`  | 44       | label `top`                    | `'1px'`                 | label vertical offset                                                                                                                                          | `theme.spacing(0.25)`                                                                                                                                       |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:53`  | 53       | `MuiInputBase-root minHeight`  | `'36.67px'`             | input row minimum height                                                                                                                                       | `theme.spacing(9.1675)`                                                                                                                                     |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:57`  | 57       | `paddingRight`                 | `calc(12px + N * 28px)` | width reserved for end adornments                                                                                                                              | already `calc(theme.spacing(3) + N * theme.spacing(7))` (theme-scaled px `calc()`)                                                                          |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:84`  | 84       | focused fieldset `borderWidth` | `'1px'`                 | focus outline width                                                                                                                                            | `theme.spacing(0.25)`                                                                                                                                       |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:120` | 120      | `EndAdornmentContainer.right`  | `'14px'`                | end-adornment inset from right edge                                                                                                                            | `theme.spacing(3.5)`                                                                                                                                        |
| `src/Frontend/Components/Autocomplete/AutocompleteUtil.tsx:14`    | 14       | `minWidth`                     | `'24px'`                | end-adornment icon wrapper (`occurrenceChipClass`, used at lines 34 and 60)                                                                                    | `spacing(OCCURRENCE_CHIP_MIN_WIDTH_IN_THEME_UNITS)` (= 6 units = 24px) in module-scope `occurrenceChipClass` (deduped from the two chip spots)              |
| `src/Frontend/Components/Autocomplete/Autocomplete.tsx:327`       | 327      | `renderPopper` local `padding` | `16`                    | gap subtracted from the anchor's `getBoundingClientRect().top` to cap the force-top listbox height (flows into the `min(${maxHeight}px, ...)` calc in Listbox) | `parseFloat(theme.spacing(4))` (= 16px) via `useTheme()` at line 117 (BarChart-style `spacingPx` resolution; found in a post-rebase verification pass)      |
| `src/Frontend/Components/Autocomplete/Listbox/Listbox.tsx:126`    | 126, 168 | `increaseViewportBy`           | `20`                    | Virtuoso viewport overscan (behavioral virtualization parameter, same category as `INFINITE_LIST_BOTTOM_OVERSCAN`)                                             | `parseFloat(theme.spacing(5))` (= 20px) via `useTheme()` at line 82, inline at both call sites (no new constants; found in a post-rebase verification pass) |

### _DONE_ AuditingOptions

| File                                                                                  | Line | Property         | Value               | Determines                                                                                  | Converted to                                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------- | ---- | ---------------- | ------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/Frontend/Components/AttributionForm/AuditingOptions/AuditingOptions.util.tsx:47` | 47   | `width`/`height` | `'19px'` / `'19px'` | all five satisfaction icons (`satisfactionIconClass` used at lines 276, 281, 285, 289, 294) | `spacing(AUDITING_OPTION_ICON_THEME_SIZE)` (= 4.75 theme units, 19px) in module-scope `satisfactionIconClass` (line 47), deduped via a sx theme callback (values, e.g. `width`/`height`, are not auto-scaled by sx) |

The size token lives in `src/Frontend/shared-styles.ts:141` (`AUDITING_OPTION_ICON_THEME_SIZE`) and is shared with the SelectMenu icon column (see below).

### _DONE_ BarChart

The values are read from the MUI theme at runtime via `useTheme()` (PieChart precedent), because recharts consumes plain object values (`tick`/`style` props and numeric `margin`/`offset`), not theme-unit sx shorthands — sx theme-unit numbers would be raw pixels here:

| File                                               | Line  | Property             | Value                               | Determines                     | Converted to                                                                                                                                                                                                                                       |
| -------------------------------------------------- | ----- | -------------------- | ----------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/Frontend/Components/BarChart/BarChart.tsx:38` | 38    | `tickStyle.fontSize` | `'12px'`                            | axis tick labels               | `theme.typography.caption.fontSize` (caption is 12px, defined in `app-typography.ts`)                                                                                                                                                              |
| `src/Frontend/Components/BarChart/BarChart.tsx:48` | 48–52 | `RcBarChart margin`  | `{ left: 8, right: 10, bottom: 4 }` | chart plot-area margins        | theme-unit constants (`MARGIN_LEFT_IN_THEME_UNITS` = 2, `MARGIN_RIGHT_IN_THEME_UNITS` = 2.5, `MARGIN_BOTTOM_IN_THEME_UNITS` = 1), resolved numerically via `parseFloat(theme.spacing(units))` (= 8/10/4px) because recharts `margin` needs numbers |
| `src/Frontend/Components/BarChart/BarChart.tsx:57` | 57    | `RcLabel offset`     | `-3` (recharts px offset)           | x-axis label vertical position | `X_AXIS_LABEL_OFFSET_IN_THEME_UNITS` = 0.75 units (= 3px), passed negated                                                                                                                                                                          |

### _DONE_ CardList

| File                                               | Line | Property | Value                             | Determines         | Converted to                                                                                                                                                                                                                                                                                                                              |
| -------------------------------------------------- | ---- | -------- | --------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/Frontend/Components/CardList/CardList.tsx:32` | 32   | `border` | `'1px solid rgba(0, 0, 0, 0.12)'` | card outline width | fully theme-driven via `useTheme()`: width `theme.spacing(BORDER_WIDTH_IN_THEME_UNITS)` (`BORDER_WIDTH_IN_THEME_UNITS` = 0.25 units = 1px with the 4px spacing unit), color `theme.palette.divider` (= MUI's default `rgba(0, 0, 0, 0.12)`; the few remaining literal `1px` border widths are listed in the residual table at the bottom) |

### _DONE_ ConfirmAttributionActionPopup

All three values are exact conversions via the theme spacing scale (4px unit: 145 units = 580px, 25 units = 100px, 100 units = 400px), resolved at runtime through the theme — they follow the spacing unit if it ever changes. The `145`/`25` call arguments carry a justified `no-magic-numbers` disable comment (`100` is in the rule's allowlist; report precedent: `ReportTableItem.tsx`). Unit tests render these components without `ThemeProvider` (MUI default spacing of 8 applies there), so the pixel fidelity described here refers to the app runtime under the app theme (`App.style.ts`, unit 4):

| File                                                                                              | Line | Property                  | Value     | Determines                     | Converted to                                                                                         |
| ------------------------------------------------------------------------------------------------- | ---- | ------------------------- | --------- | ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `src/Frontend/Components/ConfirmAttributionActionPopup/ConfirmAttributionActionPopup.tsx:111`     | 111  | `NotificationPopup width` | `580`     | popup width                    | `theme.spacing(145)` via `useTheme()` ( lands in the dialog-paper sx of `NotificationPopup.tsx:56` ) |
| `src/Frontend/Components/ConfirmAttributionActionPopup/ConfirmAttributionActionPopup.tsx:142`     | 142  | `minHeight`               | `'100px'` | content box minimum height     | `theme.spacing(25)` via `useTheme()`                                                                 |
| `src/Frontend/Components/ConfirmAttributionActionPopup/ConfirmAttributionActionPopup.style.ts:14` | 14   | `height`                  | `'400px'` | resource tree container height | `theme.spacing(100)` in the `styled()` theme callback                                                |

### _DONE_ ConfirmReplacePopup

Exact conversion via the theme spacing scale (4px unit: 125 units = 500px), same caveats as _DONE_ ConfirmAttributionActionPopup above (scale-coupling; unit tests render without `ThemeProvider`):

| File                                                                      | Line | Property                  | Value | Determines  | Converted to                          |
| ------------------------------------------------------------------------- | ---- | ------------------------- | ----- | ----------- | ------------------------------------- |
| `src/Frontend/Components/ConfirmReplacePopup/ConfirmReplacePopup.tsx:154` | 154  | `NotificationPopup width` | `500` | popup width | `theme.spacing(125)` via `useTheme()` |

### _DONE_ DiffPopup

The `DiffEndIcon` component (24px undo/redo icons) no longer exists; the popup's transfer/undo controls are now styled inline in `DiffPopup.style.ts`. All px values converted via sx value callbacks around the theme spacing scale (4px unit: 0.25 units = 1px, 0.75 units = 3px, 5 units = 20px, 6 units = 24px, 8 units = 32px), applied to objects consumed through `sx={...}` on MUI components (PackageCard-style value-function precedent: `PackageCard.tsx:78`); a justified file-level `no-magic-numbers` disable covers the unit lattice (`Autocomplete.style.tsx` precedent). The popup's own viewport-calc size row is out of pixel scope and tracked in the viewport note:

| File                                                       | Line | Property                             | Value                                                        | Determines                                                   | Converted to                                                                                                                                                                                                                                   |
| ---------------------------------------------------------- | ---- | ------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/Frontend/Components/DiffPopup/DiffPopup.style.ts:13`  | 13   | `comparisonGrid.gridTemplateColumns` | `'minmax(0, 1fr) 32px minmax(0, 1fr)'`                       | fixed 32px middle (transfer) column                          | `({ spacing }) => `minmax(0, 1fr) ${spacing(8)} minmax(0, 1fr)``                                                                                                                                                                               |
| `src/Frontend/Components/DiffPopup/DiffPopup.style.ts:129` | 129  | `transferButton.borderRadius`        | `'3px'`                                                      | transfer button corner radius                                | `({ spacing }) => spacing(0.75)`                                                                                                                                                                                                               |
| `src/Frontend/Components/DiffPopup/DiffPopup.style.ts:131` | 131  | `transferButton.height`              | `'20px'`                                                     | transfer button height                                       | `({ spacing }) => spacing(5)`                                                                                                                                                                                                                  |
| `src/Frontend/Components/DiffPopup/DiffPopup.style.ts:133` | 133  | `transferButton.width`               | `'24px'`                                                     | transfer button width                                        | `({ spacing }) => spacing(6)`                                                                                                                                                                                                                  |
| `src/Frontend/Components/DiffPopup/DiffPopup.style.ts:150` | 150  | `attributionTypeUndo.border`         | `` `1px solid ...` ``                                        | undo button ring width                                       | `({ spacing }) => `${spacing(0.25)} solid ${OpossumColors.lightBlue}``                                                                                                                                                                         |
| `src/Frontend/Components/DiffPopup/DiffPopup.style.ts:153` | 153  | `attributionTypeUndo.height`/`width` | `24` / `24` (unitless)                                       | hover undo button size (height line 153, width line 159)     | `({ spacing }) => spacing(6)`                                                                                                                                                                                                                  |
| `src/Frontend/Components/DiffPopup/DiffPopup.tsx:109-111`  | 109  | `NotificationPopup width`/`height`   | `'min(1200px, calc(100vw - 32px))'` / `'calc(100vh - 64px)'` | popup size (pixel bounds + viewport calc; see viewport note) | px bounds converted: `min(${theme.spacing(300)}, calc(100vw - ${theme.spacing(8)}))` and `calc(100vh - ${theme.spacing(16)})` via `useTheme()` (→ byte-identical strings); the viewport terms (`100vw`/`100vh`) stay fluid — see viewport note |

### _DONE_ ErrorFallback

| File                                                              | Line | Property   | Value     | Determines              | Converted to                                                                                                |
| ----------------------------------------------------------------- | ---- | ---------- | --------- | ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| `src/Frontend/Components/ErrorFallback/ErrorFallback.style.ts:22` | 22   | `maxWidth` | `'600px'` | error box maximum width | `breakpoints.values.sm` (MUI's default `sm` breakpoint = 600px; the app theme doesn't override breakpoints) |

### _DONE_ ProcessPopup

Grid column track widths of the log grid (the `columnGap` itself is theme-scaled). Exact conversion: 6 units = 24px (severity icon), 20 units = 80px (timestamp):

| File                                                            | Line | Property                             | Value             | Determines                                                              | Converted to                                                                                                                                                                |
| --------------------------------------------------------------- | ---- | ------------------------------------ | ----------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/Frontend/Components/ProcessPopup/ProcessPopup.style.ts:21` | 21   | `GridLogDisplay gridTemplateColumns` | `'24px 80px 1fr'` | severity icon column (24px) and timestamp column (80px) of the log grid | `${theme.spacing(GRID_ICON_COLUMN_IN_THEME_UNITS)} ${theme.spacing(GRID_TIMESTAMP_COLUMN_IN_THEME_UNITS)} 1fr` (consts = 6 / 20 units; module-scope consts are lint-exempt) |

### _DONE_ FilterButton

The badge dot styles sit in a plain `style` prop (not sx), so the values are resolved via `useTheme()` at runtime; the dropdown width lands in `SelectMenu`'s `width` prop (`React.CSSProperties['width']`-typed). Exact conversions (4px unit: 2 units = 8px, 1 unit = 4px, 84 units = 336px); the `84`-unit call carries a justified `no-magic-numbers` disable:

| File                                                        | Line  | Property                          | Value             | Determines                   | Converted to                         |
| ----------------------------------------------------------- | ----- | --------------------------------- | ----------------- | ---------------------------- | ------------------------------------ |
| `src/Frontend/Components/FilterButton/FilterButton.tsx:85`  | 85–87 | badge `minWidth`/`width`/`height` | `'8px'` each      | active-filter badge dot size | `theme.spacing(2)` via `useTheme()`  |
| `src/Frontend/Components/FilterButton/FilterButton.tsx:88`  | 88–89 | badge `top` / `right`             | `'4px'` / `'4px'` | badge dot offset             | `theme.spacing(1)` via `useTheme()`  |
| `src/Frontend/Components/FilterButton/FilterButton.tsx:125` | 125   | `SelectMenu width`                | `336`             | filter dropdown width        | `theme.spacing(84)` via `useTheme()` |

### _DONE_ GroupedList

| File                                                          | Line | Property                      | Value    | Determines              | Converted to                                                                   |
| ------------------------------------------------------------- | ---- | ----------------------------- | -------- | ----------------------- | ------------------------------------------------------------------------------ |
| `src/Frontend/Components/GroupedList/GroupedList.style.ts:11` | 11   | `GroupContainer.height`       | `'20px'` | group header row height | `theme.spacing(5)` (-- 5 units = 20px)                                         |
| `src/Frontend/Components/GroupedList/GroupedList.style.ts:21` | 21   | `StyledLinearProgress.height` | `2`      | progress bar thickness  | `theme.spacing(0.5)` (= 2px; object styled form converted to a theme callback) |

### _DONE_ Icons

`resourceIcon` is a module-scope classes object spread into consumers' sx, so it uses sx value callbacks with the unit kept in a module const (const declarations are `no-magic-numbers`-exempt; 4.5 units = 18px). The `strokeWidth` row is kept as-is: it is SVG user-unit geometry (`stroke-width: 0.5` scales with the icon's viewBox, not a CSS px value), the same non-CSS-lattice category as other documented keeps (consumed-by-non-sx values, e.g. the recharts tooltip `contentStyle` style object — now a theme-parameterized factory, see the shared-styles table — or recharts geometry numerics) — mapping it through the spacing lattice would alter rendering semantics:

| File                                          | Line | Property              | Value    | Determines                       | Converted to                                         |
| --------------------------------------------- | ---- | --------------------- | -------- | -------------------------------- | ---------------------------------------------------- |
| `src/Frontend/Components/Icons/Icons.tsx:35`  | 35   | `resourceIcon.width`  | `'18px'` | resource tree icon size          | `spacing(RESOURCE_ICON_SIZE_IN_THEME_UNITS)` (4.5 u) |
| `src/Frontend/Components/Icons/Icons.tsx:36`  | 36   | `resourceIcon.height` | `'18px'` | resource tree icon size          | `spacing(RESOURCE_ICON_SIZE_IN_THEME_UNITS)` (4.5 u) |
| `src/Frontend/Components/Icons/Icons.tsx:300` | 300  | `strokeWidth`         | `0.5`    | classification icon stroke width | — kept (SVG user-unit geometry, see note)            |

### _DONE_ ImportDialog / MergeOpossumFilesDialog / SplitDialog

All three popups share the same width bounds (`75` units = 300px, `175` units = 700px, exact with the 4px spacing unit), resolved via `useTheme()`; the `80vw` popup `width` is viewport-based and out of pixel scope (see the viewport note). The unit call args carry justified `no-magic-numbers` disables:

| File                                                                              | Line     | Property                                | Value                 | Determines         | Converted to                               |
| --------------------------------------------------------------------------------- | -------- | --------------------------------------- | --------------------- | ------------------ | ------------------------------------------ |
| `src/Frontend/Components/ImportDialog/ImportDialog.tsx:114`                       | 114, 116 | `NotificationPopup minWidth`/`maxWidth` | `'300px'` / `'700px'` | popup width bounds | `theme.spacing(75)` / `theme.spacing(175)` |
| `src/Frontend/Components/MergeOpossumFilesDialog/MergeOpossumFilesDialog.tsx:152` | 152, 154 | `minWidth`/`maxWidth`                   | `'300px'` / `'700px'` | popup width bounds | `theme.spacing(75)` / `theme.spacing(175)` |
| `src/Frontend/Components/SplitDialog/SplitDialog.tsx:97`                          | 97, 99   | `minWidth`/`maxWidth`                   | `'300px'` / `'700px'` | popup width bounds | `theme.spacing(75)` / `theme.spacing(175)` |

### _DONE_ List

| File                                            | Line | Property                        | Value | Determines                    | Converted to                                                                                                                                                                                                               |
| ----------------------------------------------- | ---- | ------------------------------- | ----- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/Frontend/Components/List/List.style.ts:12` | 12   | `StyledLinearProgress.height`   | `2`   | progress bar thickness        | `theme.spacing(0.5)` (= 2px; object styled form converted to a theme callback; GroupedList precedent)                                                                                                                      |
| `src/Frontend/Components/List/List.tsx:24`      | 24   | `INFINITE_LIST_BOTTOM_OVERSCAN` | `600` | Virtuoso bottom overscan (px) | — kept: a behavioral virtualization parameter fed to react-virtuoso's `increaseViewportBy`, not a CSS/sx value; already a self-documenting named constant (`ReportTableItem`/`MIN_WINDOW_WIDTH` style, not a design token) |

### _DONE_ MultiResourcePicker

All values converted via the theme spacing scale inside the `styled()` theme callbacks (the file already carries a file-level `no-magic-numbers` disable). Exact unit mapping (4px unit): 0.25 = 1px, 1 = 4px, 6 = 24px, 7 = 28px, 8 = 32px, 8.5 = 34px (`8.5 * 4 === 34` exactly), 90 = 360px; `INDENT_PER_LEVEL` was already a theme-unit constant (6 units = 24px):

| File                                                                  | Line | Property               | Value                                                            | Determines                                        | Converted to                                                           |
| --------------------------------------------------------------------- | ---- | ---------------------- | ---------------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------- |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:12` | 12   | `INDENT_PER_LEVEL`     | `6` (theme units; was `'24px'` before the `spacing: 4` baseline) | tree indent per level                             | already a theme-unit constant (see the `calc()` marginLeft at line 55) |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:22` | 22   | `border`               | `'1px solid'`                                                    | resource tree container outline                   | `${theme.spacing(0.25)} solid`                                         |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:24` | 24   | `borderRadius`         | `'4px'`                                                          | resource tree container corner                    | `theme.spacing(1)`                                                     |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:25` | 25   | `height`               | `'360px'`                                                        | resource tree container height                    | `theme.spacing(90)`                                                    |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:35` | 35   | `minHeight`            | `'24px'`                                                         | selected paths container min height               | `theme.spacing(6)`                                                     |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:53` | 53   | `minHeight`            | `'32px'`                                                         | resource row min height                           | `theme.spacing(8)`                                                     |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:63` | 63   | `TreeNodeSpacer.width` | `'28px'`                                                         | spacer before expand button                       | `theme.spacing(7)` (object styled converted to theme callback)         |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:70` | 70   | `minWidth`             | `'34px'`                                                         | selection control size (square via `aspectRatio`) | `theme.spacing(8.5)` (object styled converted to theme callback)       |

### _DONE_ PackageCard

| File                                                      | Line | Property    | Value                                        | Determines             | Converted to                                                                                     |
| --------------------------------------------------------- | ---- | ----------- | -------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------ |
| `src/Frontend/Components/PackageCard/PackageCard.tsx:80`  | 80   | `boxShadow` | `theme.spacing(1)` (was `inset 4px 0 0 ...`) | selection stripe width | already converted (`({ theme }) => spacing(...)` value callback)                                 |
| `src/Frontend/Components/PackageCard/PackageCard.tsx:101` | 101  | `minWidth`  | `'24px'`                                     | confidence icon cell   | `spacing(OCCURRENCE_CHIP_MIN_WIDTH_IN_THEME_UNITS)` (6 units = 24px) in `classes.occurrenceChip` |

### _DONE_ PathBar

| File                                             | Line  | Property    | Value    | Determines              | Converted to                                                                                                            |
| ------------------------------------------------ | ----- | ----------- | -------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `src/Frontend/Components/PathBar/PathBar.tsx:45` | 45–46 | `minHeight` | `'24px'` | path bar row min height | `spacing(PATH_BAR_MIN_HEIGHT_IN_THEME_UNITS)` (6 units = 24px) in the `classes` object (now `satisfies SxProps<Theme>`) |

### _DONE_ PieChart

Legend styles are consumed as plain CSS (recharts custom legend `style={...}` props, not sx), so values resolve via the existing `useTheme()`; the recharts numeric geometry (`outerRadius`, legend `width`) goes through the BarChart-style `spacingPx` helper (`parseFloat(theme.spacing(units))`). Module-scope unit consts (exempt from `no-magic-numbers`): 3 units = 12px, 17.5 units = 70px (`17.5 * 4 === 70` exactly), 62.5 units = 250px (`62.5 * 4 === 250` exactly):

| File                                                | Line | Property                   | Value    | Determines           | Converted to                                                     |
| --------------------------------------------------- | ---- | -------------------------- | -------- | -------------------- | ---------------------------------------------------------------- |
| `src/Frontend/Components/PieChart/PieChart.tsx:62`  | 62   | `legendTextStyle.fontSize` | `'12px'` | legend text font     | `theme.typography.caption.fontSize` (BarChart precedent, 12px)   |
| `src/Frontend/Components/PieChart/PieChart.tsx:43`  | 43   | `borderRadius`             | `'6px'`  | legend swatch corner | `theme.spacing(LEGEND_SWATCH_RADIUS_IN_THEME_UNITS)` (1.5 units) |
| `src/Frontend/Components/PieChart/PieChart.tsx:44`  | 44   | swatch `height`            | `'12px'` | legend swatch size   | `theme.spacing(LEGEND_SWATCH_SIZE_IN_THEME_UNITS)` (3 units)     |
| `src/Frontend/Components/PieChart/PieChart.tsx:45`  | 45   | swatch `width`             | `'12px'` | legend swatch size   | `theme.spacing(LEGEND_SWATCH_SIZE_IN_THEME_UNITS)` (3 units)     |
| `src/Frontend/Components/PieChart/PieChart.tsx:84`  | 84   | `RcPie outerRadius`        | `70`     | pie radius           | `spacingPx(PIE_RADIUS_IN_THEME_UNITS)` (17.5 units = 70px)       |
| `src/Frontend/Components/PieChart/PieChart.tsx:124` | 124  | `RcLegend width`           | `250`    | legend column width  | `spacingPx(LEGEND_WIDTH_IN_THEME_UNITS)` (62.5 units = 250px)    |

### _DONE_ ProgressBar

Exact conversions via the theme spacing scale (0.5 units = 2px, 5 units = 20px), inline in the `classes` object (consumed through `sx` on MUI components) with a justified file-level `no-magic-numbers` disable (`Autocomplete.style.tsx` precedent):

| File                                                     | Line | Property | Value           | Determines        | Converted to                                                |
| -------------------------------------------------------- | ---- | -------- | --------------- | ----------------- | ----------------------------------------------------------- |
| `src/Frontend/Components/ProgressBar/ProgressBar.tsx:34` | 34   | `border` | `2px solid ...` | bar outline width | `spacing(0.5)` (0.5 units = 2px) + `${OpossumColors.white}` |
| `src/Frontend/Components/ProgressBar/ProgressBar.tsx:36` | 36   | `height` | `'20px'`        | bar height        | `spacing(5)` (5 units = 20px)                               |

### _DONE_ ProjectMetadataTable

Font sizes read through the shared theme typography variants (sx value callbacks `(theme: Theme) => theme.typography....fontSize`; the object is `satisfies SxProps<Theme>`) — no magic-number disable needed, the values live in `src/Frontend/app-typography.ts` (`body3` = 13px, `dense` = 11px, typed via module augmentation):

| File                                                                       | Line | Property                | Value | Determines               | Converted to                                                            |
| -------------------------------------------------------------------------- | ---- | ----------------------- | ----- | ------------------------ | ----------------------------------------------------------------------- |
| `src/Frontend/Components/ProjectMetadataTable/ProjectMetadataTable.tsx:21` | 21   | `firstColumn.fontSize`  | `13`  | metadata table head font | `theme.typography.body3.fontSize` (= 13px, `app-typography.ts` variant) |
| `src/Frontend/Components/ProjectMetadataTable/ProjectMetadataTable.tsx:27` | 27   | `secondColumn.fontSize` | `11`  | metadata table body font | `theme.typography.dense.fontSize` (= 11px, `app-typography.ts` variant) |

### _DONE_ ProjectStatisticsPopup

Pixels converted via the theme spacing scale through the component's `useTheme()`/sx value callbacks; the popup-minimum unit count lives in the module-scope const `POPUP_MIN_SIZE_IN_THEME_UNITS` (line 43), the remaining unit args are inline `spacing(...)` values covered by the file's `no-magic-numbers` handling (137.5 units = 550px, 55 units = 220px, 110 units = 440px, 2.5 units = 10px — all FP-exact, e.g. `137.5 * 4 === 550`); the viewport (`95vw`/`95vh`, `85vw`/`75vh`) and percentage (`'47%'`) parts remain out of pixel scope (see the viewport/percentage note):

| File                                                                                | Line | Property                   | Value                           | Determines                      | Converted to                                                                                       |
| ----------------------------------------------------------------------------------- | ---- | -------------------------- | ------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------- |
| `src/Frontend/Components/ProjectStatisticsPopup/ProjectStatisticsPopup.tsx:98`      | 98   | `NotificationPopup width`  | `'min(95vw, max(550px, 85vw))'` | popup width (contains `550px`)  | `` `min(95vw, max(${theme.spacing(POPUP_MIN_SIZE_IN_THEME_UNITS)}, 85vw))` `` (px floor converted) |
| `src/Frontend/Components/ProjectStatisticsPopup/ProjectStatisticsPopup.tsx:99`      | 99   | `NotificationPopup height` | `'min(95vh, max(550px, 75vh))'` | popup height (contains `550px`) | `` `min(95vh, max(${theme.spacing(POPUP_MIN_SIZE_IN_THEME_UNITS)}, 75vh))` `` (px floor converted) |
| `src/Frontend/Components/ProjectStatisticsPopup/ProjectStatisticsPopup.tsx:303`     | 303  | chart grid `minHeight`     | `'220px'`                       | chart card minimum height       | `spacing(55)` (55 units = 220px)                                                                   |
| `src/Frontend/Components/ProjectStatisticsPopup/ProjectStatisticsPopup.tsx:304`     | 304  | chart grid `minWidth`      | `'440px'`                       | chart card minimum width        | `spacing(110)` (110 units = 440px)                                                                 |
| `src/Frontend/Components/ProjectStatisticsPopup/ProjectStatisticsPopup.tsx:305`     | 305  | chart grid `height`        | `'47%'`                         | chart card height (percentage)  | — kept (percentage, see viewport/percentage note)                                                  |
| `src/Frontend/Components/ProjectStatisticsPopup/ProjectStatisticsPopup.style.ts:13` | 13   | `borderRadius`             | `'10px'`                        | popup corner radius             | `theme.spacing(2.5)` (= 10px; file-level `no-magic-numbers` disable in place)                      |

### _DONE_ ReportView column configuration / ReportTableItem / ReportTableHeader

The `COLUMN_WIDTHS` bucket map was already a genuinely reused constant (9 config entries); only its values changed form — theme-unit numbers resolved at the consumers via sx value callbacks (`theme.spacing(config.width)`; no new constants, no lint disables). Exact mapping (4px unit): 10 = 40px, 25 = 100px, 80 = 320px, 115 = 460px:

| File                                                                 | Line   | Property                                    | Value                                  | Determines                                                                                              | Converted to                                                                                                                                                                                                              |
| -------------------------------------------------------------------- | ------ | ------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/Frontend/Components/ReportView/TableConfig.tsx:19`              | 19–24  | `COLUMN_WIDTHS_IN_THEME_UNITS` bucket sizes | `'40px' / '100px' / '320px' / '460px'` | width buckets (`verySmall`–`wide`) for all report table columns (applied as cell `minWidth`/`maxWidth`) | `10 / 25 / 80 / 115` units; `TableConfig.width: number`; resolved via `spacing()` at `ReportTableItem.tsx:169–170` and `ReportTableHeader.tsx:46–47`                                                                      |
| `src/Frontend/Components/ReportTableItem/ReportTableItem.tsx:43`     | 43     | `REPORT_VIEW_ROW_HEIGHT`                    | `150`                                  | report view row height                                                                                  | — kept (px): behavioral row-height constant fed to Virtuoso's `fixedItemHeight`/`defaultItemHeight` and a raw numeric cell height in `ReportView.tsx` (same non-design-token category as `INFINITE_LIST_BOTTOM_OVERSCAN`) |
| `src/Frontend/Components/ReportTableItem/ReportTableItem.tsx:45`     | 45     | `PADDING_PX`                                | `10`                                   | row padding in px (4 × `PADDING`)                                                                       | kept as the px lens (`4 × PADDING` = 4 × 2.5 units = 10px) under the file-level disable (the `4` baseline is needed precisely because `REPORT_VIEW_ROW_HEIGHT` stays a px constant)                                       |
| `src/Frontend/Components/ReportTableItem/ReportTableItem.tsx:52`     | 52     | `tableData.height`                          | `` `${150 - 2*10}px` -> `130px` ``     | table cell height                                                                                       | derived numeric (130 = sx raw px, single-source from `REPORT_VIEW_ROW_HEIGHT` − 2 × padding; px string template removed)                                                                                                  |
| `src/Frontend/Components/ReportTableItem/ReportTableItem.tsx:60`     | 60     | `iconTableData.height`                      | `130px` (derived)                      | icon cell height                                                                                        | derived numeric (130 raw px, single-source; the adjacent `py: PADDING` remains a theme unit)                                                                                                                              |
| `src/Frontend/Components/ReportTableItem/ReportTableItem.tsx:73`     | 73–76  | `borderRight`/`borderBottom`                | `1px solid ...`                        | cell borders                                                                                            | `spacing(0.25)` solid (= 1px) in sx value callbacks                                                                                                                                                                       |
| `src/Frontend/Components/ReportTableItem/ReportTableItem.tsx:79`     | 79–80  | icon `width`/`height`                       | `'15px'`                               | table icon size                                                                                         | `spacing(3.75)` (= 15px) value callbacks                                                                                                                                                                                  |
| `src/Frontend/Components/ReportTableItem/ReportTableItem.tsx:84`     | 84–115 | `border` (8 icon variants)                  | `2px ... solid`                        | icon badge outlines                                                                                     | `spacing(0.5)` (= 2px) inside `<unit> <color> solid` callbacks for all variants                                                                                                                                           |
| `src/Frontend/Components/ReportTableHeader/ReportTableHeader.tsx:18` | 18     | `headerRow.boxShadow`                       | `'0px 2px 1px -1px ...'`               | header row elevation shadow geometry                                                                    | `theme.shadows[1]` (= MUI elevation-1; verified byte-equal geometry — `createShadow(0,2,1,-1,...)`) — only insignificant whitespace after commas differs                                                                  |
| `src/Frontend/Components/ReportTableHeader/ReportTableHeader.tsx:21` | 21     | `borderRight`                               | `1px solid ...`                        | header cell border                                                                                      | `spacing(0.25)` solid (= 1px) value callback                                                                                                                                                                              |

Both files now carry justified file-level `no-magic-numbers` disables (0.25/0.5/3.75 unit args plus the 4-baseline math); the previous line-level comment was absorbed. `Icons.tsx`'s `IconProps.sx` was upgraded from bare `SxProps` to `SxProps<Theme>` so the callback-valued class members typecheck inside the spread icon styles.

### _DONE_ ResizePanels

CSS values converted via the theme spacing scale in `styled()` theme callbacks (exact mapping, 4px unit: 6 = 24px, 30 = 120px, 36 = 144px; file-level `no-magic-numbers` disable already present). `HEADER_HEIGHT = 32` is deliberately kept as a px constant — it feeds pixel arithmetic in `ResizePanels.tsx` (`effectiveHeight <= HEADER_HEIGHT`, `containerHeight - HEADER_HEIGHT - 1`) and a numeric `minHeight` system prop; the CSS `Header` height/minHeight stay derived from it, so converting it to spacing units would desynchronize the collapse logic from the layout (same behavioral-constant category as `INFINITE_LIST_BOTTOM_OVERSCAN` / `REPORT_VIEW_ROW_HEIGHT`):

| File                                                             | Line  | Property                                       | Value         | Determines                   | Converted to                                                   |
| ---------------------------------------------------------------- | ----- | ---------------------------------------------- | ------------- | ---------------------------- | -------------------------------------------------------------- |
| `src/Frontend/Components/ResizePanels/ResizePanels.style.ts:15`  | 15    | `HEADER_HEIGHT`                                | `32`          | panel header height          | — kept (px behavioral constant, see note above)                |
| `src/Frontend/Components/ResizePanels/ResizePanels.style.ts:19`  | 19–22 | button `width`/`minWidth`/`height`/`minHeight` | `'24px'` each | header icon button size      | `theme.spacing(6)` (object styled converted to theme callback) |
| `src/Frontend/Components/ResizePanels/ResizePanels.style.ts:56`  | 56    | `Search.height`                                | `'24px'`      | search field height          | `theme.spacing(6)`                                             |
| `src/Frontend/Components/ResizePanels/ResizePanels.style.ts:101` | 101   | `StyledInputBase.maxWidth`                     | `'144px'`     | search input max width       | `theme.spacing(36)`                                            |
| `src/Frontend/Components/ResizePanels/ResizePanels.style.ts:102` | 102   | `StyledInputBase.height`                       | `'24px'`      | search input height          | `theme.spacing(6)`                                             |
| `src/Frontend/Components/ResizePanels/ResizePanels.style.ts:111` | 111   | input `width`                                  | `'120px'`     | collapsed search input width | `value ? theme.spacing(30) : '0px'`                            |
| `src/Frontend/Components/ResizePanels/ResizePanels.style.ts:113` | 113   | input `width` (focused)                        | `'120px'`     | focused search input width   | `theme.spacing(30)`                                            |

### _DONE_ ResizableBox

Handle styles are plain-CSS objects (re-resizable `handleStyles` props, not sx), so values resolve via `useTheme()`; the off-lattice unit args carry a justified file-level `no-magic-numbers` disable. Exact scaling (4px unit: 1.5 units = 6px handle thickness, 0.75 units = 3px handle offset; the latter passed negated via `-${theme.spacing(0.75)}`):

| File                                                       | Line  | Property                        | Value              | Determines                    | Converted to                                     |
| ---------------------------------------------------------- | ----- | ------------------------------- | ------------------ | ----------------------------- | ------------------------------------------------ |
| `src/Frontend/Components/ResizableBox/ResizableBox.tsx:31` | 31–32 | right handle `width`/`right`    | `'6px'` / `'-6px'` | resize handle size and offset | `theme.spacing(1.5)` / `-${theme.spacing(1.5)}`  |
| `src/Frontend/Components/ResizableBox/ResizableBox.tsx:34` | 34    | left handle `width`/`left`      | `'6px'` / `'-3px'` | resize handle size and offset | `theme.spacing(1.5)` / `-${theme.spacing(0.75)}` |
| `src/Frontend/Components/ResizableBox/ResizableBox.tsx:35` | 35    | top handle `height`             | `'6px'`            | resize handle size            | `theme.spacing(1.5)`                             |
| `src/Frontend/Components/ResizableBox/ResizableBox.tsx:38` | 38    | bottom handle `height`/`bottom` | `'6px'` / `'-3px'` | resize handle size and offset | `theme.spacing(1.5)` / `-${theme.spacing(0.75)}` |

### _DONE_ SelectMenu

All px values converted via the theme spacing scale; the inner `styled()` base component (menu paper/arrow) resolves the values through `useTheme()` (its slotProps sx objects cannot reach a `theme` hook otherwise), the icon/component callbacks destructure `theme` directly (the file already carries a file-level `no-magic-numbers` disable). Exact mapping (4px unit): 0.5 = 2px, 2 = 8px, 2.5 = 10px, 5 = 20px, 6 = 24px, 9.5 = 38px; the `center: '50%'` variant is a percentage (out of pixel scope). The `SelectMenu.tsx` row was converted in the AuditingOptions pass (shared `AUDITING_OPTION_ICON_THEME_SIZE` token):

| File                                                          | Line    | Property                         | Value                 | Determines                                                                                                                                                                           | Converted to                                                                          |
| ------------------------------------------------------------- | ------- | -------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `src/Frontend/Components/SelectMenu/SelectMenu.style.tsx:50`  | 50      | `filter` drop-shadow             | `0px 2px 8px ...`     | paper shadow geometry                                                                                                                                                                | `drop-shadow(0px ${spacing(0.5)} ${spacing(2)} rgba(0, 0, 0, 0.32))` template literal |
| `src/Frontend/Components/SelectMenu/SelectMenu.style.tsx:58`  | 58      | anchor arrow `left`              | `'24px'`              | anchor arrow horizontal offset                                                                                                                                                       | `theme.spacing(6)` (= 24px)                                                           |
| `src/Frontend/Components/SelectMenu/SelectMenu.style.tsx:59`  | 59      | anchor arrow `right`             | `'calc(100% - 24px)'` | anchor arrow horizontal offset (right-anchored variant)                                                                                                                              | `calc(100% - ${theme.spacing(6)})`                                                    |
| `src/Frontend/Components/SelectMenu/SelectMenu.style.tsx:62`  | 62–63   | anchor arrow `width`/`height`    | `10` / `10`           | anchor arrow size                                                                                                                                                                    | `theme.spacing(2.5)` (= 10px) values                                                  |
| `src/Frontend/Components/SelectMenu/SelectMenu.style.tsx:96`  | 96–97   | `StyledCheckIcon width`/`height` | `'20px'` / `'20px'`   | check icon size                                                                                                                                                                      | `theme.spacing(5)` (= 20px); `theme` destructured in the `visible` callback           |
| `src/Frontend/Components/SelectMenu/SelectMenu.style.tsx:107` | 107     | `MenuItemContainer.height`       | `'38px'`              | menu item row height                                                                                                                                                                 | `theme.spacing(9.5)` (= 38px)                                                         |
| `src/Frontend/Components/SelectMenu/SelectMenu.tsx:114`       | 114–115 | `ListItemIcon minWidth`          | `'19px !important'`   | see below: converted to the shared `AUDITING_OPTION_ICON_THEME_SIZE` token (see _DONE_ AuditingOptions); `!important` kept to keep overriding MUI's default `ListItemIcon` min-width | already converted (shared size token, see note above)                                 |

### _DONE_ SortButton

| File                                                    | Line | Property           | Value | Determines          | Converted to                                   |
| ------------------------------------------------------- | ---- | ------------------ | ----- | ------------------- | ---------------------------------------------- |
| `src/Frontend/Components/SortButton/SortButton.tsx:119` | 119  | `SelectMenu width` | `200` | sort dropdown width | `theme.spacing(50)` via `useTheme()` (= 200px) |

### _DONE_ SwitchableProgressBar

| File                                                                         | Line | Property | Value     | Determines         | Converted to                                                                     |
| ---------------------------------------------------------------------------- | ---- | -------- | --------- | ------------------ | -------------------------------------------------------------------------------- |
| `src/Frontend/Components/SwitchableProgressBar/SwitchableProgressBar.tsx:30` | 30   | `width`  | `'150px'` | progress bar width | `spacing(37.5)` (= 150px) value callback in `classes.select` (justified disable) |

### _DONE_ TextBox

Values converted via sx value callbacks in `classes` (`({ spacing }: Theme) => spacing(...)`; the object is now `satisfies SxProps<Theme>`, matching the file's existing @mui/system `Theme` typing; file-level `no-magic-numbers` disable already present). The label font reads the shared `body3` typography variant (`theme.typography.body3.fontSize`, defined in `src/Frontend/app-typography.ts`, typed via module augmentation). Exact spacing mapping (4px unit): 0.25 = 1px. The two `borderRadius: '0px'` rows became unitless `borderRadius: 0` (zero is the lattice's 0; the square-corner semantics are intentional and the CSS is unchanged):

| File                                             | Line | Property                         | Value    | Determines            | Converted to                                                            |
| ------------------------------------------------ | ---- | -------------------------------- | -------- | --------------------- | ----------------------------------------------------------------------- |
| `src/Frontend/Components/TextBox/TextBox.tsx:26` | 26   | input `borderRadius`             | `'0px'`  | input corner (square) | converted to unitless `borderRadius: 0` (identical CSS)                 |
| `src/Frontend/Components/TextBox/TextBox.tsx:32` | 32   | label `fontSize`                 | `'13px'` | floating label font   | `theme.typography.body3.fontSize` (= 13px, `app-typography.ts` variant) |
| `src/Frontend/Components/TextBox/TextBox.tsx:50` | 50   | focused fieldset `borderWidth`   | `'1px'`  | focus outline width   | `spacing(0.25)` (= 1px) value callback                                  |
| `src/Frontend/Components/TextBox/TextBox.tsx:56` | 56   | highlighted input `borderRadius` | `'0px'`  | input corner (square) | converted to unitless `borderRadius: 0` (identical CSS)                 |

### _DONE_ Toaster

| File                                             | Line | Property | Value     | Determines            | Converted to                                                                  |
| ------------------------------------------------ | ---- | -------- | --------- | --------------------- | ----------------------------------------------------------------------------- |
| `src/Frontend/Components/Toaster/Toaster.tsx:29` | 29   | `width`  | `'340px'` | toast container width | `theme.spacing(85)` (= 340px) value callback, justified disable (85-unit arg) |

### _DONE_ TopBar

All values converted via sx value callbacks in `classes` (`({ spacing }: Theme) => spacing(...)`, `as const satisfies SxProps<Theme>`), with a justified file-level `no-magic-numbers` disable. Exact mapping (4px unit): 4.5 = 18px, 9 = 36px, 20 = 80px, 0.5 = 2px:

| File                                           | Line  | Property                        | Value               | Determines                                      | Converted to                                 |
| ---------------------------------------------- | ----- | ------------------------------- | ------------------- | ----------------------------------------------- | -------------------------------------------- |
| `src/Frontend/Components/TopBar/TopBar.tsx:31` | 31    | `root.height`                   | `'36px'`            | top bar height                                  | `spacing(9)` (= 36px) value callback         |
| `src/Frontend/Components/TopBar/TopBar.tsx:36` | 36–37 | open-file icon `width`/`height` | `'18px'` / `'18px'` | open-file icon box (does not fill the 36px bar) | `spacing(4.5)` (= 18px) value callbacks      |
| `src/Frontend/Components/TopBar/TopBar.tsx:53` | 53    | `viewButtons.width`             | `'80px'`            | Audit/Report toggle button width                | `spacing(20)` (= 80px) value callback        |
| `src/Frontend/Components/TopBar/TopBar.tsx:56` | 56    | `viewButtons.border`            | `2px ... solid`     | toggle button outline width                     | `${spacing(0.5)} ... solid` (= 2px) callback |
| `src/Frontend/Components/TopBar/TopBar.tsx:64` | 64    | selected toggle `border`        | `2px ... solid`     | selected toggle outline width                   | `${spacing(0.5)} ... solid` (= 2px) callback |

### _DONE_ ValidationDisplay

All values converted via sx value callbacks on the MUI components (`({ spacing }: Theme) => spacing(...)`), with a justified file-level `no-magic-numbers` disable. Exact mapping (4px unit): 4 = 16px, 4.5 = 18px, 6 = 24px:

| File                                                                 | Line  | Property                     | Value    | Determines                | Converted to                            |
| -------------------------------------------------------------------- | ----- | ---------------------------- | -------- | ------------------------- | --------------------------------------- |
| `src/Frontend/Components/ValidationDisplay/ValidationDisplay.tsx:39` | 39    | container `minHeight`        | `24`     | validation row min height | `spacing(6)` (= 24px) value callback    |
| `src/Frontend/Components/ValidationDisplay/ValidationDisplay.tsx:49` | 49    | warning icon `fontSize`      | `16`     | warning icon size         | `spacing(4)` (= 16px) value callback    |
| `src/Frontend/Components/ValidationDisplay/ValidationDisplay.tsx:64` | 64–65 | expand icon `height`/`width` | `'18px'` | expand/collapse icon size | `spacing(4.5)` (= 18px) value callbacks |

### _DONE_ ValueFilterAutocomplete

| File                                                                                          | Line | Property | Value    | Determines                                     | Converted to                                                                                                                                                                       |
| --------------------------------------------------------------------------------------------- | ---- | -------- | -------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/Frontend/Components/FilterButton/ValueFilterAutocomplete/ValueFilterAutocomplete.tsx:41` | 41   | `height` | `'38px'` | filter trigger height (matches 38px menu rows) | `spacing(9.5)` (= 38px) value callback, justified disable — same 9.5 units as the SelectMenu `MenuItemContainer.height` (9.5 = 38px), keeping the height coupling documented above |

### _DONE_ VirtualizedTree

CSS values converted via sx value callbacks in `classes` (`({ spacing }: Theme) => spacing(...)`); the indent constants became theme-unit constants resolved numerically at runtime (they feed pixel arithmetic for the spacer `style.width`, so they use the BagrChart-style `spacingPx` helper — `parseFloat(theme.spacing(units))`; multiplier arithmetic over `resource.level` stays integer-exact). Exact mapping (4px unit): 3 = 12px, 4 = 16px, 5 = 20px; a justified file-level `no-magic-numbers` disable covers the unit args and the pre-existing `opacity` fallback (its former line comment was absorbed):

| File                                                                                     | Line  | Property                        | Value               | Determines                           | Converted to                                                                           |
| ---------------------------------------------------------------------------------------- | ----- | ------------------------------- | ------------------- | ------------------------------------ | -------------------------------------------------------------------------------------- |
| `src/Frontend/Components/VirtualizedTree/VirtualizedTreeNode/VirtualizedTreeNode.tsx:17` | 17    | `INDENT_PER_DEPTH_LEVEL`        | `12`                | indent per tree depth level (px)     | `INDENT_PER_DEPTH_LEVEL_IN_THEME_UNITS = 3` units, resolved via `spacingPx` (12px)     |
| `src/Frontend/Components/VirtualizedTree/VirtualizedTreeNode/VirtualizedTreeNode.tsx:18` | 18    | `SIMPLE_FOLDER_EXTRA_INDENT`    | `16`                | extra indent for simple folders (px) | `SIMPLE_FOLDER_EXTRA_INDENT_IN_THEME_UNITS = 4` units, resolved via `spacingPx` (16px) |
| `src/Frontend/Components/VirtualizedTree/VirtualizedTreeNode/VirtualizedTreeNode.tsx:28` | 28    | `listNode.height`               | `'20px'`            | tree node row height                 | `spacing(5)` (= 20px) value callback                                                   |
| `src/Frontend/Components/VirtualizedTree/VirtualizedTreeNode/VirtualizedTreeNode.tsx:40` | 40–41 | clickable icon `width`/`height` | `'16px'` / `'20px'` | node icon button box                 | `spacing(4)` (= 16px) / `spacing(5)` (= 20px) value callbacks                          |
| `src/Frontend/Components/VirtualizedTree/VirtualizedTreeNode/VirtualizedTreeNode.tsx:54` | 54–55 | expand icon `width`/`height`    | `'16px'` / `'20px'` | expand/collapse icon box             | `spacing(4)` (= 16px) / `spacing(5)` (= 20px) value callbacks                          |
| `src/Frontend/Components/VirtualizedTree/VirtualizedTreeNode/VirtualizedTreeNode.tsx:66` | 66    | selected indicator `height`     | `'20px'`            | selection highlight height           | `spacing(5)` (= 20px) value callback                                                   |

### _DONE_ ResourceBrowser

| File                                                                                     | Line | Property | Value           | Determines                    | Converted to                                                            |
| ---------------------------------------------------------------------------------------- | ---- | -------- | --------------- | ----------------------------- | ----------------------------------------------------------------------- |
| `src/Frontend/Components/ResourceBrowser/LinkedResourcesTree/LinkedResourcesTree.tsx:74` | 74   | `border` | `1px solid ...` | linked resources tree outline | `theme.spacing(0.25)` solid via `useTheme()` (= 1px; justified disable) |

### _DONE_ AttributionCountPerSourcePerLicenseTableHead

| File                                                                                                                                                                | Line | Property       | Value                     | Determines       | Converted to                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | -------------- | ------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| `src/Frontend/Components/AttributionCountPerSourcePerLicenseTable/AttributionCountPerSourcePerLicenseTableHead/AttributionCountPerSourcePerLicenseTableHead.tsx:19` | 19   | `borderRight`  | `'2px solid lightgray'`   | head cell border | `spacing(0.5)` (= 2px) value callback (justified disable; `classes` now `satisfies SxProps<Theme>`)                |
| `src/Frontend/Components/AttributionCountPerSourcePerLicenseTable/AttributionCountPerSourcePerLicenseTableHead/AttributionCountPerSourcePerLicenseTableHead.tsx:23` | 23   | `borderBottom` | `'1.5px solid lightgray'` | head cell border | `spacing(0.375)` (= 1.5px) value callback (justified disable; the `lightgray` color literal itself is not a pixel) |

### _DONE_ ToggleHiddenSignalsButton

| File                                                                                                                | Line | Property | Value    | Determines               | Converted to                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------- | ---- | -------- | -------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `src/Frontend/Components/AttributionPanels/SignalsPanel/ToggleHiddenSignalsButton/ToggleHiddenSignalsButton.tsx:36` | 36   | `height` | `'24px'` | toggle button row height | `({ spacing }: Theme) => spacing(6)` (= 24px) value callback, justified disable (`@mui/system` `Theme`, matching the system `Box` import) |

### _DONE_ AttributionDetails

| File                                                                   | Line | Property                  | Value | Determines            | Converted to                                                                                                                                                          |
| ---------------------------------------------------------------------- | ---- | ------------------------- | ----- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/Frontend/Components/AttributionDetails/AttributionDetails.tsx:38` | 38   | `loadingIndicator.height` | `2`   | loading bar thickness | `({ spacing }: Theme) => spacing(0.5)` (= 2px) value callbacks, justified disable (`classes` now `satisfies SxProps<Theme>`; GroupedList/List progress-bar precedent) |

### _DONE_ PackagesPanel

`ALERT_CONTAINER_HEIGHT = 24` and `TABS_CONTAINER_HEIGHT = 30` stay as **px behavioral/layout constants** (same category as `HEADER_HEIGHT`/`REPORT_VIEW_ROW_HEIGHT`): they feed the `contentHeight` `calc()` string arithmetic in `PackagesPanel.tsx` alongside numeric CSS heights (`height: open ? ALERT_CONTAINER_HEIGHT : 0`, `height: TABS_CONTAINER_HEIGHT`), so routing them through the spacing lattice would desync the header math (`30 + 24 = 54px header band`) from the collapsed heights. The elevation shadows are now the exact MUI token (`theme.shadows[1]` — verified previously to be the same geometry as the copied literal), the indicator thickness converted on-lattice, and the ad-hoc `42px` panel-header offset derived from a theme callback ('10.5 units = 42px', justified disable):

| File                                                                                | Line   | Property                 | Value                       | Determines                            | Converted to                                                                                                                                                                                                                           |
| ----------------------------------------------------------------------------------- | ------ | ------------------------ | --------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/Frontend/Components/AttributionPanels/PackagesPanel/PackagesPanel.style.ts:12` | 12     | `ALERT_CONTAINER_HEIGHT` | `24`                        | alert strip height (px)               | — kept (px behavioral constant, see note above)                                                                                                                                                                                        |
| `src/Frontend/Components/AttributionPanels/PackagesPanel/PackagesPanel.style.ts:13` | 13     | `TABS_CONTAINER_HEIGHT`  | `30`                        | tabs bar height (px)                  | — kept (px behavioral constant, see note above)                                                                                                                                                                                        |
| `src/Frontend/Components/AttributionPanels/PackagesPanel/PackagesPanel.style.ts:25` | 25, 53 | `boxShadow`              | `'0px 2px 1px -1px ...'`    | elevation shadow geometry             | `theme.shadows[1]` in `({ theme })` callbacks (both ActionBarContainer and Tabs)                                                                                                                                                       |
| `src/Frontend/Components/AttributionPanels/PackagesPanel/PackagesPanel.style.ts:59` | 59     | tabs indicator `height`  | `'1px'`                     | tab underline thickness               | `theme.spacing(0.25)`, justified disable (0.25 units = 1px)                                                                                                                                                                            |
| `src/Frontend/Components/AttributionPanels/PackagesPanel/PackagesPanel.tsx:638`     | 638    | `contentHeight` calc     | `'42px'` inside `calc(...)` | panel header offset in content height | `${theme.spacing(10.5)}` (= 42px) via `useTheme()` inside the template literal; the `${TABS_CONTAINER_HEIGHT}px` / `${ALERT_CONTAINER_HEIGHT}px` segments keep feeding from their px constants, preserving this variable-part behavior |

### Note: viewport- and percentage-based sizing

These values are hardcoded but not pixel-based, so they are listed separately:

| File                                                                              | Line  | Property               | Value                                                                 | Determines                                              |
| --------------------------------------------------------------------------------- | ----- | ---------------------- | --------------------------------------------------------------------- | ------------------------------------------------------- |
| `src/Frontend/Components/App/App.style.ts:30`                                     | 30    | `ViewContainer.height` | `'100vh'`                                                             | app viewport height                                     |
| `src/Frontend/Components/Autocomplete/Listbox/Listbox.style.ts:27`                | 27    | `maxHeight`            | `'40vh'`                                                              | autocomplete listbox max height                         |
| `src/Frontend/Components/ImportDialog/ImportDialog.tsx:112`                       | 112   | `width`                | `'80vw'`                                                              | popup width                                             |
| _DONE_ `src/Frontend/Components/DiffPopup/DiffPopup.tsx:109`                      | 109   | `width`                | `` `min(${theme.spacing(300)}, calc(100vw - ${theme.spacing(8)}))` `` | popup width (px cap converted; viewport calc fluid)     |
| _DONE_ `src/Frontend/Components/DiffPopup/DiffPopup.tsx:111`                      | 111   | `height`               | `` `calc(100vh - ${theme.spacing(16)})` ``                            | popup height (px margin converted; viewport calc fluid) |
| `src/Frontend/Components/SplitDialog/SplitDialog.tsx:95`                          | 95    | `width`                | `'80vw'`                                                              | popup width                                             |
| `src/Frontend/Components/MergeOpossumFilesDialog/MergeOpossumFilesDialog.tsx:150` | 150   | `width`                | `'80vw'`                                                              | popup width                                             |
| `src/Frontend/Components/ProjectStatisticsPopup/ProjectStatisticsPopup.tsx:94`    | 94–95 | width/height bounds    | `95vw` / `85vw` / `75vh`                                              | popup size bounds                                       |
| `src/Frontend/Components/ProjectStatisticsPopup/ProjectStatisticsPopup.tsx:301`   | 301   | `height`               | `'47%'`                                                               | chart card height                                       |
| `src/Frontend/Components/PieChart/PieChart.tsx:63`                                | 63    | legend text `width`    | `'95%'`                                                               | legend text width                                       |

## Impact Analysis

### 1. **Design Inconsistency**

- Spacing values are scattered without a coherent system (0px, 1px, 2px, 3px, 4px, 5px, 6px, 7px, 8px, 10px, 12px, 16px, 20px, 200px)
- No visual rhythm or mathematical relationship between spacing values
- Hard to maintain consistent UI across the application

### 2. **Theme Inflexibility**

- Pixel values don't adapt to different themes (light/dark, high contrast)
- MUI theme spacing scale (`theme.spacing(1)`, `theme.spacing(2)`, etc.) is not utilized
- Components cannot easily respond to theme changes without major refactoring

### 3. **Responsive Design Limitations**

- Fixed pixel values break layout on different screen sizes
- No media query support for spacing adjustments
- Mobile/responsive friendly spacing requires component-specific overrides

### 4. **Accessibility Concerns**

- Inconsistent spacing may affect touch target sizes
- Difficult to systematically adjust for accessibility requirements
- Contrast and spacing relationship not formally defined

### 5. **Maintenance Burden**

- Any design system update requires searching and replacing across 45+ files
- No central place to verify spacing consistency
- Risk of introducing visual regressions during updates

### 6. **Code Quality Issues**

- Violates the principle of design tokens / spacing scale
- Makes global theming changes difficult
- Creates technical debt that accumulates over time

## Recommendations

### Short-term (1-2 sprints) — _Immediate action_

1. ~~**Add `spacing: 2` to existing theme**~~ — **Done**: `spacing: 4` is configured at `src/Frontend/Components/App/App.style.ts:37` (4px baseline, no new files). Theme is app-wide via `StyledEngineProvider` + `ThemeProvider` wrapping the application root in `AppContainer.tsx` (moved from `App.tsx` so that root-level siblings like `Toaster`, which is rendered outside `App`, also resolve `theme.spacing` correctly).

2. **Verify typecheck passes** — Run `yarn typecheck` to confirm no errors

3. **Begin component migration** — Start replacing hardcoded pixel values with MUI `sx` prop shorthand in low-risk components:
   - `padding: '8px'` → `sx={{ p: 2 }}`
   - `marginBottom: '16px'` → `sx={{ mb: 4 }}`
   - `gap: '8px'` → `sx={{ gap: 2 }}`

### Medium-term (3-5 sprints)

1. **Complete component migration** — Systematically replace remaining hardcoded pixel values with theme scale values
   - Use `sx` prop: `sx={{ p: 4, mb: 3 }}` instead of `padding: '16px', marginBottom: '12px'`
   - Update styled components: `styled('div')(({ theme }) => ({ padding: theme.spacing(2) }))` instead of inline pixel values or dead shorthand keys (see pitfall 1)

2. **Evaluate custom spacing values** — Address outliers not on MUI's scale (status after the latest migration pass):
   - `8.5px` in `TextBox.tsx` — now expressed as sx theme units (`paddingBlock: 2.125`, `paddingY: props.multiline ? 0 : 2.125`); only `scrollPaddingBlock` keeps the raw `'8.5px'` literal because it is not an sx-handled key
   - `calc()` expressions in `TextBox.tsx:203–207` — converted to sx theme-unit math (`3.5 + n * 5`)
   - The remaining `calc()` outliers (`Autocomplete.style.tsx:57` — theme-scaled calc) may remain as-is with documentation; the shared-styles chart-tooltip padding now lives in the _Shared styles and theme_ table

3. **Consider design token export** — If Figma integration is desired, export the MUI spacing scale as design tokens

### Long-term

1. **Formal design system integration** — If/when the design system evolves, the spacing scale is already in place via MUI theme

2. ~~**Automated enforcement**~~ — **Done**: ESLint enforcement via two `no-restricted-syntax` selectors in `eslint.config.mjs` (alongside the pre-existing `styled()`-inside-functions rule). They flag string literals containing `px` in spacing properties — longhand keys (`padding`, `margin`, `gap`, `rowGap`, `columnGap`, `scrollPadding`, and their `Top/Right/Bottom/Left/Block/Inline` variants) and MUI sx shorthand keys (`p`, `pt`, `pr`, `pb`, `pl`, `px`, `py`, `m`, `mt`, `mr`, `mb`, `ml`, `mx`, `my`) — with messages pointing at `theme.spacing` and this report. Enforcement runs through the existing pipelines with no extra wiring: `yarn lint-check` in CI and the lint-staged `eslint` step on staged `*.{ts,tsx}` in the pre-commit hook. Scope notes (deliberate v1 limitations):
   - Unitless numbers in spacing keys are not flagged (sx numbers are theme units, i.e. the desired pattern); only px strings are.
   - Exact `'0px'` values are exempt (zero is the lattice's 0, see scope conventions).
   - px values reached through constant indirection are not visible to the selector (e.g. TextBox's `INPUT_VERTICAL_PADDING = '8.5px'` → `scrollPaddingBlock`), same residual category as the kept px constants.
   - Template literals (`` `${x}px` `` interpolations) and dimension keys (`width`/`height`/`border`/`borderRadius`/`fontSize`) are out of scope; dimensions migrate differently (see the section notes).
   - The repo currently lints clean under the rule (verified: zero findings), matching the migrated state documented in the tables above.

## Migration Path Example

### Before (hardcoded)

```tsx
// Before - scattered pixel values
padding: '20px 20px 0 20px',
gap: '16px',
margin: '8px',
marginTop: '20px',
```

### After (MUI theme — Phase 1)

```tsx
// After — using existing MUI theme spacing scale
// `spacing: 4` is already configured in App.style.ts (line 37)

// Using MUI sx prop with theme-aware values
sx={{
  px: 4,                  // 16px (spacing(4) with theme spacing: 4)
  py: 5,                  // 20px (spacing(5))
  gap: 2,                 // 8px (spacing(2))
  mt: 4,                  // 16px (spacing(4))
}}

// Or with styled components using theme values — remember that
// shorthand keys are dead code inside styled() objects (pitfall 1)
const StyledContainer = styled('div')(({ theme }) => ({
  padding: theme.spacing(4),   // 16px
  gap: theme.spacing(2),       // 8px
  marginTop: theme.spacing(4), // 16px
}));
```

## Conclusion

**The technical debt of 95+ hardcoded pixel spacing values has been resolved.**

The entire frontend (69+ components, app-wide theming) already uses MUI with a `StyledEngineProvider` + `ThemeProvider` wrapping the application root in `AppContainer.tsx` (this is where `App` and `Toaster` are composed, so both sit inside the provider). The theme is defined in `src/Frontend/Components/App/App.style.ts` and already configures `spacing: 4` (line 37), so the standardized spacing scale is available across all components. All spacing and dimension values documented in this report are now converted; the few deliberately kept outliers are documented inline per section ("— kept" rows), in the "Evaluate custom spacing values" recommendation, and in the residual table at the bottom, including the conversions that the rebase had reset.

**Why this works:**

- MUI's `spacing: 4` uses a 4px baseline: `spacing(1)=4px`, `spacing(2)=8px`, `spacing(3)=12px`, etc.
- All 95+ hardcoded values map cleanly to the scale
- No new files, no breaking changes, no architecture overhaul required
- `sx` prop shorthand (`sx={{ p: 2, mb: 4 }}`) replaces `padding: '8px'`, `marginBottom: '16px'` everywhere

**Priority:** **Maintenance** — `spacing: 4` is in place in `App.style.ts`; the documented spacing and dimension values are migrated, and ESLint enforcement (see Long-term #2) prevents px strings in spacing properties from re-accumulating. Run `yarn typecheck` after future spacing changes to verify.

## Residual Hardcoded Pixel Values (found in latest verification pass)

The following hardcoded pixel values were found in a later verification pass against the current codebase and are not covered by the section tables above (which are all migrated). They remain open conversion candidates unless marked as keeps:

| File                                                                         | Line          | Property                         | Value                      | Determines                                                                                                                                                                                                             | Status                                                                                                                                                                                 |
| ---------------------------------------------------------------------------- | ------------- | -------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/Frontend/Components/UpdateAppPopup/UpdateAppPopup.tsx:31`               | 31            | `NotificationPopup width`        | `600`                      | update-app popup width                                                                                                                                                                                                 | open — candidate `theme.spacing(150)` (= 600px) via `useTheme()` (same pattern as the other popup widths)                                                                              |
| `src/Frontend/Components/AttributionDetails/ButtonRow/ButtonRow.tsx:287`     | 287, 336, 441 | `MuiCircularProgress size`       | `16`                       | in-button pending spinner size (three occurrences)                                                                                                                                                                     | open — candidate `theme.spacing(4)` (= 16px) via `useTheme()`                                                                                                                          |
| `src/Frontend/Components/Spinner/Spinner.tsx:10`                             | 10            | `DEFAULT_SIZE`                   | `12`                       | default spinner size (fed to `MuiCircularProgress size`; affects default callers, e.g. `UpdateAppPopup.tsx`, `LogDisplay.tsx`)                                                                                         | open — candidate `theme.spacing(3)` (= 12px)                                                                                                                                           |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:105`            | 105           | Popper `flip` modifier `padding` | `64`                       | positioning offset controlling where the autocomplete listbox flips                                                                                                                                                    | open — behavioral Popper.js positioning parameter (same non-sx-consumed category as recharts geometry numerics)                                                                        |
| `src/Frontend/Components/AttributionDetails/ButtonRow/ButtonRow.style.ts:21` | 21            | `border`                         | `'1px solid currentColor'` | disabled-state border ring on the attribution FAB buttons                                                                                                                                                              | open — candidate `` `${theme.spacing(0.25)} solid currentColor` ``                                                                                                                     |
| `src/Frontend/Components/PackageCard/PackageCard.tsx:25`                     | 25            | `PACKAGE_CARD_HEIGHT`            | `40`                       | package card height; also feeds `PACKAGE_CARD_LIST_ITEM_HEIGHT = PACKAGE_CARD_HEIGHT + 1` (line 27), used as Virtuoso `unloadedItemHeight` by `CardList`, `AttributionCardList`, `SignalsList`, and `AttributionsList` | — kept candidate: behavioral virtual-list geometry constant (same category as `REPORT_VIEW_ROW_HEIGHT`); any conversion must keep the CSS height and the virtual-list estimate in sync |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:48`             | 48            | input row `borderRadius`         | `'0px'`                    | square corners on the autocomplete input row                                                                                                                                                                           | kept — no-op zero value; square-corner semantics intentional (TextBox precedent documents its identical `'0px'` rows)                                                                  |
