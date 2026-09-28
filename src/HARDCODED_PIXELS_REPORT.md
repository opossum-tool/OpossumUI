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

All rows converted, including the `MuiInputBase` minHeight override (`theme.spacing(9)`). Font sizes read through the **shared theme typography**: the variants live in **`src/Frontend/app-typography.ts`** (`typographyVariants`, including the new `body3` = 13px and `dense` = 11px variants) and are registered in `App.style.ts` via `typography: typographyVariants`. The two non-standard variants are typed via **module augmentation** of MUI's `TypographyVariants`/`TypographyVariantsOptions` (declared in `app-typography.ts`), so `theme.typography.body3` / `theme.typography.dense` are natively typed everywhere — no casts, no helper accessor. Consumers read them as sx value callbacks (`(theme: Theme) => theme.typography.body3.fontSize`) since the shared objects are spread into consumers' sx (Icons/PathBar/ProjectMetadataTable precedent) so function values resolve at runtime. The remaining off-lattice spacing/dimension value (`maxWidth`) resolves through an sx value callback (`({ spacing }: Theme) => spacing(...)`, `satisfies SxProps<Theme>`; the file carries a justified file-level `no-magic-numbers` disable). **Corner radii no longer run through the spacing scale**: `App.style.ts` augments MUI's `Shape`/`ShapeOptions` with named radius variants — `borderRadiusSmall` (3px), `borderRadiusDefault` (4px, matching the MUI built-in `shape.borderRadius` which is pinned to 4), `borderRadiusMedium` (6px), `borderRadiusLarge` (10px) — so radii consumers read `theme.shape.*` (see the per-section rows below and the `ResizePanels` search field). **Border widths and line thicknesses also left the spacing scale**: `shared-styles.ts` exports plain px-literal tokens — `borderThin` (1px), `borderMedium` (2px), `borderTableHead` (1.5px, one-off for the license-table head underline) — consumed directly in sx/styled/plain-CSS with no theme indirection, so changing the spacing base cannot scale borders, badge outlines, progress bars, or tab indicators (see the per-section rows below and the residual-table ButtonRow row). **Icon sizes are tokens too**: `shared-styles.ts` exports px-literal icon tokens — `baseIconSize` (15px), `resourceIconSize` (18px), `auditingOptionIconSize` (19px), `checkIconSize` (20px), `warningIconFontSize` (16px), `occurrenceChipMinWidth` (24px) — plus the numeric `spinnerDefaultSize` (12) and `buttonSpinnerSize` (16), so changing the spacing base cannot scale icons either (see the per-section rows below and the spinner rows in the residual table). **Popup size bounds are the latest tokens**: the shared `popupMinWidth` ('300px') / `popupMaxWidth` ('700px') from `shared-styles.ts` feed the Import/Merge/Split dialogs, while each popup's own fixed sizes (ConfirmAttributionActionPopup 580/100/400px, ConfirmReplacePopup 500px, UpdateAppPopup 600px, ProjectStatisticsPopup 550px floors, DiffPopup 1200/32/64px) live as component-local px-literal consts — so changing the spacing base cannot resize any popup (see the per-section rows below). **Behavioral parameters are numeric consts, no theme at all**: virtualization overscan (`LIST_OVERSCAN = 20`, alongside the pre-existing `INFINITE_LIST_BOTTOM_OVERSCAN = 600`), the force-top listbox cap (`FORCE_TOP_PADDING = 16`) and Popper flip inset (`FLIP_PADDING = 64`), chart geometry (`MARGIN_LEFT/RIGHT/BOTTOM`, `X_AXIS_LABEL_OFFSET`, `PIE_RADIUS`, `LEGEND_WIDTH`), and tree indents (`INDENT_PER_DEPTH_LEVEL`, `SIMPLE_FOLDER_EXTRA_INDENT`) are component-local numeric px consts — the `parseFloat(theme.spacing(...))` bridges and their unit consts are gone, so chart radii, tree indentation, and scroll behavior no longer follow the spacing base (see the BarChart/PieChart/VirtualizedTree/Autocomplete sections and the residual-table Popper row). The recharts tooltip object was converted into a **theme-parameterized factory** `chartTooltipContentStyle(theme)` (raw `React.CSSProperties` can not resolve function values; it is consumed via recharts `contentStyle` — not sx); both consumers (`BarChart.tsx:64`, `PieChart.tsx:93`) call it with their in-scope `useTheme()` result. Exact spacing mapping (4px unit): 0.75 = 3px, 50 = 200px — all FP-exact integers/binary-exact halves.

| File                                          | Line | Property                                      | Value               | Determines                                                                                                                                                     | Converted to                                                                                                                     |
| --------------------------------------------- | ---- | --------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `src/Frontend/shared-styles.ts:57`            | 57   | `baseIcon.width`                              | `'15px'`            | size of all icons using `baseIcon`/`clickableIcon`                                                                                                             | `baseIconSize` (= 15px, px-literal icon token; callback removed)                                                                 |
| `src/Frontend/shared-styles.ts:58`            | 58   | `baseIcon.height`                             | `'15px'`            | icon size (see above)                                                                                                                                          | `baseIconSize` (= 15px, px-literal icon token; callback removed)                                                                 |
| `src/Frontend/shared-styles.ts:79`            | 79   | `tableClasses.head.fontSize`                  | `13`                | table head font size                                                                                                                                           | `theme.typography.body3.fontSize` (= 13px, `app-typography.ts` variant)                                                          |
| `src/Frontend/shared-styles.ts:84`            | 84   | `tableClasses.body.fontSize`                  | `11`                | table body font size                                                                                                                                           | `theme.typography.dense.fontSize` (= 11px, `app-typography.ts` variant)                                                          |
| `src/Frontend/shared-styles.ts:86`            | 86   | `tableClasses.body.maxWidth`                  | `'200px'`           | max table cell width                                                                                                                                           | `spacing(50)` (= 200px) value callback                                                                                           |
| `src/Frontend/shared-styles.ts:92`            | 92   | `tableClasses.footer.fontSize`                | `12`                | table footer font size                                                                                                                                         | `theme.typography.caption.fontSize` (= 12px, `app-typography.ts` variant)                                                        |
| `src/Frontend/shared-styles.ts:132`           | 132  | `treeItemClasses.matchesFilters.borderRadius` | `'3px'`             | corner radius of the "matches filters" highlight                                                                                                               | `shape.borderRadiusSmall` (= 3px) value callback                                                                                 |
| `src/Frontend/shared-styles.ts:149`           | 149  | `chartTooltipContentStyle.fontSize`           | `'12px'`            | recharts tooltip font size (factory parameterized by theme)                                                                                                    | `theme.typography.caption.fontSize` (= 12px, BarChart tickStyle precedent)                                                       |
| `src/Frontend/shared-styles.ts:151`           | 151  | `chartTooltipContentStyle.padding`            | `3`                 | recharts tooltip inner padding — raw `React.CSSProperties` (`contentStyle`), not sx-processed; **now spacing-scaled** via the factory (from the residual note) | `theme.spacing(0.75)` (= 3px) inside the factory                                                                                 |
| `src/Frontend/shared-styles.ts:153`           | 153  | `chartTooltipContentStyle.borderRadius`       | `'4px'`             | recharts tooltip corner radius                                                                                                                                 | `theme.shape.borderRadiusDefault` (= 4px) inside the factory                                                                     |
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

