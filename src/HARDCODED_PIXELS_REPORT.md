<!--
SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>

SPDX-License-Identifier: CC0-1.0
-->

# Hardcoded Pixel Values for Spacing - Technical Debt Report

## Executive Summary

This report documents the widespread use of hardcoded pixel values for spacing (margin, padding, gap) across the OpossumUI codebase. A total of **100+ instances** of hardcoded pixel spacing values were found across 40+ component files, representing significant technical debt that hinders maintainability, theming, and responsive design.

The issue is pervasive because the codebase lacks a centralized spacing scale or design tokens, with spacing values scattered as string literals throughout component files.

## Scope of the Issue

**Total hardcoded spacing instances:** 100+ across 40+ files

**Affected properties:**

- `margin` / `marginTop` / `marginBottom` / `marginLeft` / `marginRight`
- `padding` / `paddingTop` / `paddingBottom` / `paddingLeft` / `paddingRight`
- `gap` (flex/grid gap)

**Value range:** 0px to 200px, with common values at 4px, 8px, 12px, 16px, 20px, 3px, 4px, 5px, 6px, 7px, 10px, 12px, 200px

## Example Occurrences by Component

### Checkbox

| File                                               | Line | Property     | Value | Converted to       |
| -------------------------------------------------- | ---- | ------------ | ----- | ------------------ |
| `src/Frontend/Components/Checkbox/Checkbox.tsx:60` | 60   | `sx.padding` | `7px` | `sx={{ p: 1.75 }}` |

### ConfirmAttributionActionPopup

| File                                                                                              | Line | Property | Value | Converted to       |
| ------------------------------------------------------------------------------------------------- | ---- | -------- | ----- | ------------------ |
| `src/Frontend/Components/ConfirmAttributionActionPopup/ConfirmAttributionActionPopup.style.ts:13` | 13   | `gap`    | `8px` | `theme.spacing(2)` |

### ErrorFallback

| File                                                              | Line | Property | Value  | Converted to       |
| ----------------------------------------------------------------- | ---- | -------- | ------ | ------------------ |
| `src/Frontend/Components/ErrorFallback/ErrorFallback.style.ts:20` | 20   | `gap`    | `20px` | `theme.spacing(5)` |

### FilePathInput

| File                                                         | Line | Property       | Value  | Converted to     |
| ------------------------------------------------------------ | ---- | -------------- | ------ | ---------------- |
| `src/Frontend/Components/FilePathInput/FilePathInput.tsx:55` | 55   | `sx.marginTop` | `20px` | `sx={{ mt: 5 }}` |

### SelectMenu

| File                                                          | Line | Property       | Value         | Converted to                                                 |
| ------------------------------------------------------------- | ---- | -------------- | ------------- | ------------------------------------------------------------ |
| `src/Frontend/Components/SelectMenu/SelectMenu.style.tsx:48`  | 48   | `marginTop`    | `4px`         | `sx={{ mt: 1 }}`                                             |
| `src/Frontend/Components/SelectMenu/SelectMenu.style.tsx:72`  | 72   | `marginTop`    | `8px` / `4px` | `theme.spacing(anchorArrow ? 2 : 1)`                         |
| `src/Frontend/Components/SelectMenu/SelectMenu.style.tsx:99`  | 99   | `gap`          | `8px`         | `theme.spacing(2)`                                           |
| `src/Frontend/Components/SelectMenu/SelectMenu.style.tsx:101` | 101  | `paddingRight` | `17px`        | `theme.spacing(4.25)`                                        |
| `src/Frontend/Components/SelectMenu/SelectMenu.style.tsx:102` | 102  | `paddingLeft`  | `12px`        | `theme.spacing(3)`                                           |
| `src/Frontend/Components/SelectMenu/SelectMenu.tsx:115`       | 115  | `marginTop`    | `2px`         | `sx={{ mt: 0.5 }}` in the `ListItemText` `primary` slotProps |

### AttributionPanels > PackagesPanel

| File                                                                                | Line | Property  | Value | Converted to       |
| ----------------------------------------------------------------------------------- | ---- | --------- | ----- | ------------------ |
| `src/Frontend/Components/AttributionPanels/PackagesPanel/PackagesPanel.style.ts:32` | 32   | `gap`     | `4px` | `theme.spacing(1)` |
| `src/Frontend/Components/AttributionPanels/PackagesPanel/PackagesPanel.style.ts:33` | 33   | `padding` | `4px` | `theme.spacing(1)` |
| `src/Frontend/Components/AttributionPanels/PackagesPanel/PackagesPanel.style.ts:38` | 38   | `gap`     | `4px` | `theme.spacing(1)` |
| `src/Frontend/Components/AttributionPanels/PackagesPanel/PackagesPanel.style.ts:67` | 67   | `padding` | `8px` | `theme.spacing(2)` |

### ProjectStatisticsPopup

| File                                                                                | Line | Property       | Value  | Converted to       |
| ----------------------------------------------------------------------------------- | ---- | -------------- | ------ | ------------------ |
| `src/Frontend/Components/ProjectStatisticsPopup/ProjectStatisticsPopup.tsx:114`     | 114  | `marginBottom` | `12px` | `sx={{ mb: 3 }}`   |
| `src/Frontend/Components/ProjectStatisticsPopup/ProjectStatisticsPopup.tsx:277`     | 277  | `padding`      | `12px` | `sx={{ p: 3 }}`    |
| `src/Frontend/Components/ProjectStatisticsPopup/ProjectStatisticsPopup.tsx:278`     | 278  | `paddingTop`   | `0px`  | `sx={{ pt: 0 }}`   |
| `src/Frontend/Components/ProjectStatisticsPopup/ProjectStatisticsPopup.style.ts:14` | 14   | `padding`      | `12px` | `theme.spacing(3)` |

### GroupedList

| File                                                          | Line | Property  | Value      | Converted to            |
| ------------------------------------------------------------- | ---- | --------- | ---------- | ----------------------- |
| `src/Frontend/Components/GroupedList/GroupedList.style.ts:13` | 13   | `gap`     | `8px`      | `theme.spacing(2)`      |
| `src/Frontend/Components/GroupedList/GroupedList.style.ts:14` | 14   | `padding` | `4px 10px` | `theme.spacing(1, 2.5)` |

### PieChart

| File                                                | Line | Property      | Value | Converted to                                                                                   |
| --------------------------------------------------- | ---- | ------------- | ----- | ---------------------------------------------------------------------------------------------- |
| `src/Frontend/Components/PieChart/PieChart.tsx:103` | 103  | `marginRight` | `4px` | `theme.spacing(1)` (via `useTheme()`, fed into the `getLegendIconStyle` helper at lines 37–48) |

### DiffPopup