All rows converted via the theme spacing scale in `styled()` theme callbacks, except `AutocompleteUtil.tsx` (module-scope `occurrenceChipClass`, `satisfies SxProps<Theme>`; numbers in module-scope const class members are exempt from `no-magic-numbers`). The floating label font reads the shared `body3` typography variant (`theme.typography.body3.fontSize`, defined in `src/Frontend/app-typography.ts`, typed via module augmentation). Unit mapping (4px spacing unit): 0.25 units = 1px, 3 units = 12px, 3.5 units = 14px, 4 units = 16px, 5 units = 20px, 6 units = 24px, 7 units = 28px, 9.1675 units = 36.67px (`4 * 9.1675 === 36.67` exactly). Row 57 was already theme-scaled in code — only the stale Value description was corrected. Two behavioral px values found in a post-rebase verification pass (the `renderPopper` top-padding and the Listbox Virtuoso overscan) were later re-expressed as **component-local numeric consts** (`FORCE_TOP_PADDING = 16`, `LIST_OVERSCAN = 20` — the behavioral-parameters pass superseded the inline `parseFloat(theme.spacing(...))` resolution, and both files' `useTheme()` hooks existed solely for these values and are gone) — see the last two table rows:

| File                                                              | Line | Property                       | Value                   | Determines                                                                                                                                                     | Converted to                                                                                                             |
| ----------------------------------------------------------------- | ---- | ------------------------------ | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:43`  | 43   | input label `fontSize`         | `'13px'`                | floating label font                                                                                                                                            | `theme.typography.body3.fontSize` (= 13px, `app-typography.ts` variant)                                                  |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:44`  | 44   | label `top`                    | `'1px'`                 | label vertical offset                                                                                                                                          | `theme.spacing(0.25)`                                                                                                    |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:53`  | 53   | `MuiInputBase-root minHeight`  | `'36.67px'`             | input row minimum height                                                                                                                                       | `theme.spacing(9.1675)`                                                                                                  |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:57`  | 57   | `paddingRight`                 | `calc(12px + N * 28px)` | width reserved for end adornments                                                                                                                              | already `calc(theme.spacing(3) + N * theme.spacing(7))` (theme-scaled px `calc()`)                                       |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:84`  | 84   | focused fieldset `borderWidth` | `'1px'`                 | focus outline width                                                                                                                                            | `borderThin` (px-literal border token, see shared-styles section)                                                        |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:120` | 120  | `EndAdornmentContainer.right`  | `'14px'`                | end-adornment inset from right edge                                                                                                                            | `theme.spacing(3.5)`                                                                                                     |
| `src/Frontend/Components/Autocomplete/AutocompleteUtil.tsx:14`    | 14   | `minWidth`                     | `'24px'`                | end-adornment icon wrapper (`occurrenceChipClass`, used at lines 34 and 60)                                                                                    | shared `occurrenceChipMinWidth` (24px) px-literal token from `shared-styles.ts` (deduped with the PackageCard chip spot) |
| `src/Frontend/Components/Autocomplete/Autocomplete.tsx:327`       | 327  | `renderPopper` local `padding` | `16`                    | gap subtracted from the anchor's `getBoundingClientRect().top` to cap the force-top listbox height (flows into the `min(${maxHeight}px, ...)` calc in Listbox) | local const `FORCE_TOP_PADDING = 16` (numeric px, behavioral positioning parameter; `useTheme()` gone)                   |

| `src/Frontend/Components/Autocomplete/Listbox/Listbox.tsx:126` | 126, 168 | `increaseViewportBy` | `20` | Virtuoso viewport overscan (behavioral virtualization parameter, same category as `INFINITE_LIST_BOTTOM_OVERSCAN`) | local const `LIST_OVERSCAN = 20` (numeric px, both call sites; `useTheme()` gone) |

### _DONE_ AuditingOptions

| File                                                                                  | Line | Property         | Value               | Determines                                                                                  | Converted to                                                                                                                                         |
| ------------------------------------------------------------------------------------- | ---- | ---------------- | ------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/Frontend/Components/AttributionForm/AuditingOptions/AuditingOptions.util.tsx:47` | 47   | `width`/`height` | `'19px'` / `'19px'` | all five satisfaction icons (`satisfactionIconClass` used at lines 276, 281, 285, 289, 294) | `auditingOptionIconSize` (= 19px, px-literal icon token from `shared-styles.ts`) in module-scope `satisfactionIconClass` (line 47; callback removed) |

The size token lives in `src/Frontend/shared-styles.ts` (`auditingOptionIconSize` = '19px') and is shared with the SelectMenu icon column (see below).

### _DONE_ BarChart

The chart plot-area margins and the x-axis label offset are **component-local numeric px consts** (`MARGIN_LEFT = 8`, `MARGIN_RIGHT = 10`, `MARGIN_BOTTOM = 4`, `X_AXIS_LABEL_OFFSET = 3`) — behavior/report-geometry parameters consumed numerically by recharts, deliberately decoupled from the spacing base (the earlier `*_IN_THEME_UNITS` consts and the `spacingPx`/`parseFloat(theme.spacing())` resolution are gone). `useTheme()` remains for the legitimate theme reads — the `tick` typography and `chartTooltipContentStyle(theme)`:

| File                                               | Line  | Property             | Value                               | Determines                     | Converted to                                                                                                             |
| -------------------------------------------------- | ----- | -------------------- | ----------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `src/Frontend/Components/BarChart/BarChart.tsx:38` | 38    | `tickStyle.fontSize` | `'12px'`                            | axis tick labels               | `theme.typography.caption.fontSize` (caption is 12px, defined in `app-typography.ts`)                                    |
| `src/Frontend/Components/BarChart/BarChart.tsx:48` | 48–52 | `RcBarChart margin`  | `{ left: 8, right: 10, bottom: 4 }` | chart plot-area margins        | local consts `MARGIN_LEFT = 8` / `MARGIN_RIGHT = 10` / `MARGIN_BOTTOM = 4` (numeric px; recharts `margin` needs numbers) |
| `src/Frontend/Components/BarChart/BarChart.tsx:57` | 57    | `RcLabel offset`     | `-3` (recharts px offset)           | x-axis label vertical position | local const `X_AXIS_LABEL_OFFSET = 3` (= 3px), passed negated                                                            |

### _DONE_ CardList

| File                                               | Line | Property | Value                             | Determines         | Converted to                                                                                                                                                                                                  |
| -------------------------------------------------- | ---- | -------- | --------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/Frontend/Components/CardList/CardList.tsx:32` | 32   | `border` | `'1px solid rgba(0, 0, 0, 0.12)'` | card outline width | width `borderThin` (px-literal border token from `shared-styles.ts`; the `BORDER_WIDTH_IN_THEME_UNITS` const is gone), color `theme.palette.divider` via `useTheme()` (= MUI's default `rgba(0, 0, 0, 0.12)`) |

### _DONE_ ConfirmAttributionActionPopup

All three values are now **component-local px-literal constants** (the popup-bounds pass superseded their earlier `theme.spacing` conversions): `POPUP_WIDTH = '580px'` and `MIN_CONTENT_HEIGHT = '100px'` in the `.tsx`, `TREE_CONTAINER_HEIGHT = '400px'` in the `.style.ts` — no theme indirection, so changing the spacing base cannot resize the popup. The `useTheme()` hook and its `no-magic-numbers` disables are gone, and the "unit tests render without `ThemeProvider`" caveat no longer applies (px literals render identically in tests and production):

| File                                                                                              | Line | Property                  | Value     | Determines                     | Converted to                                                                                           |
| ------------------------------------------------------------------------------------------------- | ---- | ------------------------- | --------- | ------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `src/Frontend/Components/ConfirmAttributionActionPopup/ConfirmAttributionActionPopup.tsx:111`     | 111  | `NotificationPopup width` | `'580px'` | popup width                    | local const `POPUP_WIDTH` (px literal; the `useTheme()` call is gone)                                  |
| `src/Frontend/Components/ConfirmAttributionActionPopup/ConfirmAttributionActionPopup.tsx:142`     | 142  | `minHeight`               | `'100px'` | content box minimum height     | local const `MIN_CONTENT_HEIGHT` (px literal)                                                          |
| `src/Frontend/Components/ConfirmAttributionActionPopup/ConfirmAttributionActionPopup.style.ts:14` | 14   | `height`                  | `'400px'` | resource tree container height | local const `TREE_CONTAINER_HEIGHT` (px literal; the styled() callback stays for the `spacing(2)` gap) |

### _DONE_ ConfirmReplacePopup

Converted to a component-local px-literal constant (`POPUP_WIDTH = '500px'`) in the popup-bounds pass — same superseding note as _DONE_ ConfirmAttributionActionPopup above (the ThemeProvider test caveat is obsolete here too):

| File                                                                      | Line | Property                  | Value     | Determines  | Converted to                                              |
| ------------------------------------------------------------------------- | ---- | ------------------------- | --------- | ----------- | --------------------------------------------------------- |
| `src/Frontend/Components/ConfirmReplacePopup/ConfirmReplacePopup.tsx:154` | 154  | `NotificationPopup width` | `'500px'` | popup width | local const `POPUP_WIDTH` (px literal; `useTheme()` gone) |

### _DONE_ DiffPopup

The `DiffEndIcon` component (24px undo/redo icons) no longer exists; the popup's transfer/undo controls are now styled inline in `DiffPopup.style.ts`. All px values converted via sx value callbacks around the theme spacing scale (4px unit: 5 units = 20px, 6 units = 24px, 8 units = 32px), applied to objects consumed through `sx={...}` on MUI components (PackageCard-style value-function precedent: `PackageCard.tsx:78`); the transfer button corner radius reads the named `theme.shape.borderRadiusSmall` token and the undo-button ring width the `borderThin` border token (see the shared-styles section). A justified file-level `no-magic-numbers` disable covers the unit lattice (`Autocomplete.style.tsx` precedent). The popup's own viewport-calc size row keeps its fluid viewport terms — its px bounds are now component-local consts (`MAX_WIDTH`/`VIEWPORT_MARGIN`/`VIEWPORT_VERTICAL_MARGIN`, see the row below):

| File                                                       | Line | Property                             | Value                                                        | Determines                                                   | Converted to                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------- | ---- | ------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/Frontend/Components/DiffPopup/DiffPopup.style.ts:13`  | 13   | `comparisonGrid.gridTemplateColumns` | `'minmax(0, 1fr) 32px minmax(0, 1fr)'`                       | fixed 32px middle (transfer) column                          | `({ spacing }) => `minmax(0, 1fr) ${spacing(8)} minmax(0, 1fr)``                                                                                                                                                                                             |
| `src/Frontend/Components/DiffPopup/DiffPopup.style.ts:129` | 129  | `transferButton.borderRadius`        | `'3px'`                                                      | transfer button corner radius                                | `({ shape }) => shape.borderRadiusSmall`                                                                                                                                                                                                                     |
| `src/Frontend/Components/DiffPopup/DiffPopup.style.ts:131` | 131  | `transferButton.height`              | `'20px'`                                                     | transfer button height                                       | `({ spacing }) => spacing(5)`                                                                                                                                                                                                                                |
| `src/Frontend/Components/DiffPopup/DiffPopup.style.ts:133` | 133  | `transferButton.width`               | `'24px'`                                                     | transfer button width                                        | `({ spacing }) => spacing(6)`                                                                                                                                                                                                                                |
| `src/Frontend/Components/DiffPopup/DiffPopup.style.ts:150` | 150  | `attributionTypeUndo.border`         | `` `1px solid ...` ``                                        | undo button ring width                                       | `` `${borderThin} solid ${OpossumColors.lightBlue}` `` (px-literal border token, see shared-styles section)                                                                                                                                                  |
| `src/Frontend/Components/DiffPopup/DiffPopup.style.ts:153` | 153  | `attributionTypeUndo.height`/`width` | `24` / `24` (unitless)                                       | hover undo button size (height line 153, width line 159)     | `({ spacing }) => spacing(6)`                                                                                                                                                                                                                                |
| `src/Frontend/Components/DiffPopup/DiffPopup.tsx:109-111`  | 109  | `NotificationPopup width`/`height`   | `'min(1200px, calc(100vw - 32px))'` / `'calc(100vh - 64px)'` | popup size (pixel bounds + viewport calc; see viewport note) | px bounds are the local consts `MAX_WIDTH = '1200px'`, `VIEWPORT_MARGIN = '32px'`, `VIEWPORT_VERTICAL_MARGIN = '64px'` (popup-bounds pass; the `useTheme()` call and disables are gone); the viewport terms (`100vw`/`100vh`) stay fluid — see viewport note |

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

| File                                                          | Line | Property                      | Value    | Determines              | Converted to                                                                                                     |
| ------------------------------------------------------------- | ---- | ----------------------------- | -------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `src/Frontend/Components/GroupedList/GroupedList.style.ts:11` | 11   | `GroupContainer.height`       | `'20px'` | group header row height | `theme.spacing(5)` (-- 5 units = 20px)                                                                           |
| `src/Frontend/Components/GroupedList/GroupedList.style.ts:21` | 21   | `StyledLinearProgress.height` | `2`      | progress bar thickness  | `borderMedium` (2px px-literal border token, see shared-styles section; the styled() theme callback was dropped) |

### _DONE_ Icons

`resourceIcon` is a module-scope classes object spread into consumers' sx; its width/height read the `resourceIconSize` px-literal token (18px, see the shared-styles section). The `strokeWidth` row is kept as-is: it is SVG user-unit geometry (`stroke-width: 0.5` scales with the icon's viewBox, not a CSS px value), the same non-CSS-lattice category as other documented keeps (consumed-by-non-sx values, e.g. the recharts tooltip `contentStyle` style object — now a theme-parameterized factory, see the shared-styles table — or recharts geometry numerics) — mapping it through the spacing lattice would alter rendering semantics:

| File                                          | Line | Property              | Value    | Determines                       | Converted to                                                         |
| --------------------------------------------- | ---- | --------------------- | -------- | -------------------------------- | -------------------------------------------------------------------- |
| `src/Frontend/Components/Icons/Icons.tsx:35`  | 35   | `resourceIcon.width`  | `'18px'` | resource tree icon size          | `resourceIconSize` (= 18px, px-literal icon token; callback removed) |
| `src/Frontend/Components/Icons/Icons.tsx:36`  | 36   | `resourceIcon.height` | `'18px'` | resource tree icon size          | `resourceIconSize` (= 18px, px-literal icon token; callback removed) |
| `src/Frontend/Components/Icons/Icons.tsx:300` | 300  | `strokeWidth`         | `0.5`    | classification icon stroke width | — kept (SVG user-unit geometry, see note)                            |

### _DONE_ ImportDialog / MergeOpossumFilesDialog / SplitDialog

All three popups share the same width bounds — now the **shared px-literal tokens** `popupMinWidth` ('300px') / `popupMaxWidth` ('700px') from `shared-styles.ts` (the popup-bounds pass superseded the earlier `spacing(75)`/`spacing(175)` conversions, removing each dialog's `useTheme()` hook and its two `no-magic-numbers` disables); the `80vw` popup `width` is viewport-based and out of pixel scope (see the viewport note):

| File                                                                              | Line     | Property                                | Value                 | Determines         | Converted to                                                                            |
| --------------------------------------------------------------------------------- | -------- | --------------------------------------- | --------------------- | ------------------ | --------------------------------------------------------------------------------------- |
| `src/Frontend/Components/ImportDialog/ImportDialog.tsx:114`                       | 114, 116 | `NotificationPopup minWidth`/`maxWidth` | `'300px'` / `'700px'` | popup width bounds | `popupMinWidth` / `popupMaxWidth` (shared px-literal tokens, see shared-styles section) |
| `src/Frontend/Components/MergeOpossumFilesDialog/MergeOpossumFilesDialog.tsx:152` | 152, 154 | `minWidth`/`maxWidth`                   | `'300px'` / `'700px'` | popup width bounds | `popupMinWidth` / `popupMaxWidth` (shared px-literal tokens)                            |
| `src/Frontend/Components/SplitDialog/SplitDialog.tsx:97`                          | 97, 99   | `minWidth`/`maxWidth`                   | `'300px'` / `'700px'` | popup width bounds | `popupMinWidth` / `popupMaxWidth` (shared px-literal tokens)                            |

### _DONE_ List

| File                                            | Line | Property                        | Value | Determines                    | Converted to                                                                                                                                                                                                               |
| ----------------------------------------------- | ---- | ------------------------------- | ----- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/Frontend/Components/List/List.style.ts:12` | 12   | `StyledLinearProgress.height`   | `2`   | progress bar thickness        | `borderMedium` (2px px-literal border token, see shared-styles section; the styled() theme callback was dropped)                                                                                                           |
| `src/Frontend/Components/List/List.tsx:24`      | 24   | `INFINITE_LIST_BOTTOM_OVERSCAN` | `600` | Virtuoso bottom overscan (px) | — kept: a behavioral virtualization parameter fed to react-virtuoso's `increaseViewportBy`, not a CSS/sx value; already a self-documenting named constant (`ReportTableItem`/`MIN_WINDOW_WIDTH` style, not a design token) |

### _DONE_ MultiResourcePicker

All values converted via the theme spacing scale inside the `styled()` theme callbacks (the file already carries a file-level `no-magic-numbers` disable). Exact unit mapping (4px unit): 1 = 4px, 6 = 24px, 7 = 28px, 8 = 32px, 8.5 = 34px (`8.5 * 4 === 34` exactly), 90 = 360px; `INDENT_PER_LEVEL` was already a theme-unit constant (6 units = 24px); the container border width is the `borderThin` border token (see the shared-styles section):

| File                                                                  | Line | Property               | Value                                                            | Determines                                        | Converted to                                                               |
| --------------------------------------------------------------------- | ---- | ---------------------- | ---------------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------- |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:12` | 12   | `INDENT_PER_LEVEL`     | `6` (theme units; was `'24px'` before the `spacing: 4` baseline) | tree indent per level                             | already a theme-unit constant (see the `calc()` marginLeft at line 55)     |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:22` | 22   | `border`               | `'1px solid'`                                                    | resource tree container outline                   | `${borderThin} solid` (px-literal border token, see shared-styles section) |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:24` | 24   | `borderRadius`         | `'4px'`                                                          | resource tree container corner                    | `theme.shape.borderRadiusDefault`                                          |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:25` | 25   | `height`               | `'360px'`                                                        | resource tree container height                    | `theme.spacing(90)`                                                        |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:35` | 35   | `minHeight`            | `'24px'`                                                         | selected paths container min height               | `theme.spacing(6)`                                                         |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:53` | 53   | `minHeight`            | `'32px'`                                                         | resource row min height                           | `theme.spacing(8)`                                                         |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:63` | 63   | `TreeNodeSpacer.width` | `'28px'`                                                         | spacer before expand button                       | `theme.spacing(7)` (object styled converted to theme callback)             |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:70` | 70   | `minWidth`             | `'34px'`                                                         | selection control size (square via `aspectRatio`) | `theme.spacing(8.5)` (object styled converted to theme callback)           |

### _DONE_ PackageCard

| File                                                      | Line | Property    | Value                                        | Determines             | Converted to                                                                                          |
| --------------------------------------------------------- | ---- | ----------- | -------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------- |
| `src/Frontend/Components/PackageCard/PackageCard.tsx:80`  | 80   | `boxShadow` | `theme.spacing(1)` (was `inset 4px 0 0 ...`) | selection stripe width | already converted (`({ theme }) => spacing(...)` value callback)                                      |
| `src/Frontend/Components/PackageCard/PackageCard.tsx:101` | 101  | `minWidth`  | `'24px'`                                     | confidence icon cell   | shared `occurrenceChipMinWidth` (24px) px-literal token (deduped with the AutocompleteUtil chip spot) |

### _DONE_ PathBar

| File                                             | Line  | Property    | Value    | Determines              | Converted to                                                                                                            |
| ------------------------------------------------ | ----- | ----------- | -------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `src/Frontend/Components/PathBar/PathBar.tsx:45` | 45–46 | `minHeight` | `'24px'` | path bar row min height | `spacing(PATH_BAR_MIN_HEIGHT_IN_THEME_UNITS)` (6 units = 24px) in the `classes` object (now `satisfies SxProps<Theme>`) |

### _DONE_ PieChart

Legend styles are consumed as plain CSS (recharts custom legend `style={...}` props, not sx) — the swatch size is the px-literal const `LEGEND_SWATCH_SIZE = '12px'`; the chart geometry (`outerRadius`, legend `width`) is consumed _numerically_ by recharts and lives in the local numeric consts `PIE_RADIUS = 70` / `LEGEND_WIDTH = 250` (the `spacingPx`/`parseFloat` resolution and the `*_IN_THEME_UNITS` consts are gone). `useTheme()` remains for the swatch radius (`shape.borderRadiusMedium`) and the swatch-text gap (`theme.spacing(1)`, a genuine 4px gap):

| File                                                | Line | Property                   | Value    | Determines           | Converted to                                                   |
| --------------------------------------------------- | ---- | -------------------------- | -------- | -------------------- | -------------------------------------------------------------- |
| `src/Frontend/Components/PieChart/PieChart.tsx:62`  | 62   | `legendTextStyle.fontSize` | `'12px'` | legend text font     | `theme.typography.caption.fontSize` (BarChart precedent, 12px) |
| `src/Frontend/Components/PieChart/PieChart.tsx:43`  | 43   | `borderRadius`             | `'6px'`  | legend swatch corner | `theme.shape.borderRadiusMedium` (= 6px)                       |
| `src/Frontend/Components/PieChart/PieChart.tsx:44`  | 44   | swatch `height`            | `'12px'` | legend swatch size   | `LEGEND_SWATCH_SIZE = '12px'` (px-literal const)               |
| `src/Frontend/Components/PieChart/PieChart.tsx:45`  | 45   | swatch `width`             | `'12px'` | legend swatch size   | `LEGEND_SWATCH_SIZE = '12px'` (px-literal const)               |
| `src/Frontend/Components/PieChart/PieChart.tsx:84`  | 84   | `RcPie outerRadius`        | `70`     | pie radius           | local const `PIE_RADIUS = 70` (numeric px)                     |
| `src/Frontend/Components/PieChart/PieChart.tsx:124` | 124  | `RcLegend width`           | `250`    | legend column width  | local const `LEGEND_WIDTH = 250` (numeric px)                  |

### _DONE_ ProgressBar

Exact conversions: the bar height via the theme spacing scale (5 units = 20px), the 2px outline via the `borderMedium` border token (see shared-styles section), inline in the `classes` object (consumed through `sx` on MUI components) with a justified file-level `no-magic-numbers` disable (`Autocomplete.style.tsx` precedent):

| File                                                     | Line | Property | Value           | Determines        | Converted to                                                        |
| -------------------------------------------------------- | ---- | -------- | --------------- | ----------------- | ------------------------------------------------------------------- |
| `src/Frontend/Components/ProgressBar/ProgressBar.tsx:34` | 34   | `border` | `2px solid ...` | bar outline width | `borderMedium` + `${OpossumColors.white}` (px-literal border token) |
| `src/Frontend/Components/ProgressBar/ProgressBar.tsx:36` | 36   | `height` | `'20px'`        | bar height        | `spacing(5)` (5 units = 20px)                                       |

### _DONE_ ProjectMetadataTable

Font sizes read through the shared theme typography variants (sx value callbacks `(theme: Theme) => theme.typography....fontSize`; the object is `satisfies SxProps<Theme>`) — no magic-number disable needed, the values live in `src/Frontend/app-typography.ts` (`body3` = 13px, `dense` = 11px, typed via module augmentation):

| File                                                                       | Line | Property                | Value | Determines               | Converted to                                                            |
| -------------------------------------------------------------------------- | ---- | ----------------------- | ----- | ------------------------ | ----------------------------------------------------------------------- |
| `src/Frontend/Components/ProjectMetadataTable/ProjectMetadataTable.tsx:21` | 21   | `firstColumn.fontSize`  | `13`  | metadata table head font | `theme.typography.body3.fontSize` (= 13px, `app-typography.ts` variant) |
| `src/Frontend/Components/ProjectMetadataTable/ProjectMetadataTable.tsx:27` | 27   | `secondColumn.fontSize` | `11`  | metadata table body font | `theme.typography.dense.fontSize` (= 11px, `app-typography.ts` variant) |

### _DONE_ ProjectStatisticsPopup

The px size floors are now the component-local px-literal const `POPUP_MIN_SIZE = '550px'` (popup-bounds pass; supersedes the module-scope unit const `POPUP_MIN_SIZE_IN_THEME_UNITS = 137.5` and its `spacing(...)` resolution); the remaining unit args are inline `spacing(...)` values covered by the file's `no-magic-numbers` handling (55 units = 220px, 110 units = 440px); the popup corner radius reads the named `theme.shape.borderRadiusLarge` token (10px, see the shared-styles section). The viewport (`95vw`/`95vh`, `85vw`/`75vh`) and percentage (`'47%'`) parts remain out of pixel scope (see the viewport/percentage note):

| File                                                                                | Line | Property                   | Value                           | Determines                      | Converted to                                                                                                                                  |
| ----------------------------------------------------------------------------------- | ---- | -------------------------- | ------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/Frontend/Components/ProjectStatisticsPopup/ProjectStatisticsPopup.tsx:98`      | 98   | `NotificationPopup width`  | `'min(95vw, max(550px, 85vw))'` | popup width (contains `550px`)  | `` `min(95vw, max(${POPUP_MIN_SIZE}, 85vw))` `` (px floor is the local const; viewport terms fluid)                                           |
| `src/Frontend/Components/ProjectStatisticsPopup/ProjectStatisticsPopup.tsx:99`      | 99   | `NotificationPopup height` | `'min(95vh, max(550px, 75vh))'` | popup height (contains `550px`) | `` `min(95vh, max(${POPUP_MIN_SIZE}, 75vh))` `` (px floor is the local const; viewport terms fluid)                                           |
| `src/Frontend/Components/ProjectStatisticsPopup/ProjectStatisticsPopup.tsx:303`     | 303  | chart grid `minHeight`     | `'220px'`                       | chart card minimum height       | `spacing(55)` (55 units = 220px)                                                                                                              |
| `src/Frontend/Components/ProjectStatisticsPopup/ProjectStatisticsPopup.tsx:304`     | 304  | chart grid `minWidth`      | `'440px'`                       | chart card minimum width        | `spacing(110)` (110 units = 440px)                                                                                                            |
| `src/Frontend/Components/ProjectStatisticsPopup/ProjectStatisticsPopup.tsx:305`     | 305  | chart grid `height`        | `'47%'`                         | chart card height (percentage)  | — kept (percentage, see viewport/percentage note)                                                                                             |
| `src/Frontend/Components/ProjectStatisticsPopup/ProjectStatisticsPopup.style.ts:13` | 13   | `borderRadius`             | `'10px'`                        | popup corner radius             | `theme.shape.borderRadiusLarge` (= 10px) — radii read the named `theme.shape` variants (see the shared-styles section), not the spacing scale |

### _DONE_ ReportView column configuration / ReportTableItem / ReportTableHeader

The `COLUMN_WIDTHS` bucket map was already a genuinely reused constant (9 config entries); only its values changed form — theme-unit numbers resolved at the consumers via sx value callbacks (`theme.spacing(config.width)`; no new constants, no lint disables). Exact mapping (4px unit): 10 = 40px, 25 = 100px, 80 = 320px, 115 = 460px:

| File                                                                 | Line   | Property                                    | Value                                  | Determines                                                                                              | Converted to                                                                                                                                                                                                              |
| -------------------------------------------------------------------- | ------ | ------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/Frontend/Components/ReportView/TableConfig.tsx:19`              | 19–24  | `COLUMN_WIDTHS_IN_THEME_UNITS` bucket sizes | `'40px' / '100px' / '320px' / '460px'` | width buckets (`verySmall`–`wide`) for all report table columns (applied as cell `minWidth`/`maxWidth`) | `10 / 25 / 80 / 115` units; `TableConfig.width: number`; resolved via `spacing()` at `ReportTableItem.tsx:169–170` and `ReportTableHeader.tsx:46–47`                                                                      |
| `src/Frontend/Components/ReportTableItem/ReportTableItem.tsx:43`     | 43     | `REPORT_VIEW_ROW_HEIGHT`                    | `150`                                  | report view row height                                                                                  | — kept (px): behavioral row-height constant fed to Virtuoso's `fixedItemHeight`/`defaultItemHeight` and a raw numeric cell height in `ReportView.tsx` (same non-design-token category as `INFINITE_LIST_BOTTOM_OVERSCAN`) |
| `src/Frontend/Components/ReportTableItem/ReportTableItem.tsx:45`     | 45     | `PADDING_PX`                                | `10`                                   | row padding in px (4 × `PADDING`)                                                                       | kept as the px lens (`4 × PADDING` = 4 × 2.5 units = 10px) under the file-level disable (the `4` baseline is needed precisely because `REPORT_VIEW_ROW_HEIGHT` stays a px constant)                                       |
| `src/Frontend/Components/ReportTableItem/ReportTableItem.tsx:52`     | 52     | `tableData.height`                          | `` `${150 - 2*10}px` -> `130px` ``     | table cell height                                                                                       | derived numeric (130 = sx raw px, single-source from `REPORT_VIEW_ROW_HEIGHT` − 2 × padding; px string template removed)                                                                                                  |
| `src/Frontend/Components/ReportTableItem/ReportTableItem.tsx:60`     | 60     | `iconTableData.height`                      | `130px` (derived)                      | icon cell height                                                                                        | derived numeric (130 raw px, single-source; the adjacent `py: PADDING` remains a theme unit)                                                                                                                              |
| `src/Frontend/Components/ReportTableItem/ReportTableItem.tsx:73`     | 73–76  | `borderRight`/`borderBottom`                | `1px solid ...`                        | cell borders                                                                                            | `borderThin` solid (= 1px, px-literal border token; value callbacks removed)                                                                                                                                              |
| `src/Frontend/Components/ReportTableItem/ReportTableItem.tsx:79`     | 79–80  | icon `width`/`height`                       | `'15px'`                               | table icon size                                                                                         | `baseIconSize` (= 15px, px-literal icon token; callbacks removed)                                                                                                                                                         |
| `src/Frontend/Components/ReportTableItem/ReportTableItem.tsx:84`     | 84–115 | `border` (8 icon variants)                  | `2px ... solid`                        | icon badge outlines                                                                                     | `borderMedium` (= 2px, px-literal border token) inside `<unit> <color> solid` for all variants (callbacks removed)                                                                                                        |
| `src/Frontend/Components/ReportTableHeader/ReportTableHeader.tsx:18` | 18     | `headerRow.boxShadow`                       | `'0px 2px 1px -1px ...'`               | header row elevation shadow geometry                                                                    | `theme.shadows[1]` (= MUI elevation-1; verified byte-equal geometry — `createShadow(0,2,1,-1,...)`) — only insignificant whitespace after commas differs                                                                  |
| `src/Frontend/Components/ReportTableHeader/ReportTableHeader.tsx:21` | 21     | `borderRight`                               | `1px solid ...`                        | header cell border                                                                                      | `borderThin` solid (= 1px, px-literal border token; value callback removed)                                                                                                                                               |

Both files now carry justified file-level `no-magic-numbers` disables (the 2.5 unit args plus the 4-baseline math remain; the 0.25/0.5 border args went with the border tokens and the 3.75 icon args with the icon tokens); the previous line-level comment was absorbed. `Icons.tsx`'s `IconProps.sx` was upgraded from bare `SxProps` to `SxProps<Theme>` so the callback-valued class members typecheck inside the spread icon styles.

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

All px values converted via the theme spacing scale; the inner `styled()` base component (menu paper/arrow) resolves the values through `useTheme()` (its slotProps sx objects cannot reach a `theme` hook otherwise), the icon/component callbacks destructure `theme` directly (the file already carries a file-level `no-magic-numbers` disable). Exact mapping (4px unit): 2.5 = 10px, 6 = 24px, 9.5 = 38px; the check icon reads the `checkIconSize` px-literal icon token (20px, see the shared-styles section); the `center: '50%'` variant is a percentage (out of pixel scope). The paper's `filter: drop-shadow(...)` geometry was **reverted to a plain literal** — a CSS filter is not a box-shadow/elevation, so `theme.shadows` cannot express it and its geometry (`0px 2px 8px`) matches no MUI elevation anyway. The `SelectMenu.tsx` row was converted in the AuditingOptions pass (shared `auditingOptionIconSize` token):

| File                                                          | Line    | Property                         | Value                 | Determines                                                                                                                                                                  | Converted to                                                                                                                                               |
| ------------------------------------------------------------- | ------- | -------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/Frontend/Components/SelectMenu/SelectMenu.style.tsx:50`  | 50      | `filter` drop-shadow             | `0px 2px 8px ...`     | paper shadow geometry                                                                                                                                                       | — reverted to the literal `drop-shadow(0px 2px 8px rgba(0, 0, 0, 0.32))` (CSS filter, not an elevation; `theme.shadows` cannot express it, see note above) |
| `src/Frontend/Components/SelectMenu/SelectMenu.style.tsx:58`  | 58      | anchor arrow `left`              | `'24px'`              | anchor arrow horizontal offset                                                                                                                                              | `theme.spacing(6)` (= 24px)                                                                                                                                |
| `src/Frontend/Components/SelectMenu/SelectMenu.style.tsx:59`  | 59      | anchor arrow `right`             | `'calc(100% - 24px)'` | anchor arrow horizontal offset (right-anchored variant)                                                                                                                     | `calc(100% - ${theme.spacing(6)})`                                                                                                                         |
| `src/Frontend/Components/SelectMenu/SelectMenu.style.tsx:62`  | 62–63   | anchor arrow `width`/`height`    | `10` / `10`           | anchor arrow size                                                                                                                                                           | `theme.spacing(2.5)` (= 10px) values                                                                                                                       |
| `src/Frontend/Components/SelectMenu/SelectMenu.style.tsx:96`  | 96–97   | `StyledCheckIcon width`/`height` | `'20px'` / `'20px'`   | check icon size                                                                                                                                                             | `checkIconSize` (= 20px, px-literal icon token; the `theme` destructuring was dropped)                                                                     |
| `src/Frontend/Components/SelectMenu/SelectMenu.style.tsx:107` | 107     | `MenuItemContainer.height`       | `'38px'`              | menu item row height                                                                                                                                                        | `theme.spacing(9.5)` (= 38px)                                                                                                                              |
| `src/Frontend/Components/SelectMenu/SelectMenu.tsx:114`       | 114–115 | `ListItemIcon minWidth`          | `'19px !important'`   | see below: converted to the shared `auditingOptionIconSize` token (see _DONE_ AuditingOptions); `!important` kept to keep overriding MUI's default `ListItemIcon` min-width | already converted (shared `auditingOptionIconSize` token, see note above)                                                                                  |

### _DONE_ SortButton

| File                                                    | Line | Property           | Value | Determines          | Converted to                                   |
| ------------------------------------------------------- | ---- | ------------------ | ----- | ------------------- | ---------------------------------------------- |
| `src/Frontend/Components/SortButton/SortButton.tsx:119` | 119  | `SelectMenu width` | `200` | sort dropdown width | `theme.spacing(50)` via `useTheme()` (= 200px) |

### _DONE_ SwitchableProgressBar

| File                                                                         | Line | Property | Value     | Determines         | Converted to                                                                     |
| ---------------------------------------------------------------------------- | ---- | -------- | --------- | ------------------ | -------------------------------------------------------------------------------- |
| `src/Frontend/Components/SwitchableProgressBar/SwitchableProgressBar.tsx:30` | 30   | `width`  | `'150px'` | progress bar width | `spacing(37.5)` (= 150px) value callback in `classes.select` (justified disable) |

### _DONE_ TextBox

Values converted via sx value callbacks in `classes` (`({ spacing }: Theme) => spacing(...)`; the object is now `satisfies SxProps<Theme>`, matching the file's existing @mui/system `Theme` typing; file-level `no-magic-numbers` disable already present). The label font reads the shared `body3` typography variant (`theme.typography.body3.fontSize`, defined in `src/Frontend/app-typography.ts`, typed via module augmentation). The 1px focus outline is the `borderThin` border token (see shared-styles section). The two `borderRadius: '0px'` rows became unitless `borderRadius: 0` (zero is the lattice's 0; the square-corner semantics are intentional and the CSS is unchanged):

| File                                             | Line | Property                         | Value    | Determines            | Converted to                                                            |
| ------------------------------------------------ | ---- | -------------------------------- | -------- | --------------------- | ----------------------------------------------------------------------- |
| `src/Frontend/Components/TextBox/TextBox.tsx:26` | 26   | input `borderRadius`             | `'0px'`  | input corner (square) | converted to unitless `borderRadius: 0` (identical CSS)                 |
| `src/Frontend/Components/TextBox/TextBox.tsx:32` | 32   | label `fontSize`                 | `'13px'` | floating label font   | `theme.typography.body3.fontSize` (= 13px, `app-typography.ts` variant) |
| `src/Frontend/Components/TextBox/TextBox.tsx:50` | 50   | focused fieldset `borderWidth`   | `'1px'`  | focus outline width   | `borderThin` (= 1px, px-literal border token)                           |
| `src/Frontend/Components/TextBox/TextBox.tsx:56` | 56   | highlighted input `borderRadius` | `'0px'`  | input corner (square) | converted to unitless `borderRadius: 0` (identical CSS)                 |

### _DONE_ Toaster

| File                                             | Line | Property | Value     | Determines            | Converted to                                                                  |
| ------------------------------------------------ | ---- | -------- | --------- | --------------------- | ----------------------------------------------------------------------------- |
| `src/Frontend/Components/Toaster/Toaster.tsx:29` | 29   | `width`  | `'340px'` | toast container width | `theme.spacing(85)` (= 340px) value callback, justified disable (85-unit arg) |

### _DONE_ TopBar

All values converted via sx value callbacks in `classes` (`({ spacing }: Theme) => spacing(...)`, `as const satisfies SxProps<Theme>`), with a justified file-level `no-magic-numbers` disable. Exact spacing mapping (4px unit): 9 = 36px, 20 = 80px; the 2px toggle outlines read the `borderMedium` border token and the open-file icon the `resourceIconSize` icon token (18px) — both px-literal tokens from `shared-styles.ts` (see the shared-styles section):

| File                                           | Line  | Property                        | Value               | Determines                                      | Converted to                                                 |
| ---------------------------------------------- | ----- | ------------------------------- | ------------------- | ----------------------------------------------- | ------------------------------------------------------------ |
| `src/Frontend/Components/TopBar/TopBar.tsx:31` | 31    | `root.height`                   | `'36px'`            | top bar height                                  | `spacing(9)` (= 36px) value callback                         |
| `src/Frontend/Components/TopBar/TopBar.tsx:36` | 36–37 | open-file icon `width`/`height` | `'18px'` / `'18px'` | open-file icon box (does not fill the 36px bar) | `resourceIconSize` (= 18px, px-literal icon token)           |
| `src/Frontend/Components/TopBar/TopBar.tsx:53` | 53    | `viewButtons.width`             | `'80px'`            | Audit/Report toggle button width                | `spacing(20)` (= 80px) value callback                        |
| `src/Frontend/Components/TopBar/TopBar.tsx:56` | 56    | `viewButtons.border`            | `2px ... solid`     | toggle button outline width                     | `${borderMedium} ... solid` (= 2px, px-literal border token) |
| `src/Frontend/Components/TopBar/TopBar.tsx:64` | 64    | selected toggle `border`        | `2px ... solid`     | selected toggle outline width                   | `${borderMedium} ... solid` (= 2px, px-literal border token) |

### _DONE_ ValidationDisplay

All values converted via sx value callbacks on the MUI components (`({ spacing }: Theme) => spacing(...)`), with a justified file-level `no-magic-numbers` disable. Exact spacing mapping (4px unit): 6 = 24px; the warning icon `fontSize` reads the `warningIconFontSize` token (16px) and the expand/collapse icon the `resourceIconSize` token (18px) — both px-literal icon tokens from `shared-styles.ts`:

| File                                                                 | Line  | Property                     | Value    | Determines                | Converted to                                          |
| -------------------------------------------------------------------- | ----- | ---------------------------- | -------- | ------------------------- | ----------------------------------------------------- |
| `src/Frontend/Components/ValidationDisplay/ValidationDisplay.tsx:39` | 39    | container `minHeight`        | `24`     | validation row min height | `spacing(6)` (= 24px) value callback                  |
| `src/Frontend/Components/ValidationDisplay/ValidationDisplay.tsx:49` | 49    | warning icon `fontSize`      | `16`     | warning icon size         | `warningIconFontSize` (= 16px, px-literal icon token) |
| `src/Frontend/Components/ValidationDisplay/ValidationDisplay.tsx:64` | 64–65 | expand icon `height`/`width` | `'18px'` | expand/collapse icon size | `resourceIconSize` (= 18px, px-literal icon token)    |

### _DONE_ ValueFilterAutocomplete

| File                                                                                          | Line | Property | Value    | Determines                                     | Converted to                                                                                                                                                                       |
| --------------------------------------------------------------------------------------------- | ---- | -------- | -------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/Frontend/Components/FilterButton/ValueFilterAutocomplete/ValueFilterAutocomplete.tsx:41` | 41   | `height` | `'38px'` | filter trigger height (matches 38px menu rows) | `spacing(9.5)` (= 38px) value callback, justified disable — same 9.5 units as the SelectMenu `MenuItemContainer.height` (9.5 = 38px), keeping the height coupling documented above |

### _DONE_ VirtualizedTree

CSS values converted via sx value callbacks in `classes` (`({ spacing }: Theme) => spacing(...)`); the tree-indent constants are **component-local numeric px consts** (`INDENT_PER_DEPTH_LEVEL = 12`, `SIMPLE_FOLDER_EXTRA_INDENT = 16` — the behavioral-parameters pass superseded the theme-unit consts and their `spacingPx`/`parseFloat` resolution; they feed spacer-`width` pixel arithmetic with integer-exact multiplier arithmetic over `resource.level`). Exact spacing mapping for the remaining classes values (4px unit): 4 = 16px, 5 = 20px; a justified file-level `no-magic-numbers` disable covers the unit args and the pre-existing `opacity` fallback (its former line comment was absorbed):

| File                                                                                     | Line  | Property                        | Value               | Determines                           | Converted to                                                                        |
| ---------------------------------------------------------------------------------------- | ----- | ------------------------------- | ------------------- | ------------------------------------ | ----------------------------------------------------------------------------------- |
| `src/Frontend/Components/VirtualizedTree/VirtualizedTreeNode/VirtualizedTreeNode.tsx:19` | 19    | `INDENT_PER_DEPTH_LEVEL`        | `12`                | indent per tree depth level (px)     | local numeric const `INDENT_PER_DEPTH_LEVEL = 12` (behavioral pixel arithmetic)     |
| `src/Frontend/Components/VirtualizedTree/VirtualizedTreeNode/VirtualizedTreeNode.tsx:20` | 20    | `SIMPLE_FOLDER_EXTRA_INDENT`    | `16`                | extra indent for simple folders (px) | local numeric const `SIMPLE_FOLDER_EXTRA_INDENT = 16` (behavioral pixel arithmetic) |
| `src/Frontend/Components/VirtualizedTree/VirtualizedTreeNode/VirtualizedTreeNode.tsx:28` | 28    | `listNode.height`               | `'20px'`            | tree node row height                 | `spacing(5)` (= 20px) value callback                                                |
| `src/Frontend/Components/VirtualizedTree/VirtualizedTreeNode/VirtualizedTreeNode.tsx:40` | 40–41 | clickable icon `width`/`height` | `'16px'` / `'20px'` | node icon button box                 | `spacing(4)` (= 16px) / `spacing(5)` (= 20px) value callbacks                       |
| `src/Frontend/Components/VirtualizedTree/VirtualizedTreeNode/VirtualizedTreeNode.tsx:54` | 54–55 | expand icon `width`/`height`    | `'16px'` / `'20px'` | expand/collapse icon box             | `spacing(4)` (= 16px) / `spacing(5)` (= 20px) value callbacks                       |
| `src/Frontend/Components/VirtualizedTree/VirtualizedTreeNode/VirtualizedTreeNode.tsx:66` | 66    | selected indicator `height`     | `'20px'`            | selection highlight height           | `spacing(5)` (= 20px) value callback                                                |

### _DONE_ ResourceBrowser

| File                                                                                     | Line | Property | Value           | Determines                    | Converted to                                                                                                  |
| ---------------------------------------------------------------------------------------- | ---- | -------- | --------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `src/Frontend/Components/ResourceBrowser/LinkedResourcesTree/LinkedResourcesTree.tsx:74` | 74   | `border` | `1px solid ...` | linked resources tree outline | `${borderThin} solid ...` (px-literal border token; the `useTheme()` call became unnecessary and was dropped) |

### _DONE_ AttributionCountPerSourcePerLicenseTableHead

| File                                                                                                                                                                | Line | Property       | Value                     | Determines       | Converted to                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | -------------- | ------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `src/Frontend/Components/AttributionCountPerSourcePerLicenseTable/AttributionCountPerSourcePerLicenseTableHead/AttributionCountPerSourcePerLicenseTableHead.tsx:19` | 19   | `borderRight`  | `'2px solid lightgray'`   | head cell border | `${borderMedium} solid lightgray` (2px, px-literal border token; `classes` now `satisfies SxProps<Theme>`)                         |
| `src/Frontend/Components/AttributionCountPerSourcePerLicenseTable/AttributionCountPerSourcePerLicenseTableHead/AttributionCountPerSourcePerLicenseTableHead.tsx:23` | 23   | `borderBottom` | `'1.5px solid lightgray'` | head cell border | `${borderTableHead} solid lightgray` (1.5px, one-off px-literal border token; the `lightgray` color literal itself is not a pixel) |

### _DONE_ ToggleHiddenSignalsButton

| File                                                                                                                | Line | Property | Value    | Determines               | Converted to                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------- | ---- | -------- | -------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `src/Frontend/Components/AttributionPanels/SignalsPanel/ToggleHiddenSignalsButton/ToggleHiddenSignalsButton.tsx:36` | 36   | `height` | `'24px'` | toggle button row height | `({ spacing }: Theme) => spacing(6)` (= 24px) value callback, justified disable (`@mui/system` `Theme`, matching the system `Box` import) |

### _DONE_ AttributionDetails

| File                                                                   | Line | Property                  | Value | Determines            | Converted to                                                                                                        |
| ---------------------------------------------------------------------- | ---- | ------------------------- | ----- | --------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `src/Frontend/Components/AttributionDetails/AttributionDetails.tsx:38` | 38   | `loadingIndicator.height` | `2`   | loading bar thickness | `borderMedium` (= 2px, px-literal border token; GroupedList/List progress-bar precedent, see shared-styles section) |

### _DONE_ PackagesPanel

`ALERT_CONTAINER_HEIGHT = 24` and `TABS_CONTAINER_HEIGHT = 30` stay as **px behavioral/layout constants** (same category as `HEADER_HEIGHT`/`REPORT_VIEW_ROW_HEIGHT`): they feed the `contentHeight` `calc()` string arithmetic in `PackagesPanel.tsx` alongside numeric CSS heights (`height: open ? ALERT_CONTAINER_HEIGHT : 0`, `height: TABS_CONTAINER_HEIGHT`), so routing them through the spacing lattice would desync the header math (`30 + 24 = 54px header band`) from the collapsed heights. The elevation shadows are now the exact MUI token (`theme.shadows[1]` — verified previously to be the same geometry as the copied literal), the indicator thickness reads the `borderThin` border token, and the ad-hoc `42px` panel-header offset derived from a theme callback ('10.5 units = 42px', justified disable):

| File                                                                                | Line   | Property                 | Value                       | Determines                            | Converted to                                                                                                                                                                                                                           |
| ----------------------------------------------------------------------------------- | ------ | ------------------------ | --------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/Frontend/Components/AttributionPanels/PackagesPanel/PackagesPanel.style.ts:12` | 12     | `ALERT_CONTAINER_HEIGHT` | `24`                        | alert strip height (px)               | — kept (px behavioral constant, see note above)                                                                                                                                                                                        |
| `src/Frontend/Components/AttributionPanels/PackagesPanel/PackagesPanel.style.ts:13` | 13     | `TABS_CONTAINER_HEIGHT`  | `30`                        | tabs bar height (px)                  | — kept (px behavioral constant, see note above)                                                                                                                                                                                        |
| `src/Frontend/Components/AttributionPanels/PackagesPanel/PackagesPanel.style.ts:25` | 25, 53 | `boxShadow`              | `'0px 2px 1px -1px ...'`    | elevation shadow geometry             | `theme.shadows[1]` in `({ theme })` callbacks (both ActionBarContainer and Tabs)                                                                                                                                                       |
| `src/Frontend/Components/AttributionPanels/PackagesPanel/PackagesPanel.style.ts:59` | 59     | tabs indicator `height`  | `'1px'`                     | tab underline thickness               | `borderThin` (px-literal border token; a line thickness, not a gap — the `useTheme()` reach-through and justified disable are gone)                                                                                                    |
| `src/Frontend/Components/AttributionPanels/PackagesPanel/PackagesPanel.tsx:638`     | 638    | `contentHeight` calc     | `'42px'` inside `calc(...)` | panel header offset in content height | `${theme.spacing(10.5)}` (= 42px) via `useTheme()` inside the template literal; the `${TABS_CONTAINER_HEIGHT}px` / `${ALERT_CONTAINER_HEIGHT}px` segments keep feeding from their px constants, preserving this variable-part behavior |

### Note: viewport- and percentage-based sizing

These values are hardcoded but not pixel-based, so they are listed separately:

| File                                                                              | Line  | Property               | Value                                                       | Determines                                              |
| --------------------------------------------------------------------------------- | ----- | ---------------------- | ----------------------------------------------------------- | ------------------------------------------------------- |
| `src/Frontend/Components/App/App.style.ts:30`                                     | 30    | `ViewContainer.height` | `'100vh'`                                                   | app viewport height                                     |
| `src/Frontend/Components/Autocomplete/Listbox/Listbox.style.ts:27`                | 27    | `maxHeight`            | `'40vh'`                                                    | autocomplete listbox max height                         |
| `src/Frontend/Components/ImportDialog/ImportDialog.tsx:112`                       | 112   | `width`                | `'80vw'`                                                    | popup width                                             |
| _DONE_ `src/Frontend/Components/DiffPopup/DiffPopup.tsx:109`                      | 109   | `width`                | `` `min(${MAX_WIDTH}, calc(100vw - ${VIEWPORT_MARGIN}))` `` | popup width (px cap converted; viewport calc fluid)     |
| _DONE_ `src/Frontend/Components/DiffPopup/DiffPopup.tsx:111`                      | 111   | `height`               | `` `calc(100vh - ${VIEWPORT_VERTICAL_MARGIN})` ``           | popup height (px margin converted; viewport calc fluid) |
| `src/Frontend/Components/SplitDialog/SplitDialog.tsx:95`                          | 95    | `width`                | `'80vw'`                                                    | popup width                                             |
| `src/Frontend/Components/MergeOpossumFilesDialog/MergeOpossumFilesDialog.tsx:150` | 150   | `width`                | `'80vw'`                                                    | popup width                                             |
| `src/Frontend/Components/ProjectStatisticsPopup/ProjectStatisticsPopup.tsx:94`    | 94–95 | width/height bounds    | `95vw` / `85vw` / `75vh`                                    | popup size bounds                                       |
| `src/Frontend/Components/ProjectStatisticsPopup/ProjectStatisticsPopup.tsx:301`   | 301   | `height`               | `'47%'`                                                     | chart card height                                       |
| `src/Frontend/Components/PieChart/PieChart.tsx:63`                                | 63    | legend text `width`    | `'95%'`                                                     | legend text width                                       |

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
| `src/Frontend/Components/UpdateAppPopup/UpdateAppPopup.tsx:31`               | 31            | `NotificationPopup width`        | `'600px'`                  | update-app popup width                                                                                                                                                                                                 | converted — local const `POPUP_WIDTH = '600px'` (px literal; supersedes the earlier `theme.spacing(150)` candidate)                                                                    |
| `src/Frontend/Components/AttributionDetails/ButtonRow/ButtonRow.tsx:287`     | 287, 336, 442 | `MuiCircularProgress size`       | `16`                       | in-button pending spinner size (three occurrences)                                                                                                                                                                     | converted — shared numeric `buttonSpinnerSize` (16) token from `shared-styles.ts` (`MuiCircularProgress size` takes a number; supersedes the earlier `theme.spacing(4)` candidate)     |
| `src/Frontend/Components/Spinner/Spinner.tsx:10`                             | 10            | `DEFAULT_SIZE`                   | `12`                       | default spinner size (fed to `MuiCircularProgress size`; affects default callers, e.g. `UpdateAppPopup.tsx`, `LogDisplay.tsx`)                                                                                         | converted — shared numeric `spinnerDefaultSize` (12) token from `shared-styles.ts` (supersedes the earlier `theme.spacing(3)` candidate; the local `DEFAULT_SIZE` const is gone)       |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:105`            | 105           | Popper `flip` modifier `padding` | `64`                       | positioning offset controlling where the autocomplete listbox flips                                                                                                                                                    | converted — local const `FLIP_PADDING = 64` (numeric px, behavioral Popper.js positional parameter; supersedes the earlier "open — behavioral" note)                                   |
| `src/Frontend/Components/AttributionDetails/ButtonRow/ButtonRow.style.ts:21` | 21            | `border`                         | `'1px solid currentColor'` | disabled-state border ring on the attribution FAB buttons                                                                                                                                                              | converted — `` `${borderThin} solid currentColor` `` (px-literal border token, see shared-styles section; supersedes the earlier `theme.spacing(0.25)` candidate)                      |
| `src/Frontend/Components/PackageCard/PackageCard.tsx:25`                     | 25            | `PACKAGE_CARD_HEIGHT`            | `40`                       | package card height; also feeds `PACKAGE_CARD_LIST_ITEM_HEIGHT = PACKAGE_CARD_HEIGHT + 1` (line 27), used as Virtuoso `unloadedItemHeight` by `CardList`, `AttributionCardList`, `SignalsList`, and `AttributionsList` | — kept candidate: behavioral virtual-list geometry constant (same category as `REPORT_VIEW_ROW_HEIGHT`); any conversion must keep the CSS height and the virtual-list estimate in sync |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:48`             | 48            | input row `borderRadius`         | `'0px'`                    | square corners on the autocomplete input row                                                                                                                                                                           | kept — no-op zero value; square-corner semantics intentional (TextBox precedent documents its identical `'0px'` rows)                                                                  |