| File                                                       | Line  | Property       | Value          | Converted to                                                 |
| ---------------------------------------------------------- | ----- | -------------- | -------------- | ------------------------------------------------------------ |
| `src/Frontend/Components/DiffPopup/DiffPopup.style.ts:8`   | 8     | `columnGap`    | `8px`          | `columnGap: 2` — undocumented so far; added after the rebase |
| `src/Frontend/Components/DiffPopup/DiffPopup.style.ts:17`  | 17–18 | `padding`      | `8px 12px 8px` | `py: 2, px: 3`                                               |
| `src/Frontend/Components/DiffPopup/DiffPopup.style.ts:23`  | 23    | `gap`          | `12px`         | `gap: 3`                                                     |
| `src/Frontend/Components/DiffPopup/DiffPopup.style.ts:30`  | 30    | `padding`      | `8px 0`        | `py: 2, px: 0`                                               |
| `src/Frontend/Components/DiffPopup/DiffPopup.style.ts:47`  | 47    | `marginBottom` | `12px`         | `mb: 3`                                                      |
| `src/Frontend/Components/DiffPopup/DiffPopup.style.ts:62`  | 62    | `gap`          | `12px`         | `gap: 3`                                                     |
| `src/Frontend/Components/DiffPopup/DiffPopup.style.ts:68`  | 68    | `gap`          | `8px`          | `gap: 2`                                                     |
| `src/Frontend/Components/DiffPopup/DiffPopup.style.ts:79`  | 79    | `gap`          | `12px`         | `gap: 3`                                                     |
| `src/Frontend/Components/DiffPopup/DiffPopup.style.ts:112` | 112   | `gap`          | `12px`         | `gap: 3`                                                     |
| `src/Frontend/Components/DiffPopup/DiffPopup.style.ts:138` | 138   | `marginTop`    | `1px`          | `mt: 0.25`                                                   |
| `src/Frontend/Components/DiffPopup/DiffPopup.tsx:108`      | 108   | `padding`      | `8px 24px 6px` | `titleSx={{ py: 2, px: 6, pb: 1.5 }}`                        |
| `src/Frontend/Components/DiffPopup/DiffPopup.tsx:109`      | 109   | `padding`      | `4px 8px`      | `actionsSx={{ py: 1, px: 2 }}`                               |

All `diffPopupStyles` entries are consumed through the `sx` prop (`sx={diffPopupStyles.x}`), so theme-unit numbers are scaled correctly there.
|

### Note: Pitfalls Found and Fixed During Migration

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

   The "Converted to" values in the tables above describe styles that are genuinely applied at runtime.

## Hardcoded Pixel Values for Dimensions and Sizing

A repository-wide scan (fresh pass; excluding unit tests, test helpers, and e2e/performance tests) shows that hardcoded pixel values are not limited to margin/padding/gap: **150+ further instances across 45+ files** determine dimensions and sizing — element widths and heights, minimum/maximum sizes, font sizes, icon sizes, border widths, corner radii, positioning offsets, chart geometry, virtual-list geometry, and the Electron window size.

Scope conventions for the tables below:

- Unitless numbers (e.g. `height: 2`, `width={600}`) are pixel values by CSS/engine semantics and are listed with their effective px size.
- Zero values (`height: 0`, `top: 0`) and pure percentage values (`width: '100%'`, `borderRadius: '50%'`) are omitted; viewport-unit sizing is collected in a separate note at the end.
- Unlike margin/padding/gap, `width`/`height` are not auto-scaled by the `sx` prop (numbers there mean raw pixels), so a future migration needs `theme.spacing(...)` callbacks, shared dimension constants, or theme extensions (`theme.typography`, `theme.shape.borderRadius`) rather than plain sx shorthand.

### Shared styles and theme

| File                                          | Line | Property                                      | Value               | Determines                                         |
| --------------------------------------------- | ---- | --------------------------------------------- | ------------------- | -------------------------------------------------- |
| `src/Frontend/shared-styles.ts:50`            | 50   | `baseIcon.width`                              | `'15px'`            | size of all icons using `baseIcon`/`clickableIcon` |
| `src/Frontend/shared-styles.ts:51`            | 51   | `baseIcon.height`                             | `'15px'`            | icon size (see above)                              |
| `src/Frontend/shared-styles.ts:72`            | 72   | `tableClasses.head.fontSize`                  | `13`                | table head font size                               |
| `src/Frontend/shared-styles.ts:77`            | 77   | `tableClasses.body.fontSize`                  | `11`                | table body font size                               |
| `src/Frontend/shared-styles.ts:79`            | 79   | `tableClasses.body.maxWidth`                  | `'200px'`           | max table cell width                               |
| `src/Frontend/shared-styles.ts:85`            | 85   | `tableClasses.footer.fontSize`                | `12`                | table footer font size                             |
| `src/Frontend/shared-styles.ts:125`           | 125  | `treeItemClasses.matchesFilters.borderRadius` | `'3px'`             | corner radius of the "matches filters" highlight   |
| `src/Frontend/shared-styles.ts:138`           | 138  | `chartTooltipContentStyle.fontSize`           | `'12px'`            | recharts tooltip font size                         |
| `src/Frontend/shared-styles.ts:142`           | 142  | `chartTooltipContentStyle.borderRadius`       | `'4px'`             | recharts tooltip corner radius                     |
| `src/Frontend/Components/App/App.style.ts:40` | 40   | `typography.body1.fontSize`                   | `'14px'`            | app-wide body1 font size                           |
| `src/Frontend/Components/App/App.style.ts:41` | 41   | `typography.body1.lineHeight`                 | `'20px'`            | body1 line box height                              |
| `src/Frontend/Components/App/App.style.ts:44` | 44   | `typography.body2.fontSize`                   | `'14px'`            | app-wide body2 font size                           |
| `src/Frontend/Components/App/App.style.ts:45` | 45   | `typography.body2.lineHeight`                 | `'18px'`            | body2 line box height                              |
| `src/Frontend/Components/App/App.style.ts:48` | 48   | `typography.caption.fontSize`                 | `'12px'`            | app-wide caption font size                         |
| `src/Frontend/Components/App/App.style.ts:49` | 49   | `typography.caption.lineHeight`               | `'20px'`            | caption line box height                            |
| `src/Frontend/Components/App/App.style.ts:75` | 75   | `MuiInputBase` override `minHeight`           | `'36px !important'` | min height of every input in the app               |

### _DONE_ Electron main process

Window size constants in `src/ElectronBackend/main/createWindow.ts` (screen-aware clamping uses `screen.getPrimaryDisplay().workAreaSize`) — the preferred size is clamped to the actual screen work area when the window opens, so on small screens (e.g. 1366×768 laptops) the window no longer opens taller than the desktop:

| File                                          | Line | Property                | Value  | Determines                                                 |
| --------------------------------------------- | ---- | ----------------------- | ------ | ---------------------------------------------------------- |
| `src/ElectronBackend/main/createWindow.ts:12` | 12   | `DEFAULT_WINDOW_WIDTH`  | `1920` | preferred initial app window width (clamped to work area)  |
| `src/ElectronBackend/main/createWindow.ts:13` | 13   | `DEFAULT_WINDOW_HEIGHT` | `1080` | preferred initial app window height (clamped to work area) |
| `src/ElectronBackend/main/createWindow.ts:14` | 14   | `MIN_WINDOW_WIDTH`      | `500`  | minimum window width (constraint, not a design token)      |
| `src/ElectronBackend/main/createWindow.ts:15` | 15   | `MIN_WINDOW_HEIGHT`     | `400`  | minimum window height (constraint, not a design token)     |

### _DONE_ Autocomplete

All rows converted via the theme spacing scale in `styled()` theme callbacks, except `AutocompleteUtil.tsx` (module-scope `occurrenceChipClass`, `satisfies SxProps<Theme>`; numbers in module-scope const class members are exempt from `no-magic-numbers`). Unit mapping (4px spacing unit): 0.25 units = 1px, 3 units = 12px, 3.25 units = 13px, 3.5 units = 14px, 6 units = 24px, 7 units = 28px, 9.1675 units = 36.67px (`4 * 9.1675 === 36.67` exactly). Row 56 was already theme-scaled in code — only the stale Value description was corrected:

| File                                                              | Line | Property                       | Value                   | Determines                                                                  | Converted to                                                                                                                                   |
| ----------------------------------------------------------------- | ---- | ------------------------------ | ----------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:42`  | 42   | input label `fontSize`         | `'13px'`                | floating label font                                                         | `theme.spacing(3.25)`                                                                                                                          |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:43`  | 43   | label `top`                    | `'1px'`                 | label vertical offset                                                       | `theme.spacing(0.25)`                                                                                                                          |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:52`  | 52   | `MuiInputBase-root minHeight`  | `'36.67px'`             | input row minimum height                                                    | `theme.spacing(9.1675)`                                                                                                                        |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:56`  | 56   | `paddingRight`                 | `calc(12px + N * 28px)` | width reserved for end adornments                                           | already `calc(theme.spacing(3) + N * theme.spacing(7))` (theme-scaled px `calc()`)                                                             |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:83`  | 83   | focused fieldset `borderWidth` | `'1px'`                 | focus outline width                                                         | `theme.spacing(0.25)`                                                                                                                          |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:119` | 119  | `EndAdornmentContainer.right`  | `'14px'`                | end-adornment inset from right edge                                         | `theme.spacing(3.5)`                                                                                                                           |
| `src/Frontend/Components/Autocomplete/AutocompleteUtil.tsx:14`    | 14   | `minWidth`                     | `'24px'`                | end-adornment icon wrapper (`occurrenceChipClass`, used at lines 34 and 60) | `spacing(OCCURRENCE_CHIP_MIN_WIDTH_IN_THEME_UNITS)` (= 6 units = 24px) in module-scope `occurrenceChipClass` (deduped from the two chip spots) |

### _DONE_ AuditingOptions

| File                                                                                   | Line | Property         | Value               | Determines                                         | Converted to                                                                                                                                                                                              |
| -------------------------------------------------------------------------------------- | ---- | ---------------- | ------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/Frontend/Components/AttributionForm/AuditingOptions/AuditingOptions.util.tsx:266` | 266  | `width`/`height` | `'19px'` / `'19px'` | satisfaction icons (also lines 273, 280, 287, 295) | `spacing(AUDITING_OPTION_ICON_THEME_SIZE)` (= 4.75 theme units, 19px) in module-scope `satisfactionIconClass`, deduped via a sx theme callback (values, e.g. `width`/`height`, are not auto-scaled by sx) |

The size token lives in `src/Frontend/shared-styles.ts` (`AUDITING_OPTION_ICON_THEME_SIZE`) and is shared with the SelectMenu icon column (see below).

### _DONE_ BarChart

The values are read from the MUI theme at runtime via `useTheme()` (PieChart precedent), because recharts consumes plain object values (`tick`/`style` props and numeric `margin`/`offset`), not theme-unit sx shorthands — sx theme-unit numbers would be raw pixels here:

| File                                               | Line  | Property             | Value                               | Determines                     | Converted to                                                                                                                                                                                                                                       |
| -------------------------------------------------- | ----- | -------------------- | ----------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/Frontend/Components/BarChart/BarChart.tsx:38` | 38    | `tickStyle.fontSize` | `'12px'`                            | axis tick labels               | `theme.typography.caption.fontSize` (caption is 12px in `App.style.ts:48`)                                                                                                                                                                         |
| `src/Frontend/Components/BarChart/BarChart.tsx:48` | 48–52 | `RcBarChart margin`  | `{ left: 8, right: 10, bottom: 4 }` | chart plot-area margins        | theme-unit constants (`MARGIN_LEFT_IN_THEME_UNITS` = 2, `MARGIN_RIGHT_IN_THEME_UNITS` = 2.5, `MARGIN_BOTTOM_IN_THEME_UNITS` = 1), resolved numerically via `parseFloat(theme.spacing(units))` (= 8/10/4px) because recharts `margin` needs numbers |
| `src/Frontend/Components/BarChart/BarChart.tsx:57` | 57    | `RcLabel offset`     | `-3` (recharts px offset)           | x-axis label vertical position | `X_AXIS_LABEL_OFFSET_IN_THEME_UNITS` = 0.75 units (= 3px), passed negated                                                                                                                                                                          |

### _DONE_ CardList

| File                                               | Line | Property | Value                             | Determines         | Converted to                                                                                                                                                                                                                                                                                                               |
| -------------------------------------------------- | ---- | -------- | --------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/Frontend/Components/CardList/CardList.tsx:30` | 30   | `border` | `'1px solid rgba(0, 0, 0, 0.12)'` | card outline width | fully theme-driven via `useTheme()`: width `theme.spacing(BORDER_WIDTH_IN_THEME_UNITS)` (`BORDER_WIDTH_IN_THEME_UNITS` = 0.25 units = 1px with the 4px spacing unit), color `theme.palette.divider` (= MUI's default `rgba(0, 0, 0, 0.12)`; other repo borders, e.g. `DiffPopup.style.ts:146`, still keep a literal `1px`) |

### _DONE_ ConfirmAttributionActionPopup

All three values are exact conversions via the theme spacing scale (4px unit: 145 units = 580px, 25 units = 100px, 100 units = 400px), resolved at runtime through the theme — they follow the spacing unit if it ever changes. The `145`/`25` call arguments carry a justified `no-magic-numbers` disable comment (`100` is in the rule's allowlist; report precedent: `ReportTableItem.tsx`). Unit tests render these components without `ThemeProvider` (MUI default spacing of 8 applies there), so the pixel fidelity described here refers to the app runtime under the app theme (`App.style.ts`, unit 4):

| File                                                                                              | Line | Property                  | Value     | Determines                     | Converted to                                                                                         |
| ------------------------------------------------------------------------------------------------- | ---- | ------------------------- | --------- | ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `src/Frontend/Components/ConfirmAttributionActionPopup/ConfirmAttributionActionPopup.tsx:111`     | 111  | `NotificationPopup width` | `580`     | popup width                    | `theme.spacing(145)` via `useTheme()` ( lands in the dialog-paper sx of `NotificationPopup.tsx:56` ) |
| `src/Frontend/Components/ConfirmAttributionActionPopup/ConfirmAttributionActionPopup.tsx:142`     | 142  | `minHeight`               | `'100px'` | content box minimum height     | `theme.spacing(25)` via `useTheme()`                                                                 |
| `src/Frontend/Components/ConfirmAttributionActionPopup/ConfirmAttributionActionPopup.style.ts:15` | 15   | `height`                  | `'400px'` | resource tree container height | `theme.spacing(100)` in the `styled()` theme callback                                                |

### _DONE_ ConfirmReplacePopup

Exact conversion via the theme spacing scale (4px unit: 125 units = 500px), same caveats as _DONE_ ConfirmAttributionActionPopup above (scale-coupling; unit tests render without `ThemeProvider`):

| File                                                                      | Line | Property                  | Value | Determines  | Converted to                          |
| ------------------------------------------------------------------------- | ---- | ------------------------- | ----- | ----------- | ------------------------------------- |
| `src/Frontend/Components/ConfirmReplacePopup/ConfirmReplacePopup.tsx:154` | 154  | `NotificationPopup width` | `500` | popup width | `theme.spacing(125)` via `useTheme()` |

### DiffPopup

The `DiffEndIcon` component (24px undo/redo icons) no longer exists; the popup's transfer/undo controls are now styled inline in `DiffPopup.style.ts`:

| File                                                       | Line | Property                             | Value                                                        | Determines                                                   |
| ---------------------------------------------------------- | ---- | ------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| `src/Frontend/Components/DiffPopup/DiffPopup.style.ts:10`  | 10   | `comparisonGrid.gridTemplateColumns` | `'minmax(0, 1fr) 32px minmax(0, 1fr)'`                       | fixed 32px middle (transfer) column                          |
| `src/Frontend/Components/DiffPopup/DiffPopup.style.ts:125` | 125  | `transferButton.borderRadius`        | `'3px'`                                                      | transfer button corner radius                                |
| `src/Frontend/Components/DiffPopup/DiffPopup.style.ts:127` | 127  | `transferButton.height`              | `'20px'`                                                     | transfer button height                                       |
| `src/Frontend/Components/DiffPopup/DiffPopup.style.ts:129` | 129  | `transferButton.width`               | `'24px'`                                                     | transfer button width                                        |
| `src/Frontend/Components/DiffPopup/DiffPopup.style.ts:146` | 146  | `attributionTypeUndo.border`         | `` `1px solid ...` ``                                        | undo button ring width                                       |
| `src/Frontend/Components/DiffPopup/DiffPopup.style.ts:148` | 148  | `attributionTypeUndo.width`/`height` | `24` / `24` (unitless)                                       | hover undo button size (also line 154)                       |
| `src/Frontend/Components/DiffPopup/DiffPopup.tsx:106-107`  | 106  | `NotificationPopup width`/`height`   | `'min(1200px, calc(100vw - 32px))'` / `'calc(100vh - 64px)'` | popup size (pixel bounds + viewport calc; see viewport note) |

### ErrorFallback

| File                                                              | Line | Property   | Value     | Determines              |
| ----------------------------------------------------------------- | ---- | ---------- | --------- | ----------------------- |
| `src/Frontend/Components/ErrorFallback/ErrorFallback.style.ts:22` | 22   | `maxWidth` | `'600px'` | error box maximum width |

### ProcessPopup

Grid column track widths of the log grid (the `columnGap` itself is theme-scaled and documented in the spacing part):

| File                                                            | Line | Property                             | Value             | Determines                                                              |
| --------------------------------------------------------------- | ---- | ------------------------------------ | ----------------- | ----------------------------------------------------------------------- |
| `src/Frontend/Components/ProcessPopup/ProcessPopup.style.ts:18` | 18   | `GridLogDisplay gridTemplateColumns` | `'24px 80px 1fr'` | severity icon column (24px) and timestamp column (80px) of the log grid |

### FilterButton

| File                                                        | Line  | Property                          | Value             | Determines                   |
| ----------------------------------------------------------- | ----- | --------------------------------- | ----------------- | ---------------------------- |
| `src/Frontend/Components/FilterButton/FilterButton.tsx:81`  | 81–83 | badge `minWidth`/`width`/`height` | `'8px'` each      | active-filter badge dot size |
| `src/Frontend/Components/FilterButton/FilterButton.tsx:84`  | 84–85 | badge `top` / `right`             | `'4px'` / `'4px'` | badge dot offset             |
| `src/Frontend/Components/FilterButton/FilterButton.tsx:120` | 120   | `SelectMenu width`                | `336`             | filter dropdown width        |

### GroupedList

| File                                                          | Line | Property                      | Value    | Determines              |
| ------------------------------------------------------------- | ---- | ----------------------------- | -------- | ----------------------- |
| `src/Frontend/Components/GroupedList/GroupedList.style.ts:11` | 11   | `GroupContainer.height`       | `'20px'` | group header row height |
| `src/Frontend/Components/GroupedList/GroupedList.style.ts:21` | 21   | `StyledLinearProgress.height` | `2`      | progress bar thickness  |

### Icons

| File                                          | Line | Property              | Value    | Determines                       |
| --------------------------------------------- | ---- | --------------------- | -------- | -------------------------------- |
| `src/Frontend/Components/Icons/Icons.tsx:32`  | 32   | `resourceIcon.width`  | `'18px'` | resource tree icon size          |
| `src/Frontend/Components/Icons/Icons.tsx:33`  | 33   | `resourceIcon.height` | `'18px'` | resource tree icon size          |
| `src/Frontend/Components/Icons/Icons.tsx:294` | 294  | `strokeWidth`         | `0.5`    | classification icon stroke width |

### ImportDialog / MergeOpossumFilesDialog / SplitDialog

| File                                                                              | Line    | Property                                | Value                 | Determines         |
| --------------------------------------------------------------------------------- | ------- | --------------------------------------- | --------------------- | ------------------ |
| `src/Frontend/Components/ImportDialog/ImportDialog.tsx:111`                       | 111–112 | `NotificationPopup minWidth`/`maxWidth` | `'300px'` / `'700px'` | popup width bounds |
| `src/Frontend/Components/MergeOpossumFilesDialog/MergeOpossumFilesDialog.tsx:149` | 149–150 | `minWidth`/`maxWidth`                   | `'300px'` / `'700px'` | popup width bounds |
| `src/Frontend/Components/SplitDialog/SplitDialog.tsx:94`                          | 94–95   | `minWidth`/`maxWidth`                   | `'300px'` / `'700px'` | popup width bounds |

### List

| File                                            | Line | Property                        | Value | Determines                    |
| ----------------------------------------------- | ---- | ------------------------------- | ----- | ----------------------------- |
| `src/Frontend/Components/List/List.style.ts:11` | 11   | `StyledLinearProgress.height`   | `2`   | progress bar thickness        |
| `src/Frontend/Components/List/List.tsx:24`      | 24   | `INFINITE_LIST_BOTTOM_OVERSCAN` | `600` | Virtuoso bottom overscan (px) |

### MultiResourcePicker

| File                                                                  | Line | Property               | Value                                                            | Determines                                        |
| --------------------------------------------------------------------- | ---- | ---------------------- | ---------------------------------------------------------------- | ------------------------------------------------- |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:12` | 12   | `INDENT_PER_LEVEL`     | `6` (theme units; was `'24px'` before the `spacing: 4` baseline) | tree indent per level                             |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:22` | 22   | `border`               | `'1px solid'`                                                    | resource tree container outline                   |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:24` | 24   | `borderRadius`         | `'4px'`                                                          | resource tree container corner                    |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:25` | 25   | `height`               | `'360px'`                                                        | resource tree container height                    |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:35` | 35   | `minHeight`            | `'24px'`                                                         | selected paths container min height               |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:53` | 53   | `minHeight`            | `'32px'`                                                         | resource row min height                           |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:62` | 62   | `TreeNodeSpacer.width` | `'28px'`                                                         | spacer before expand button                       |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:68` | 68   | `minWidth`             | `'34px'`                                                         | selection control size (square via `aspectRatio`) |

### PackageCard

| File                                                      | Line | Property    | Value                                                   | Determines             |
| --------------------------------------------------------- | ---- | ----------- | ------------------------------------------------------- | ---------------------- |
| `src/Frontend/Components/PackageCard/PackageCard.tsx:78`  | 78   | `boxShadow` | `theme.spacing(1)` (converted, was `inset 4px 0 0 ...`) | selection stripe width |
| `src/Frontend/Components/PackageCard/PackageCard.tsx:243` | 243  | `minWidth`  | `'24px'`                                                | confidence icon cell   |

### PathBar

| File                                             | Line | Property    | Value    | Determines              |
| ------------------------------------------------ | ---- | ----------- | -------- | ----------------------- |
| `src/Frontend/Components/PathBar/PathBar.tsx:41` | 41   | `minHeight` | `'24px'` | path bar row min height |

### PieChart

| File                                                | Line | Property                   | Value    | Determines           |
| --------------------------------------------------- | ---- | -------------------------- | -------- | -------------------- |
| `src/Frontend/Components/PieChart/PieChart.tsx:33`  | 33   | `legendTextStyle.fontSize` | `'12px'` | legend text font     |
| `src/Frontend/Components/PieChart/PieChart.tsx:43`  | 43   | `borderRadius`             | `'6px'`  | legend swatch corner |
| `src/Frontend/Components/PieChart/PieChart.tsx:44`  | 44   | swatch `height`            | `'12px'` | legend swatch size   |
| `src/Frontend/Components/PieChart/PieChart.tsx:45`  | 45   | swatch `width`             | `'12px'` | legend swatch size   |
| `src/Frontend/Components/PieChart/PieChart.tsx:75`  | 75   | `RcPie outerRadius`        | `70`     | pie radius           |
| `src/Frontend/Components/PieChart/PieChart.tsx:114` | 114  | `RcLegend width`           | `250`    | legend column width  |

### ProgressBar

| File                                                     | Line | Property | Value           | Determines        |
| -------------------------------------------------------- | ---- | -------- | --------------- | ----------------- |
| `src/Frontend/Components/ProgressBar/ProgressBar.tsx:31` | 31   | `border` | `2px solid ...` | bar outline width |
| `src/Frontend/Components/ProgressBar/ProgressBar.tsx:33` | 33   | `height` | `'20px'`        | bar height        |

### ProjectMetadataTable

| File                                                                       | Line | Property                | Value | Determines               |
| -------------------------------------------------------------------------- | ---- | ----------------------- | ----- | ------------------------ |
| `src/Frontend/Components/ProjectMetadataTable/ProjectMetadataTable.tsx:19` | 19   | `firstColumn.fontSize`  | `13`  | metadata table head font |
| `src/Frontend/Components/ProjectMetadataTable/ProjectMetadataTable.tsx:25` | 25   | `secondColumn.fontSize` | `11`  | metadata table body font |

### ProjectStatisticsPopup

| File                                                                                | Line | Property                   | Value                           | Determines                      |
| ----------------------------------------------------------------------------------- | ---- | -------------------------- | ------------------------------- | ------------------------------- |
| `src/Frontend/Components/ProjectStatisticsPopup/ProjectStatisticsPopup.tsx:94`      | 94   | `NotificationPopup width`  | `'min(95vw, max(550px, 85vw))'` | popup width (contains `550px`)  |
| `src/Frontend/Components/ProjectStatisticsPopup/ProjectStatisticsPopup.tsx:95`      | 95   | `NotificationPopup height` | `'min(95vh, max(550px, 75vh))'` | popup height (contains `550px`) |
| `src/Frontend/Components/ProjectStatisticsPopup/ProjectStatisticsPopup.tsx:299`     | 299  | chart grid `minHeight`     | `'220px'`                       | chart card minimum height       |
| `src/Frontend/Components/ProjectStatisticsPopup/ProjectStatisticsPopup.tsx:300`     | 300  | chart grid `minWidth`      | `'440px'`                       | chart card minimum width        |
| `src/Frontend/Components/ProjectStatisticsPopup/ProjectStatisticsPopup.tsx:301`     | 301  | chart grid `height`        | `'47%'`                         | chart card height (percentage)  |
| `src/Frontend/Components/ProjectStatisticsPopup/ProjectStatisticsPopup.style.ts:13` | 13   | `borderRadius`             | `'10px'`                        | popup corner radius             |

### ReportView column configuration / ReportTableItem / ReportTableHeader

| File                                                                 | Line   | Property                     | Value                                  | Determines                                                                                              |
| -------------------------------------------------------------------- | ------ | ---------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `src/Frontend/Components/ReportView/TableConfig.tsx:20`              | 20–23  | `COLUMN_WIDTHS` bucket sizes | `'40px' / '100px' / '320px' / '460px'` | width buckets (`verySmall`–`wide`) for all report table columns (applied as cell `minWidth`/`maxWidth`) |
| `src/Frontend/Components/ReportTableItem/ReportTableItem.tsx:41`     | 41     | `REPORT_VIEW_ROW_HEIGHT`     | `150`                                  | report view row height                                                                                  |
| `src/Frontend/Components/ReportTableItem/ReportTableItem.tsx:44`     | 44     | `PADDING_PX`                 | `10`                                   | row padding in px (4 × `PADDING`)                                                                       |
| `src/Frontend/Components/ReportTableItem/ReportTableItem.tsx:51`     | 51     | `tableData.height`           | `` `${150 - 2*10}px` -> `130px` ``     | table cell height                                                                                       |
| `src/Frontend/Components/ReportTableItem/ReportTableItem.tsx:59`     | 59     | `iconTableData.height`       | `130px` (derived)                      | icon cell height                                                                                        |
| `src/Frontend/Components/ReportTableItem/ReportTableItem.tsx:72`     | 72–73  | `borderRight`/`borderBottom` | `1px solid ...`                        | cell borders                                                                                            |
| `src/Frontend/Components/ReportTableItem/ReportTableItem.tsx:76`     | 76–77  | icon `width`/`height`        | `'15px'`                               | table icon size                                                                                         |
| `src/Frontend/Components/ReportTableItem/ReportTableItem.tsx:81`     | 81–104 | `border` (8 icon variants)   | `2px ... solid`                        | icon badge outlines                                                                                     |
| `src/Frontend/Components/ReportTableHeader/ReportTableHeader.tsx:16` | 16–17  | `headerRow.boxShadow`        | `'0px 2px 1px -1px ...'`               | header row elevation shadow geometry                                                                    |
| `src/Frontend/Components/ReportTableHeader/ReportTableHeader.tsx:20` | 20     | `borderRight`                | `1px solid ...`                        | header cell border                                                                                      |

### ResizePanels

| File                                                             | Line  | Property                                       | Value         | Determines                   |
| ---------------------------------------------------------------- | ----- | ---------------------------------------------- | ------------- | ---------------------------- |
| `src/Frontend/Components/ResizePanels/ResizePanels.style.ts:15`  | 15    | `HEADER_HEIGHT`                                | `32`          | panel header height          |
| `src/Frontend/Components/ResizePanels/ResizePanels.style.ts:19`  | 19–22 | button `width`/`minWidth`/`height`/`minHeight` | `'24px'` each | header icon button size      |
| `src/Frontend/Components/ResizePanels/ResizePanels.style.ts:56`  | 56    | `Search.height`                                | `'24px'`      | search field height          |
| `src/Frontend/Components/ResizePanels/ResizePanels.style.ts:101` | 101   | `StyledInputBase.maxWidth`                     | `'144px'`     | search input max width       |
| `src/Frontend/Components/ResizePanels/ResizePanels.style.ts:102` | 102   | `StyledInputBase.height`                       | `'24px'`      | search input height          |
| `src/Frontend/Components/ResizePanels/ResizePanels.style.ts:111` | 111   | input `width`                                  | `'120px'`     | collapsed search input width |
| `src/Frontend/Components/ResizePanels/ResizePanels.style.ts:113` | 113   | input `width` (focused)                        | `'120px'`     | focused search input width   |

### ResizableBox

| File                                                       | Line | Property                        | Value              | Determines                    |
| ---------------------------------------------------------- | ---- | ------------------------------- | ------------------ | ----------------------------- |
| `src/Frontend/Components/ResizableBox/ResizableBox.tsx:26` | 26   | right handle `width`/`right`    | `'6px'` / `'-6px'` | resize handle size and offset |
| `src/Frontend/Components/ResizableBox/ResizableBox.tsx:27` | 27   | left handle `width`/`left`      | `'6px'` / `'-3px'` | resize handle size and offset |
| `src/Frontend/Components/ResizableBox/ResizableBox.tsx:28` | 28   | top handle `height`             | `'6px'`            | resize handle size            |
| `src/Frontend/Components/ResizableBox/ResizableBox.tsx:29` | 29   | bottom handle `height`/`bottom` | `'6px'` / `'-3px'` | resize handle size and offset |

### SelectMenu

| File                                                          | Line  | Property                         | Value                 | Determines                                                                                                                                                                           |
| ------------------------------------------------------------- | ----- | -------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/Frontend/Components/SelectMenu/SelectMenu.style.tsx:47`  | 47    | `filter` drop-shadow             | `0px 2px 8px ...`     | paper shadow geometry                                                                                                                                                                |
| `src/Frontend/Components/SelectMenu/SelectMenu.style.tsx:55`  | 55    | anchor arrow `left`              | `'24px'`              | anchor arrow horizontal offset                                                                                                                                                       |
| `src/Frontend/Components/SelectMenu/SelectMenu.style.tsx:56`  | 56    | anchor arrow `right`             | `'calc(100% - 24px)'` | anchor arrow horizontal offset (right-anchored variant)                                                                                                                              |
| `src/Frontend/Components/SelectMenu/SelectMenu.style.tsx:59`  | 59–60 | anchor arrow `width`/`height`    | `10` / `10`           | anchor arrow size                                                                                                                                                                    |
| `src/Frontend/Components/SelectMenu/SelectMenu.style.tsx:92`  | 92–93 | `StyledCheckIcon width`/`height` | `'20px'` / `'20px'`   | check icon size                                                                                                                                                                      |
| `src/Frontend/Components/SelectMenu/SelectMenu.style.tsx:103` | 103   | `MenuItemContainer.height`       | `'38px'`              | menu item row height                                                                                                                                                                 |
| `src/Frontend/Components/SelectMenu/SelectMenu.tsx:110`       | 110   | `ListItemIcon minWidth`          | `'19px !important'`   | see below: converted to the shared `AUDITING_OPTION_ICON_THEME_SIZE` token (see _DONE_ AuditingOptions); `!important` kept to keep overriding MUI's default `ListItemIcon` min-width |

### SortButton

| File                                                    | Line | Property           | Value | Determines          |
| ------------------------------------------------------- | ---- | ------------------ | ----- | ------------------- |
| `src/Frontend/Components/SortButton/SortButton.tsx:116` | 116  | `SelectMenu width` | `200` | sort dropdown width |

### SwitchableProgressBar

| File                                                                         | Line | Property | Value     | Determines         |
| ---------------------------------------------------------------------------- | ---- | -------- | --------- | ------------------ |
| `src/Frontend/Components/SwitchableProgressBar/SwitchableProgressBar.tsx:28` | 28   | `width`  | `'150px'` | progress bar width |

### TextBox

| File                                             | Line | Property                         | Value    | Determines            |
| ------------------------------------------------ | ---- | -------------------------------- | -------- | --------------------- |
| `src/Frontend/Components/TextBox/TextBox.tsx:26` | 26   | input `borderRadius`             | `'0px'`  | input corner (square) |
| `src/Frontend/Components/TextBox/TextBox.tsx:32` | 32   | label `fontSize`                 | `'13px'` | floating label font   |
| `src/Frontend/Components/TextBox/TextBox.tsx:50` | 50   | focused fieldset `borderWidth`   | `'1px'`  | focus outline width   |
| `src/Frontend/Components/TextBox/TextBox.tsx:56` | 56   | highlighted input `borderRadius` | `'0px'`  | input corner (square) |

### Toaster

| File                                             | Line | Property | Value     | Determines            |
| ------------------------------------------------ | ---- | -------- | --------- | --------------------- |
| `src/Frontend/Components/Toaster/Toaster.tsx:28` | 28   | `width`  | `'340px'` | toast container width |

### TopBar

| File                                           | Line  | Property                        | Value               | Determines                                      |
| ---------------------------------------------- | ----- | ------------------------------- | ------------------- | ----------------------------------------------- |
| `src/Frontend/Components/TopBar/TopBar.tsx:28` | 28    | `root.height`                   | `'36px'`            | top bar height                                  |
| `src/Frontend/Components/TopBar/TopBar.tsx:33` | 33–34 | open-file icon `width`/`height` | `'18px'` / `'18px'` | open-file icon box (does not fill the 36px bar) |
| `src/Frontend/Components/TopBar/TopBar.tsx:50` | 50    | `viewButtons.width`             | `'80px'`            | Audit/Report toggle button width                |
| `src/Frontend/Components/TopBar/TopBar.tsx:53` | 53    | `viewButtons.border`            | `2px ... solid`     | toggle button outline width                     |
| `src/Frontend/Components/TopBar/TopBar.tsx:60` | 60    | selected toggle `border`        | `2px ... solid`     | selected toggle outline width                   |

### ValidationDisplay

| File                                                                 | Line  | Property                     | Value    | Determines                |
| -------------------------------------------------------------------- | ----- | ---------------------------- | -------- | ------------------------- |
| `src/Frontend/Components/ValidationDisplay/ValidationDisplay.tsx:37` | 37    | container `minHeight`        | `24`     | validation row min height |
| `src/Frontend/Components/ValidationDisplay/ValidationDisplay.tsx:47` | 47    | warning icon `fontSize`      | `16`     | warning icon size         |
| `src/Frontend/Components/ValidationDisplay/ValidationDisplay.tsx:62` | 62–63 | expand icon `height`/`width` | `'18px'` | expand/collapse icon size |

### ValueFilterAutocomplete

| File                                                                                          | Line | Property | Value    | Determines                                     |
| --------------------------------------------------------------------------------------------- | ---- | -------- | -------- | ---------------------------------------------- |
| `src/Frontend/Components/FilterButton/ValueFilterAutocomplete/ValueFilterAutocomplete.tsx:38` | 38   | `height` | `'38px'` | filter trigger height (matches 38px menu rows) |

### VirtualizedTree

| File                                                                                     | Line  | Property                        | Value               | Determines                           |
| ---------------------------------------------------------------------------------------- | ----- | ------------------------------- | ------------------- | ------------------------------------ |
| `src/Frontend/Components/VirtualizedTree/VirtualizedTreeNode/VirtualizedTreeNode.tsx:15` | 15    | `INDENT_PER_DEPTH_LEVEL`        | `12`                | indent per tree depth level (px)     |
| `src/Frontend/Components/VirtualizedTree/VirtualizedTreeNode/VirtualizedTreeNode.tsx:16` | 16    | `SIMPLE_FOLDER_EXTRA_INDENT`    | `16`                | extra indent for simple folders (px) |
| `src/Frontend/Components/VirtualizedTree/VirtualizedTreeNode/VirtualizedTreeNode.tsx:26` | 26    | `listNode.height`               | `'20px'`            | tree node row height                 |
| `src/Frontend/Components/VirtualizedTree/VirtualizedTreeNode/VirtualizedTreeNode.tsx:38` | 38–39 | clickable icon `width`/`height` | `'16px'` / `'20px'` | node icon button box                 |
| `src/Frontend/Components/VirtualizedTree/VirtualizedTreeNode/VirtualizedTreeNode.tsx:52` | 52–53 | expand icon `width`/`height`    | `'16px'` / `'20px'` | expand/collapse icon box             |
| `src/Frontend/Components/VirtualizedTree/VirtualizedTreeNode/VirtualizedTreeNode.tsx:64` | 64    | selected indicator `height`     | `'20px'`            | selection highlight height           |

### ResourceBrowser

| File                                                                                     | Line | Property | Value           | Determines                    |
| ---------------------------------------------------------------------------------------- | ---- | -------- | --------------- | ----------------------------- |
| `src/Frontend/Components/ResourceBrowser/LinkedResourcesTree/LinkedResourcesTree.tsx:71` | 71   | `border` | `1px solid ...` | linked resources tree outline |

(The formerly listed `ResourcesTreeNode.tsx:81 borderRadius: '3px'` favorite-badge corner no longer exists in this component; the surviving `'3px'` literal moved to the `matchesFilters` highlight in `shared-styles.ts:125`, see the shared-styles table.)

### AttributionCountPerSourcePerLicenseTableHead

| File                                                                                                                                                                | Line | Property       | Value                     | Determines       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | -------------- | ------------------------- | ---------------- |
| `src/Frontend/Components/AttributionCountPerSourcePerLicenseTable/AttributionCountPerSourcePerLicenseTableHead/AttributionCountPerSourcePerLicenseTableHead.tsx:17` | 17   | `borderRight`  | `'2px solid lightgray'`   | head cell border |
| `src/Frontend/Components/AttributionCountPerSourcePerLicenseTable/AttributionCountPerSourcePerLicenseTableHead/AttributionCountPerSourcePerLicenseTableHead.tsx:20` | 20   | `borderBottom` | `'1.5px solid lightgray'` | head cell border |

### ToggleHiddenSignalsButton

| File                                                                                                                | Line | Property | Value    | Determines               |
| ------------------------------------------------------------------------------------------------------------------- | ---- | -------- | -------- | ------------------------ |
| `src/Frontend/Components/AttributionPanels/SignalsPanel/ToggleHiddenSignalsButton/ToggleHiddenSignalsButton.tsx:32` | 32   | `height` | `'24px'` | toggle button row height |

### AttributionDetails

| File                                                                   | Line | Property                  | Value | Determines            |
| ---------------------------------------------------------------------- | ---- | ------------------------- | ----- | --------------------- |
| `src/Frontend/Components/AttributionDetails/AttributionDetails.tsx:35` | 35   | `loadingIndicator.height` | `2`   | loading bar thickness |

### PackagesPanel

| File                                                                                | Line   | Property                 | Value                       | Determines                            |
| ----------------------------------------------------------------------------------- | ------ | ------------------------ | --------------------------- | ------------------------------------- |
| `src/Frontend/Components/AttributionPanels/PackagesPanel/PackagesPanel.style.ts:12` | 12     | `ALERT_CONTAINER_HEIGHT` | `24`                        | alert strip height (px)               |
| `src/Frontend/Components/AttributionPanels/PackagesPanel/PackagesPanel.style.ts:13` | 13     | `TABS_CONTAINER_HEIGHT`  | `30`                        | tabs bar height (px)                  |
| `src/Frontend/Components/AttributionPanels/PackagesPanel/PackagesPanel.style.ts:26` | 26, 55 | `boxShadow`              | `'0px 2px 1px -1px ...'`    | elevation shadow geometry             |
| `src/Frontend/Components/AttributionPanels/PackagesPanel/PackagesPanel.style.ts:60` | 60     | tabs indicator `height`  | `'1px'`                     | tab underline thickness               |
| `src/Frontend/Components/AttributionPanels/PackagesPanel/PackagesPanel.tsx:634`     | 634    | `contentHeight` calc     | `'42px'` inside `calc(...)` | panel header offset in content height |

### Note: viewport- and percentage-based sizing

These values are hardcoded but not pixel-based, so they are listed separately:

| File                                                                              | Line  | Property               | Value                               | Determines                      |
| --------------------------------------------------------------------------------- | ----- | ---------------------- | ----------------------------------- | ------------------------------- |
| `src/Frontend/Components/App/App.style.ts:30`                                     | 30    | `ViewContainer.height` | `'100vh'`                           | app viewport height             |
| `src/Frontend/Components/Autocomplete/Listbox/Listbox.style.ts:27`                | 27    | `maxHeight`            | `'40vh'`                            | autocomplete listbox max height |
| `src/Frontend/Components/ImportDialog/ImportDialog.tsx:110`                       | 110   | `width`                | `'80vw'`                            | popup width                     |
| `src/Frontend/Components/DiffPopup/DiffPopup.tsx:106`                             | 106   | `width`                | `'min(1200px, calc(100vw - 32px))'` | popup width (viewport calc)     |
| `src/Frontend/Components/DiffPopup/DiffPopup.tsx:107`                             | 107   | `height`               | `'calc(100vh - 64px)'`              | popup height (viewport calc)    |
| `src/Frontend/Components/SplitDialog/SplitDialog.tsx:93`                          | 93    | `width`                | `'80vw'`                            | popup width                     |
| `src/Frontend/Components/MergeOpossumFilesDialog/MergeOpossumFilesDialog.tsx:148` | 148   | `width`                | `'80vw'`                            | popup width                     |
| `src/Frontend/Components/ProjectStatisticsPopup/ProjectStatisticsPopup.tsx:94`    | 94–95 | width/height bounds    | `95vw` / `85vw` / `75vh`            | popup size bounds               |
| `src/Frontend/Components/ProjectStatisticsPopup/ProjectStatisticsPopup.tsx:301`   | 301   | `height`               | `'47%'`                             | chart card height               |
| `src/Frontend/Components/PieChart/PieChart.tsx:34`                                | 34    | legend text `width`    | `'95%'`                             | legend text width               |

### Note: residual hardcoded spacing found during the dimensions scan

Status after re-applying the migrations reset by the rebase: most of these leftovers are now converted (rows above already describe the final state). What remains, and why:

| File                                                                       | Line | Property              | Value / status                                                                                                                              |
| -------------------------------------------------------------------------- | ---- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/Frontend/shared-styles.ts:140`                                        | 140  | padding               | `3` — raw `React.CSSProperties` for a recharts tooltip (`contentStyle`), not sx-processed; kept as literal 3px                              |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:56`           | 56   | paddingRight          | `` `calc(${theme.spacing(3)} + N * ${theme.spacing(7)})` `` — theme-scaled now, but inherently a px `calc()` (adornment-width compensation) |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:104`          | 104  | Popper flip `padding` | `64` — Popper.js modifier option (viewport boundary padding), not a CSS spacing property; kept                                              |
| `src/Frontend/Components/ProjectMetadataTable/ProjectMetadataTable.tsx:33` | 33   | marginBottom          | `6` — sx theme-unit value (= 24px), not a raw px literal; kept                                                                              |

Formerly listed here and now converted: `shared-styles.ts:52–53` (`baseIcon` → `p: 0.5`, `my: 0, mx: 0.5`), `shared-styles.ts:98` (→ `pr: 1.25`), `Autocomplete.style.tsx:56` (→ theme-scaled `calc()`), `ResourceBrowser.style.ts:13` (→ `p: 0.5`), `SelectMenu.style.tsx:48/101–102` (→ `mt: 1`, `paddingRight/Left` via `theme.spacing`), `Toaster.tsx:27` (→ `theme.spacing(2)`), `UpdateAppPopup.tsx:48` (→ `sx={{ ml: 3 }}`).

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

1. ~~**Add `spacing: 2` to existing theme**~~ — **Done**: `spacing: 4` is configured at `src/Frontend/Components/App/App.style.ts:36` (4px baseline, no new files). Theme is app-wide via `StyledEngineProvider` + `ThemeProvider` wrapping the application root in `AppContainer.tsx` (moved from `App.tsx` so that root-level siblings like `Toaster`, which is rendered outside `App`, also resolve `theme.spacing` correctly).

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
   - `calc()` expressions in `TextBox.tsx:202–205` — converted to sx theme-unit math (`3.5 + n * 5`)
   - The remaining `calc()` outliers documented in the residual note (`Autocomplete.style.tsx:56`, shared-styles chart tooltip) may remain as-is with documentation

3. **Consider design token export** — If Figma integration is desired, export the MUI spacing scale as design tokens

### Long-term

1. **Formal design system integration** — If/when the design system evolves, the spacing scale is already in place via MUI theme

2. **Automated enforcement** — ESLint rule to flag hardcoded pixel spacing values; pre-commit hook to catch new instances

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
// `spacing: 4` is already configured in App.style.ts (line 36)

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

**The technical debt of 95+ hardcoded pixel spacing values is solvable with a single change.**

The entire frontend (69+ components, app-wide theming) already uses MUI with a `StyledEngineProvider` + `ThemeProvider` wrapping the application root in `AppContainer.tsx` (this is where `App` and `Toaster` are composed, so both sit inside the provider). The theme is defined in `src/Frontend/Components/App/App.style.ts` and already configures `spacing: 4` (line 36), so the standardized spacing scale is available across all components. All spacing values documented in the tables above are now converted (see the residual note for the few deliberately kept outliers), including the conversions that the rebase had reset.

**Why this works:**

- MUI's `spacing: 4` uses a 4px baseline: `spacing(1)=4px`, `spacing(2)=8px`, `spacing(3)=12px`, etc.
- All 95+ hardcoded values map cleanly to the scale
- No new files, no breaking changes, no architecture overhaul required
- `sx` prop shorthand (`sx={{ p: 2, mb: 4 }}`) replaces `padding: '8px'`, `marginBottom: '16px'` everywhere

**Priority:** **Maintenance** — `spacing: 4` is in place in `App.style.ts`; the documented spacing values are migrated. Run `yarn typecheck` after future spacing changes to verify.
