<!--
SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>

SPDX-License-Identifier: CC0-1.0
-->

# Hardcoded Pixel Values for Spacing - Technical Debt Report

## Executive Summary

This report documents the widespread use of hardcoded pixel values for spacing (margin, padding, gap) across the OpossumUI codebase. A total of **95+ instances** of hardcoded pixel spacing values were found across 45+ component files, representing significant technical debt that hinders maintainability, theming, and responsive design.

The issue is pervasive because the codebase lacks a centralized spacing scale or design tokens, with spacing values scattered as string literals throughout component files.

## Scope of the Issue

**Total hardcoded spacing instances:** 95+ across 45+ files

**Affected properties:**

- `margin` / `marginTop` / `marginBottom` / `marginLeft` / `marginRight`
- `padding` / `paddingTop` / `paddingBottom` / `paddingLeft` / `paddingRight`
- `gap` (flex/grid gap)

**Value range:** 0px to 200px, with common values at 4px, 8px, 12px, 16px, 20px, 3px, 4px, 5px, 6px, 7px, 10px, 12px, 200px

## Detailed Occurrences by Component

### App

| File                                          | Line | Property       | Value   | Converted to          |
| --------------------------------------------- | ---- | -------------- | ------- | --------------------- |
| `src/Frontend/Components/App/App.style.ts:14` | 14   | `marginBottom` | `200px` | `theme.spacing(50)`   |
| `src/Frontend/Components/App/App.style.ts:83` | 83   | `padding`      | `5px`   | `theme.spacing(1.25)` |

### Autocomplete

| File                                                               | Line | Property        | Value      | Converted to             |
| ------------------------------------------------------------------ | ---- | --------------- | ---------- | ------------------------ |
| `src/Frontend/Components/Autocomplete/Listbox/Listbox.tsx:139`     | 139  | `paddingTop`    | `2px`      | `sx={{ p: 0.5 }}`        |
| `src/Frontend/Components/Autocomplete/Listbox/Listbox.tsx:185`     | 185  | `gap`           | `12px`     | `sx={{ gap: 3 }}`        |
| `src/Frontend/Components/Autocomplete/Listbox/Listbox.style.ts:14` | 14   | `gap`           | `8px`      | `theme.spacing(2)`       |
| `src/Frontend/Components/Autocomplete/Listbox/Listbox.style.ts:15` | 15   | `padding`       | `4px 10px` | `theme.spacing(1, 2.5)`  |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:40`   | 40   | `padding`       | `0px 3px`  | `theme.spacing(0, 0.75)` |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:50`   | 50   | `gap`           | `8px`      | `theme.spacing(1)`       |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:52`   | 52   | `paddingTop`    | `6px`      | `theme.spacing(1.5)`     |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:53`   | 53   | `paddingBottom` | `6px`      | `theme.spacing(1.5)`     |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:54`   | 54   | `paddingLeft`   | `12px`     | `theme.spacing(3)`       |
| `src/Frontend/Components/Autocomplete/Autocomplete.tsx:295`        | 295  | `padding`       | `4px`      | `sx={{ p: 1 }}`          |
| `src/Frontend/Components/Autocomplete/Autocomplete.tsx:304`        | 304  | `padding`       | `2px`      | `sx={{ p: 0.5 }}`        |

### Checkbox

| File                                               | Line | Property     | Value | Converted to       |
| -------------------------------------------------- | ---- | ------------ | ----- | ------------------ |
| `src/Frontend/Components/Checkbox/Checkbox.tsx:60` | 60   | `sx.padding` | `7px` | `sx={{ p: 1.75 }}` |

### ConfirmAttributionActionPopup

| File                                                                                              | Line | Property | Value | Converted to       |
| ------------------------------------------------------------------------------------------------- | ---- | -------- | ----- | ------------------ |
| `src/Frontend/Components/ConfirmAttributionActionPopup/ConfirmAttributionActionPopup.style.ts:12` | 12   | `gap`    | `8px` | `theme.spacing(2)` |

### ConfirmReplacePopup

| File                                                                      | Line | Property | Value | Converted to    |
| ------------------------------------------------------------------------- | ---- | -------- | ----- | --------------- |
| `src/Frontend/Components/ConfirmReplacePopup/ConfirmReplacePopup.tsx:152` | 152  | `sx.gap` | `8px` | `sx={{ p: 2 }}` |

### VirtualizedTree

| File                                                                                     | Line | Property  | Value | Converted to |
| ---------------------------------------------------------------------------------------- | ---- | --------- | ----- | ------------ |
| `src/Frontend/Components/VirtualizedTree/VirtualizedTreeNode/VirtualizedTreeNode.tsx:39` | 39   | `padding` | `0px` | `sx p: 0`    |
| `src/Frontend/Components/VirtualizedTree/VirtualizedTreeNode/VirtualizedTreeNode.tsx:40` | 40   | `margin`  | `0px` | `sx m: 0`    |
| `src/Frontend/Components/VirtualizedTree/VirtualizedTreeNode/VirtualizedTreeNode.tsx:53` | 53   | `padding` | `0px` | `sx p: 0`    |
| `src/Frontend/Components/VirtualizedTree/VirtualizedTreeNode/VirtualizedTreeNode.tsx:54` | 54   | `margin`  | `0px` | `sx m: 0`    |

### ErrorFallback

| File                                                              | Line | Property | Value  | Converted to       |
| ----------------------------------------------------------------- | ---- | -------- | ------ | ------------------ |
| `src/Frontend/Components/ErrorFallback/ErrorFallback.style.ts:19` | 19   | `gap`    | `20px` | `theme.spacing(5)` |

### FilePathInput

| File                                                         | Line | Property       | Value  | Converted to     |
| ------------------------------------------------------------ | ---- | -------------- | ------ | ---------------- |
| `src/Frontend/Components/FilePathInput/FilePathInput.tsx:55` | 55   | `sx.marginTop` | `20px` | `sx={{ mt: 5 }}` |

### MergeOpossumFilesDialog

| File                                                                              | Line | Property                    | Value  | Converted to       |
| --------------------------------------------------------------------------------- | ---- | --------------------------- | ------ | ------------------ |
| `src/Frontend/Components/MergeOpossumFilesDialog/MergeOpossumFilesDialog.tsx:179` | 179  | `sx.marginBottom`           | `10px` | `sx={{ mb: 2.5 }}` |
| `src/Frontend/Components/MergeOpossumFilesDialog/MergeOpossumFilesDialog.tsx:188` | 188  | `marginTop` (MuiAlert)      | `20px` | `sx={{ mt: 5 }}`   |
| `src/Frontend/Components/MergeOpossumFilesDialog/MergeOpossumFilesDialog.tsx:192` | 192  | `marginTop` (MuiTypography) | `20px` | `sx={{ mt: 5 }}`   |
| `src/Frontend/Components/MergeOpossumFilesDialog/MergeOpossumFilesDialog.tsx:196` | 196  | `marginTop` (MuiPaper)      | `10px` | `sx={{ mt: 2.5 }}` |
| `src/Frontend/Components/MergeOpossumFilesDialog/MergeOpossumFilesDialog.tsx:250` | 250  | `marginTop`                 | `20px` | `sx={{ mt: 5 }}`   |

### TopBar

| File                                           | Line | Property  | Value               | Converted to                          |
| ---------------------------------------------- | ---- | --------- | ------------------- | ------------------------------------- |
| `src/Frontend/Components/TopBar/TopBar.tsx:33` | 33   | `margin`  | `8px`               | `sx={{ mt: 2 }}`                      |
| `src/Frontend/Components/TopBar/TopBar.tsx:36` | 36   | `padding` | `2px`               | `sx={{ p: 0.5 }}`                     |
| `src/Frontend/Components/TopBar/TopBar.tsx:57` | 57   | `margin`  | `8px 12px 8px 12px` | `sx={{ mt: 2, mr: 3, mb: 2, ml: 3 }}` |

### PathBar

| File                                             | Line | Property  | Value | Converted to      |
| ------------------------------------------------ | ---- | --------- | ----- | ----------------- |
| `src/Frontend/Components/PathBar/PathBar.tsx:37` | 37   | `padding` | `8px` | `sx={{ p: 2 }}`   |
| `src/Frontend/Components/PathBar/PathBar.tsx:41` | 41   | `gap`     | `8px` | `sx={{ gap: 2 }}` |

### PackageCard

| File                                                     | Line | Property  | Value   | Converted to      |
| -------------------------------------------------------- | ---- | --------- | ------- | ----------------- |
| `src/Frontend/Components/PackageCard/PackageCard.tsx:37` | 37   | `padding` | `0 4px` | `sx={{ px: 1 }}`  |
| `src/Frontend/Components/PackageCard/PackageCard.tsx:38` | 38   | `gap`     | `4px`   | `sx={{ gap: 1 }}` |
| `src/Frontend/Components/PackageCard/PackageCard.tsx:50` | 50   | `gap`     | `8px`   | `sx={{ gap: 2 }}` |

### TextBox

| File                                              | Line | Property       | Value                     | Converted to                  |
| ------------------------------------------------- | ---- | -------------- | ------------------------- | ----------------------------- |
| `src/Frontend/Components/TextBox/TextBox.tsx:24`  | 24   | `padding`      | `1px 3px`                 | `sx={{ py: 0.25, px: 0.75 }}` |
| `src/Frontend/Components/TextBox/TextBox.tsx:28`  | 28   | `padding`      | `0px`                     | `sx={{ p: 0 }}`               |
| `src/Frontend/Components/TextBox/TextBox.tsx:53`  | 53   | `padding`      | `1px 3px`                 | `sx={{ py: 0.25, px: 0.75 }}` |
| `src/Frontend/Components/TextBox/TextBox.tsx:59`  | 59   | `marginLeft`   | `8px`                     | `sx={{ ml: 2 }}`              |
| `src/Frontend/Components/TextBox/TextBox.tsx:65`  | 65   | `marginRight`  | `8px`                     | `sx={{ mr: 2 }}`              |
| `src/Frontend/Components/TextBox/TextBox.tsx:142` | 142  | `paddingY`     | `8.5px`                   | `py: 2.125`                   |
| `src/Frontend/Components/TextBox/TextBox.tsx:127` | 127  | `marginLeft`   | `calc(... * 20px)`        | `sx={{ ml: n * 5 }}`          |
| `src/Frontend/Components/TextBox/TextBox.tsx:128` | 128  | `paddingLeft`  | `calc(14px + ... * 20px)` | `sx={{ pl: 3.5 + n * 5 }}`    |
| `src/Frontend/Components/TextBox/TextBox.tsx:144` | 144  | `paddingRight` | `calc(14px + ... * 20px)` | `sx={{ pr: 3.5 + n * 5 }}`    |

### ResizePanels

| File                                                             | Line | Property       | Value          | Converted to                                      |
| ---------------------------------------------------------------- | ---- | -------------- | -------------- | ------------------------------------------------- |
| `src/Frontend/Components/ResizePanels/ResizePanels.style.ts:38`  | 38   | `gap`          | `4px`          | `theme.spacing(1)`                                |
| `src/Frontend/Components/ResizePanels/ResizePanels.style.ts:39`  | 39   | `padding`      | `0 4px 0 12px` | `theme.spacing(0, 1, 0, 3)`                       |
| `src/Frontend/Components/ResizePanels/ResizePanels.style.ts:47`  | 47   | `marginTop`    | `2px`          | `theme.spacing(0.5)`                              |
| `src/Frontend/Components/ResizePanels/ResizePanels.style.ts:73`  | 73   | `padding`      | `0px 5px`      | `theme.spacing(0, 1.25)`                          |
| `src/Frontend/Components/ResizePanels/ResizePanels.style.ts:82`  | 82   | `padding`      | `0px 4px`      | `theme.spacing(0, 1)`                             |
| `src/Frontend/Components/ResizePanels/ResizePanels.style.ts:91`  | 91   | `padding`      | `2px`          | `theme.spacing(0.5)`                              |
| `src/Frontend/Components/ResizePanels/ResizePanels.style.ts:108` | 108  | `paddingRight` | `24px`         | `theme.spacing(6)` (conditional: `value ? 6 : 0`) |
| `src/Frontend/Components/ResizePanels/ResizePanels.style.ts:109` | 109  | `paddingLeft`  | `24px`         | `theme.spacing(6)`                                |

### SwitchableProgressBar

| File                                                                         | Line | Property       | Value  | Converted to      |
| ---------------------------------------------------------------------------- | ---- | -------------- | ------ | ----------------- |
| `src/Frontend/Components/SwitchableProgressBar/SwitchableProgressBar.tsx:21` | 21   | `marginLeft`   | `12px` | `sx={{ ml: 3 }}`  |
| `src/Frontend/Components/SwitchableProgressBar/SwitchableProgressBar.tsx:22` | 22   | `marginRight`  | `12px` | `sx={{ mr: 3 }}`  |
| `src/Frontend/Components/SwitchableProgressBar/SwitchableProgressBar.tsx:23` | 23   | `gap`          | `4px`  | `sx={{ gap: 1 }}` |
| `src/Frontend/Components/SwitchableProgressBar/SwitchableProgressBar.tsx:24` | 24   | `marginBottom` | `4px`  | `sx={{ mb: 1 }}`  |
| `src/Frontend/Components/SwitchableProgressBar/SwitchableProgressBar.tsx:25` | 25   | `marginTop`    | `4px`  | `sx={{ mt: 1 }}`  |

### Attribution Components

| File                                                                                         | Line | Property    | Value                  | Converted to           |
| -------------------------------------------------------------------------------------------- | ---- | ----------- | ---------------------- | ---------------------- |
| `src/Frontend/Components/AttributionDetails/ButtonRow/ButtonRow.style.ts:10`                 | 10   | `gap`       | `16px`                 | `theme.spacing(4)`     |
| `src/Frontend/Components/AttributionDetails/ButtonRow/ButtonRow.style.ts:13`                 | 13   | `padding`   | `12px`                 | `theme.spacing(3)`     |
| `src/Frontend/Components/AttributionPanels/SignalsPanel/SignalsList/SignalsList.style.ts:13` | 13   | `marginTop` | `1px`                  | `theme.spacing(0.25)`  |
| `src/Frontend/Components/AttributionForm/PackageSubPanel/PackageSubPanel.tsx:71`             | 71   | `gap`       | `8px`                  | `theme.spacing(2)`     |
| `src/Frontend/Components/AttributionForm/AuditingOptions/AuditingOptions.tsx:19`             | 19   | `gap`       | `8px` (flexWrap: wrap) | `sx={{ gap: 2 }}`      |
| `src/Frontend/Components/AttributionForm/AttributionForm.tsx:31`                             | 31   | `gap`       | `12px`                 | `sx={{ gap: 3 }}`      |
| `src/Frontend/Components/AttributionForm/AttributionForm.tsx:33`                             | 33   | `padding`   | `20px 20px 0 20px`     | `sx={{ p: 5, pt: 0 }}` |
| `src/Frontend/Components/AttributionForm/AttributionForm.style.ts:10`                        | 10   | `gap`       | `12px`                 | `sx={{ gap: 3 }}`      |

### SelectMenu

| File                                                         | Line | Property    | Value         | Converted to                         |
| ------------------------------------------------------------ | ---- | ----------- | ------------- | ------------------------------------ |
| `src/Frontend/Components/SelectMenu/SelectMenu.style.tsx:72` | 72   | `marginTop` | `8px` / `4px` | `theme.spacing(anchorArrow ? 2 : 1)` |
| `src/Frontend/Components/SelectMenu/SelectMenu.style.tsx:99` | 99   | `gap`       | `8px`         | `theme.spacing(2)`                   |     |

### SplitDialog

| File                                                                  | Line | Property                        | Value  | Converted to       |
| --------------------------------------------------------------------- | ---- | ------------------------------- | ------ | ------------------ |
| `src/Frontend/Components/SplitDialog/SplitDialog.tsx:137`             | 137  | `marginTop`                     | `20px` | `sx={{ mt: 5 }}`   |
| `src/Frontend/Components/SplitDialog/SplitDialog.tsx:141`             | 141  | `marginTop` (MuiLinearProgress) | `8px`  | `sx={{ mt: 2 }}`   |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:17` | 17   | `gap`                           | `12px` | `theme.spacing(3)` |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:26` | 26   | `padding`                       | `8px`  | `theme.spacing(2)` |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:33` | 33   | `gap`                           | `8px`  | `theme.spacing(2)` |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:70` | 70   | `marginLeft`                    | `8px`  | `theme.spacing(2)` |

### ProgressBar

| File                                                      | Line | Property    | Value | Converted to         |
| --------------------------------------------------------- | ---- | ----------- | ----- | -------------------- |
| `src/Frontend/Components/ProgressBar/ProgressBar.tsx:32`  | 32   | `marginTop` | `2px` | `sx={{ mt: 0.5 }}`   |
| `src/Frontend/Components/ProgressBar/ProgressBar.tsx:197` | 197  | `gap`       | `5px` | `sx={{ gap: 1.25 }}` |

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
| `src/Frontend/Components/ProjectStatisticsPopup/ProjectStatisticsPopup.style.ts:13` | 13   | `padding`      | `12px` | `theme.spacing(3)` |

### Icons

| File                                         | Line | Property       | Value | Converted to       |
| -------------------------------------------- | ---- | -------------- | ----- | ------------------ |
| `src/Frontend/Components/Icons/Icons.tsx:34` | 34   | `paddingLeft`  | `2px` | `sx={{ px: 0.5 }}` |
| `src/Frontend/Components/Icons/Icons.tsx:35` | 35   | `paddingRight` | `2px` | `sx={{ px: 0.5 }}` |

### GroupedList

| File                                                          | Line | Property  | Value      | Converted to            |
| ------------------------------------------------------------- | ---- | --------- | ---------- | ----------------------- |
| `src/Frontend/Components/GroupedList/GroupedList.style.ts:12` | 12   | `gap`     | `8px`      | `theme.spacing(2)`      |
| `src/Frontend/Components/GroupedList/GroupedList.style.ts:13` | 13   | `padding` | `4px 10px` | `theme.spacing(1, 2.5)` |

### ImportDialog

| File                                                        | Line | Property                       | Value  | Converted to       |
| ----------------------------------------------------------- | ---- | ------------------------------ | ------ | ------------------ |
| `src/Frontend/Components/ImportDialog/ImportDialog.tsx:125` | 125  | `sx.marginLeft`                | `10px` | `sx={{ ml: 2.5 }}` |
| `src/Frontend/Components/ImportDialog/ImportDialog.tsx:144` | 144  | `marginBottom` (MuiTypography) | `10px` | `sx={{ mb: 2.5 }}` |
| `src/Frontend/Components/ImportDialog/ImportDialog.tsx:156` | 156  | `marginBottom` (MuiTypography) | `10px` | `sx={{ mb: 2.5 }}` |
| `src/Frontend/Components/ImportDialog/ImportDialog.tsx:160` | 160  | `marginBottom` (MuiTypography) | `10px` | `sx={{ mb: 2.5 }}` |

### PieChart

| File                                               | Line | Property      | Value | Converted to                          |
| -------------------------------------------------- | ---- | ------------- | ----- | ------------------------------------- |
| `src/Frontend/Components/PieChart/PieChart.tsx:42` | 42   | `marginRight` | `4px` | `theme.spacing(1)` (via `useTheme()`) |

### Additional Files with Hardcoded Spacing

| File                                                                            | Line | Property     | Value                                                    | Converted to                                                         |
| ------------------------------------------------------------------------------- | ---- | ------------ | -------------------------------------------------------- | -------------------------------------------------------------------- |
| `src/Frontend/Components/ReportTableItem/ReportTableItem.tsx:55`                | 55   | `padding`    | `${PADDING}px 7px` (template literal with runtime value) | `py: PADDING, px: 1.75` (PADDING in theme units)                     |
| `src/Frontend/Components/AttributionForm/AttributionForm.tsx:33`                | 33   | `padding`    | `20px 20px 0 20px`                                       | `sx={{ p: 5, pt: 0 }}`                                               |
| `src/Frontend/Components/AttributionPanels/PackagesPanel/PackagesPanel.tsx:747` | 747  | `sx.padding` | `2px 0`                                                  | `sx={{ py: 0.5, px: 0 }}`                                            |
| `src/Frontend/Components/PackageCard/PackageCard.tsx:77`                        | 77   | `boxShadow`  | `inset 4px 0 0 ${OpossumColors.green}`                   | `boxShadow: (theme: Theme) => \`inset ${theme.spacing(1)} 0 0 ...\`` |

### Note: Pitfalls Found and Fixed During Migration

Two MUI v9 pitfalls caused earlier conversions to silently not apply. Both were found by verifying the runtime behavior of the installed `@mui/system`/`@mui/styled-engine` source and have been fixed across the codebase:

1. **`styled()` style objects are not processed through the sx system.** Shorthand keys (`p`, `px`, `py`, `pl`, `gap`, …) inside `styled()` objects are serialized as literal CSS: invalid property names are dropped by the browser, and `gap: N` applies as `Npx` instead of `N × 4px`. All affected `*.style.ts(x)` files now use the `({ theme }) => ({ ... theme.spacing(...) })` pattern instead (see ButtonRow, PackagesPanel, SignalsList, MultiResourcePicker, SelectMenu, GroupedList, ProjectStatisticsPopup, ErrorFallback, ResizePanels, TextBox, PackageSubPanel).

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

   The "Converted to" values in the tables above now describe styles that are genuinely applied at runtime.

## Hardcoded Pixel Values for Dimensions and Sizing

A repository-wide scan (excluding unit tests, test helpers, and e2e/performance tests) shows that hardcoded pixel values are not limited to margin/padding/gap: **150+ further instances across 45+ files** determine dimensions and sizing — element widths and heights, minimum/maximum sizes, font sizes, icon sizes, border widths, corner radii, positioning offsets, chart geometry, virtual-list geometry, and the Electron window size.

Scope conventions for the tables below:

- Unitless numbers (e.g. `height: 2`, `width={600}`) are pixel values by CSS/engine semantics and are listed with their effective px size.
- Zero values (`height: 0`, `top: 0`) and pure percentage values (`width: '100%'`, `borderRadius: '50%'`) are omitted; viewport-unit sizing is collected in a separate note at the end.
- Unlike margin/padding/gap, `width`/`height` are not auto-scaled by the `sx` prop (numbers there mean raw pixels), so a future migration needs `theme.spacing(...)` callbacks, shared dimension constants, or theme extensions (`theme.typography`, `theme.shape.borderRadius`) rather than plain sx shorthand.

### Shared styles and theme

| File                                          | Line | Property                                | Value               | Determines                                         |
| --------------------------------------------- | ---- | --------------------------------------- | ------------------- | -------------------------------------------------- |
| `src/Frontend/shared-styles.ts:50`            | 50   | `baseIcon.width`                        | `'15px'`            | size of all icons using `baseIcon`/`clickableIcon` |
| `src/Frontend/shared-styles.ts:51`            | 51   | `baseIcon.height`                       | `'15px'`            | icon size (see above)                              |
| `src/Frontend/shared-styles.ts:71`            | 71   | `tableClasses.head.fontSize`            | `13`                | table head font size                               |
| `src/Frontend/shared-styles.ts:76`            | 76   | `tableClasses.body.fontSize`            | `11`                | table body font size                               |
| `src/Frontend/shared-styles.ts:78`            | 78   | `tableClasses.body.maxWidth`            | `'200px'`           | max table cell width                               |
| `src/Frontend/shared-styles.ts:84`            | 84   | `tableClasses.footer.fontSize`          | `12`                | table footer font size                             |
| `src/Frontend/shared-styles.ts:133`           | 133  | `chartTooltipContentStyle.fontSize`     | `'12px'`            | recharts tooltip font size                         |
| `src/Frontend/shared-styles.ts:137`           | 137  | `chartTooltipContentStyle.borderRadius` | `'4px'`             | recharts tooltip corner radius                     |
| `src/Frontend/Components/App/App.style.ts:43` | 43   | `typography.body1.fontSize`             | `'14px'`            | app-wide body1 font size                           |
| `src/Frontend/Components/App/App.style.ts:44` | 44   | `typography.body1.lineHeight`           | `'20px'`            | body1 line box height                              |
| `src/Frontend/Components/App/App.style.ts:47` | 47   | `typography.body2.fontSize`             | `'14px'`            | app-wide body2 font size                           |
| `src/Frontend/Components/App/App.style.ts:48` | 48   | `typography.body2.lineHeight`           | `'18px'`            | body2 line box height                              |
| `src/Frontend/Components/App/App.style.ts:51` | 51   | `typography.caption.fontSize`           | `'12px'`            | app-wide caption font size                         |
| `src/Frontend/Components/App/App.style.ts:52` | 52   | `typography.caption.lineHeight`         | `'20px'`            | caption line box height                            |
| `src/Frontend/Components/App/App.style.ts:78` | 78   | `MuiInputBase` override `minHeight`     | `'36px !important'` | min height of every input in the app               |

### Electron main process

| File                                          | Line | Property               | Value  | Determines                |
| --------------------------------------------- | ---- | ---------------------- | ------ | ------------------------- |
| `src/ElectronBackend/main/createWindow.ts:27` | 27   | BrowserWindow `width`  | `1920` | initial app window width  |
| `src/ElectronBackend/main/createWindow.ts:28` | 28   | BrowserWindow `height` | `1080` | initial app window height |
| `src/ElectronBackend/main/createWindow.ts:29` | 29   | `minWidth`             | `500`  | minimum window width      |
| `src/ElectronBackend/main/createWindow.ts:30` | 30   | `minHeight`            | `400`  | minimum window height     |

### Autocomplete

| File                                                              | Line | Property                       | Value                   | Determines                                |
| ----------------------------------------------------------------- | ---- | ------------------------------ | ----------------------- | ----------------------------------------- |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:42`  | 42   | input label `fontSize`         | `'13px'`                | floating label font                       |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:43`  | 43   | label `top`                    | `'1px'`                 | label vertical offset                     |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:52`  | 52   | `MuiInputBase-root minHeight`  | `'36.67px'`             | input row minimum height                  |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:56`  | 56   | `paddingRight`                 | `calc(12px + N * 28px)` | width reserved for end adornments         |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:83`  | 83   | focused fieldset `borderWidth` | `'1px'`                 | focus outline width                       |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:119` | 119  | `EndAdornmentContainer.right`  | `'14px'`                | end-adornment inset from right edge       |
| `src/Frontend/Components/Autocomplete/AutocompleteUtil.tsx:27`    | 27   | `minWidth`                     | `'24px'`                | end-adornment icon wrapper (also line 53) |

### AuditingOptions

| File                                                                                   | Line | Property         | Value               | Determines                                         |
| -------------------------------------------------------------------------------------- | ---- | ---------------- | ------------------- | -------------------------------------------------- |
| `src/Frontend/Components/AttributionForm/AuditingOptions/AuditingOptions.util.tsx:321` | 321  | `width`/`height` | `'19px'` / `'19px'` | satisfaction icons (also lines 328, 335, 342, 350) |

### BarChart

| File                                               | Line | Property             | Value                               | Determines              |
| -------------------------------------------------- | ---- | -------------------- | ----------------------------------- | ----------------------- |
| `src/Frontend/Components/BarChart/BarChart.tsx:25` | 25   | `tickStyle.fontSize` | `'12px'`                            | axis tick labels        |
| `src/Frontend/Components/BarChart/BarChart.tsx:38` | 38   | `RcBarChart margin`  | `{ left: 8, right: 10, bottom: 4 }` | chart plot-area margins |

### CardList

| File                                               | Line | Property | Value                             | Determines         |
| -------------------------------------------------- | ---- | -------- | --------------------------------- | ------------------ |
| `src/Frontend/Components/CardList/CardList.tsx:29` | 29   | `border` | `'1px solid rgba(0, 0, 0, 0.12)'` | card outline width |

### ConfirmAttributionActionPopup

| File                                                                                              | Line | Property                  | Value     | Determines                     |
| ------------------------------------------------------------------------------------------------- | ---- | ------------------------- | --------- | ------------------------------ |
| `src/Frontend/Components/ConfirmAttributionActionPopup/ConfirmAttributionActionPopup.tsx:101`     | 101  | `NotificationPopup width` | `580`     | popup width                    |
| `src/Frontend/Components/ConfirmAttributionActionPopup/ConfirmAttributionActionPopup.tsx:130`     | 130  | `minHeight`               | `'100px'` | content box minimum height     |
| `src/Frontend/Components/ConfirmAttributionActionPopup/ConfirmAttributionActionPopup.style.ts:14` | 14   | `height`                  | `'400px'` | resource tree container height |

### ConfirmReplacePopup

| File                                                                      | Line | Property                  | Value | Determines  |
| ------------------------------------------------------------------------- | ---- | ------------------------- | ----- | ----------- |
| `src/Frontend/Components/ConfirmReplacePopup/ConfirmReplacePopup.tsx:151` | 151  | `NotificationPopup width` | `500` | popup width |

### DiffEndIcon

| File                                                     | Line  | Property           | Value       | Determines                                        |
| -------------------------------------------------------- | ----- | ------------------ | ----------- | ------------------------------------------------- |
| `src/Frontend/Components/DiffEndIcon/DiffEndIcon.tsx:14` | 14–15 | `width` / `height` | `24` / `24` | large undo/redo icons (overrides 15px `baseIcon`) |

### ErrorFallback

| File                                                              | Line | Property   | Value     | Determines              |
| ----------------------------------------------------------------- | ---- | ---------- | --------- | ----------------------- |
| `src/Frontend/Components/ErrorFallback/ErrorFallback.style.ts:22` | 22   | `maxWidth` | `'600px'` | error box maximum width |

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

| File                                                                  | Line | Property               | Value         | Determines                                        |
| --------------------------------------------------------------------- | ---- | ---------------------- | ------------- | ------------------------------------------------- |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:12` | 12   | `INDENT_PER_LEVEL`     | `'24px'`      | tree indent per level                             |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:22` | 22   | `border`               | `'1px solid'` | resource tree container outline                   |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:24` | 24   | `borderRadius`         | `'4px'`       | resource tree container corner                    |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:25` | 25   | `height`               | `'360px'`     | resource tree container height                    |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:35` | 35   | `minHeight`            | `'24px'`      | selected paths container min height               |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:53` | 53   | `minHeight`            | `'32px'`      | resource row min height                           |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:60` | 60   | `TreeNodeSpacer.width` | `'28px'`      | spacer before expand button                       |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:66` | 66   | `minWidth`             | `'34px'`      | selection control size (square via `aspectRatio`) |

### PackageCard

| File                                                      | Line | Property    | Value                                                   | Determines             |
| --------------------------------------------------------- | ---- | ----------- | ------------------------------------------------------- | ---------------------- |
| `src/Frontend/Components/PackageCard/PackageCard.tsx:77`  | 77   | `boxShadow` | `theme.spacing(1)` (converted, was `inset 4px 0 0 ...`) | selection stripe width |
| `src/Frontend/Components/PackageCard/PackageCard.tsx:241` | 241  | `minWidth`  | `'24px'`                                                | confidence icon cell   |

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

### ReportTableItem / ReportTableHeader

| File                                                                 | Line   | Property                     | Value                              | Determines                        |
| -------------------------------------------------------------------- | ------ | ---------------------------- | ---------------------------------- | --------------------------------- |
| `src/Frontend/Components/ReportTableItem/ReportTableItem.tsx:41`     | 41     | `REPORT_VIEW_ROW_HEIGHT`     | `150`                              | report view row height            |
| `src/Frontend/Components/ReportTableItem/ReportTableItem.tsx:44`     | 44     | `PADDING_PX`                 | `10`                               | row padding in px (4 × `PADDING`) |
| `src/Frontend/Components/ReportTableItem/ReportTableItem.tsx:51`     | 51     | `tableData.height`           | `` `${150 - 2*10}px` -> `130px` `` | table cell height                 |
| `src/Frontend/Components/ReportTableItem/ReportTableItem.tsx:59`     | 59     | `iconTableData.height`       | `130px` (derived)                  | icon cell height                  |
| `src/Frontend/Components/ReportTableItem/ReportTableItem.tsx:72`     | 72–73  | `borderRight`/`borderBottom` | `1px solid ...`                    | cell borders                      |
| `src/Frontend/Components/ReportTableItem/ReportTableItem.tsx:76`     | 76–77  | icon `width`/`height`        | `'15px'`                           | table icon size                   |
| `src/Frontend/Components/ReportTableItem/ReportTableItem.tsx:81`     | 81–104 | `border` (8 icon variants)   | `2px ... solid`                    | icon badge outlines               |
| `src/Frontend/Components/ReportTableHeader/ReportTableHeader.tsx:20` | 20     | `borderRight`                | `1px solid ...`                    | header cell border                |

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

| File                                                          | Line  | Property                         | Value               | Determines                     |
| ------------------------------------------------------------- | ----- | -------------------------------- | ------------------- | ------------------------------ |
| `src/Frontend/Components/SelectMenu/SelectMenu.style.tsx:47`  | 47    | `filter` drop-shadow             | `0px 2px 8px ...`   | paper shadow geometry          |
| `src/Frontend/Components/SelectMenu/SelectMenu.style.tsx:55`  | 55    | anchor arrow `left`              | `'24px'`            | anchor arrow horizontal offset |
| `src/Frontend/Components/SelectMenu/SelectMenu.style.tsx:59`  | 59–60 | anchor arrow `width`/`height`    | `10` / `10`         | anchor arrow size              |
| `src/Frontend/Components/SelectMenu/SelectMenu.style.tsx:92`  | 92–93 | `StyledCheckIcon width`/`height` | `'20px'` / `'20px'` | check icon size                |
| `src/Frontend/Components/SelectMenu/SelectMenu.style.tsx:103` | 103   | `MenuItemContainer.height`       | `'38px'`            | menu item row height           |
| `src/Frontend/Components/SelectMenu/SelectMenu.tsx:110`       | 110   | `ListItemIcon minWidth`          | `'19px !important'` | menu item icon column width    |

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
| `src/Frontend/Components/TextBox/TextBox.tsx:21` | 21   | input `borderRadius`             | `'0px'`  | input corner (square) |
| `src/Frontend/Components/TextBox/TextBox.tsx:27` | 27   | label `fontSize`                 | `'13px'` | floating label font   |
| `src/Frontend/Components/TextBox/TextBox.tsx:45` | 45   | focused fieldset `borderWidth`   | `'1px'`  | focus outline width   |
| `src/Frontend/Components/TextBox/TextBox.tsx:51` | 51   | highlighted input `borderRadius` | `'0px'`  | input corner (square) |

### Toaster

| File                                             | Line | Property | Value     | Determines            |
| ------------------------------------------------ | ---- | -------- | --------- | --------------------- |
| `src/Frontend/Components/Toaster/Toaster.tsx:28` | 28   | `width`  | `'340px'` | toast container width |

### TopBar

| File                                           | Line  | Property                        | Value               | Determines                                      |
| ---------------------------------------------- | ----- | ------------------------------- | ------------------- | ----------------------------------------------- |
| `src/Frontend/Components/TopBar/TopBar.tsx:28` | 28    | `root.height`                   | `'36px'`            | top bar height                                  |
| `src/Frontend/Components/TopBar/TopBar.tsx:35` | 35–36 | open-file icon `width`/`height` | `'18px'` / `'18px'` | open-file icon box (does not fill the 36px bar) |
| `src/Frontend/Components/TopBar/TopBar.tsx:43` | 43    | `viewButtons.width`             | `'80px'`            | Audit/Report toggle button width                |
| `src/Frontend/Components/TopBar/TopBar.tsx:46` | 46    | `viewButtons.border`            | `2px ... solid`     | toggle button outline width                     |
| `src/Frontend/Components/TopBar/TopBar.tsx:53` | 53    | selected toggle `border`        | `2px ... solid`     | selected toggle outline width                   |

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
| `src/Frontend/Components/VirtualizedTree/VirtualizedTreeNode/VirtualizedTreeNode.tsx:15` | 15    | `SIMPLE_FOLDER_EXTRA_INDENT`    | `16`                | extra indent for simple folders (px) |
| `src/Frontend/Components/VirtualizedTree/VirtualizedTreeNode/VirtualizedTreeNode.tsx:25` | 25    | `listNode.height`               | `'20px'`            | tree node row height                 |
| `src/Frontend/Components/VirtualizedTree/VirtualizedTreeNode/VirtualizedTreeNode.tsx:37` | 37–38 | clickable icon `width`/`height` | `'16px'` / `'20px'` | node icon button box                 |
| `src/Frontend/Components/VirtualizedTree/VirtualizedTreeNode/VirtualizedTreeNode.tsx:51` | 51–52 | expand icon `width`/`height`    | `'16px'` / `'20px'` | expand/collapse icon box             |
| `src/Frontend/Components/VirtualizedTree/VirtualizedTreeNode/VirtualizedTreeNode.tsx:63` | 63    | selected indicator `height`     | `'20px'`            | selection highlight height           |

### ResourceBrowser

| File                                                                                               | Line | Property       | Value           | Determines                    |
| -------------------------------------------------------------------------------------------------- | ---- | -------------- | --------------- | ----------------------------- |
| `src/Frontend/Components/ResourceBrowser/ResourcesTree/ResourcesTreeNode/ResourcesTreeNode.tsx:81` | 81   | `borderRadius` | `'3px'`         | favorite icon badge corner    |
| `src/Frontend/Components/ResourceBrowser/LinkedResourcesTree/LinkedResourcesTree.tsx:71`           | 71   | `border`       | `1px solid ...` | linked resources tree outline |

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
| `src/Frontend/Components/AttributionDetails/AttributionDetails.tsx:42` | 42   | `loadingIndicator.height` | `2`   | loading bar thickness |

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

| File                                                                              | Line  | Property               | Value                    | Determines                      |
| --------------------------------------------------------------------------------- | ----- | ---------------------- | ------------------------ | ------------------------------- |
| `src/Frontend/Components/App/App.style.ts:30`                                     | 30    | `ViewContainer.height` | `'100vh'`                | app viewport height             |
| `src/Frontend/Components/Autocomplete/Listbox/Listbox.style.ts:27`                | 27    | `maxHeight`            | `'40vh'`                 | autocomplete listbox max height |
| `src/Frontend/Components/ImportDialog/ImportDialog.tsx:110`                       | 110   | `width`                | `'80vw'`                 | popup width                     |
| `src/Frontend/Components/SplitDialog/SplitDialog.tsx:93`                          | 93    | `width`                | `'80vw'`                 | popup width                     |
| `src/Frontend/Components/MergeOpossumFilesDialog/MergeOpossumFilesDialog.tsx:148` | 148   | `width`                | `'80vw'`                 | popup width                     |
| `src/Frontend/Components/ProjectStatisticsPopup/ProjectStatisticsPopup.tsx:94`    | 94–95 | width/height bounds    | `95vw` / `85vw` / `75vh` | popup size bounds               |
| `src/Frontend/Components/ProjectStatisticsPopup/ProjectStatisticsPopup.tsx:301`   | 301   | `height`               | `'47%'`                  | chart card height               |
| `src/Frontend/Components/PieChart/PieChart.tsx:34`                                | 34    | legend text `width`    | `'95%'`                  | legend text width               |

### Note: residual hardcoded spacing found during the dimensions scan

The following margin/padding/gap values were missed by (or added after) the spacing migration in the tables above:

| File                                                                                                               | Line    | Property                   | Value                            |
| ------------------------------------------------------------------------------------------------------------------ | ------- | -------------------------- | -------------------------------- |
| `src/Frontend/shared-styles.ts:52`                                                                                 | 52–53   | padding / margin           | `'2px'` / `'0 2px'` (`baseIcon`) |
| `src/Frontend/shared-styles.ts:98`                                                                                 | 98      | paddingRight               | `'5px'`                          |
| `src/Frontend/shared-styles.ts:135`                                                                                | 135     | padding                    | `3` (chart tooltip)              |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:56`                                                   | 56      | paddingRight               | `calc(12px + N * 28px)`          |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:104`                                                  | 104     | Popper flip `padding`      | `64`                             |
| `src/Frontend/Components/AttributionCountPerSourcePerLicenseTable/AttributionCountPerSourcePerLicenseTable.tsx:29` | 29      | marginBottom               | `'3px'`                          |
| `src/Frontend/Components/DialogLogDisplay/DialogLogDisplay.style.ts:12`                                            | 12      | columnGap                  | `'4px'`                          |
| `src/Frontend/Components/LogDisplay/LogDisplay.tsx:41`                                                             | 41      | marginTop                  | `'1px'`                          |
| `src/Frontend/Components/AttributionForm/LicenseSubPanel/LicenseSubPanel.tsx:52`                                   | 52      | gap                        | `'8px'`                          |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:58`                                              | 58      | padding                    | `'4px'` (`ExpandButton`)         |
| `src/Frontend/Components/ProjectMetadataTable/ProjectMetadataTable.tsx:33`                                         | 33      | marginBottom               | `3`                              |
| `src/Frontend/Components/ResourceBrowser/ResourceBrowser.style.ts:13`                                              | 13      | padding                    | `'2px'`                          |
| `src/Frontend/Components/SelectMenu/SelectMenu.style.tsx:48`                                                       | 48      | marginTop                  | `'4px'`                          |
| `src/Frontend/Components/SelectMenu/SelectMenu.style.tsx:101`                                                      | 101–102 | paddingRight / paddingLeft | `'17px'` / `'12px'`              |
| `src/Frontend/Components/Toaster/Toaster.tsx:27`                                                                   | 27      | gap                        | `'8px'`                          |
| `src/Frontend/Components/UpdateAppPopup/UpdateAppPopup.tsx:48`                                                     | 48      | marginLeft                 | `'12px'`                         |

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

1. **Add `spacing: 2` to existing theme** — Edit `src/Frontend/Components/App/App.style.ts:37`
   - Add `spacing: 2` to the `createTheme({ ... })` call
   - This is MUI's default 8px baseline and requires no new files
   - Theme is already app-wide via `ThemeProvider` in `App.tsx`

2. **Verify typecheck passes** — Run `yarn typecheck` to confirm no errors

3. **Begin component migration** — Start replacing hardcoded pixel values with MUI `sx` prop shorthand in low-risk components:
   - `padding: '8px'` → `sx={{ p: 4 }}`
   - `marginBottom: '16px'` → `sx={{ mb: 8 }}`
   - `gap: '8px'` → `sx={{ gap: 4 }}`

### Medium-term (3-5 sprints)

1. **Complete component migration** — Systematically replace remaining hardcoded pixel values with theme scale values
   - Use `sx` prop: `sx={{ p: 8, mb: 12 }}` instead of `padding: '16px', marginBottom: '24px'`
   - Update styled components: `styled('div')({ p: 2, gap: 2 })` instead of inline pixel values

2. **Evaluate custom spacing values** — Address outliers not on MUI's scale:
   - `8.5px` in `TextBox.tsx:142` — may need custom theme extension or keep with documentation
   - `calc()` expressions in `TextBox.tsx:127-144` — icon-dependent, may remain as-is with comments

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
// Only requires adding `spacing: 4` to theme in App.style.ts

// Using MUI sx prop with theme-aware values
sx={{
  px: 4,                  // 16px (spacing(4) with theme spacing: 4)
  py: 5,                  // 20px (spacing(5))
  gap: 2,                 // 8px (spacing(2))
  mt: 4,                  // 16px (spacing(4))
}}

// Or with styled components using theme values
const StyledContainer = styled('div')({
  padding: 4,             // 16px
  gap: 2,                 // 8px
  marginTop: 4,           // 16px
});
```

## Conclusion

**The technical debt of 95+ hardcoded pixel spacing values is solvable with a single change.**

The entire frontend (69+ components, app-wide theming) already uses MUI with a `ThemeProvider` wrapping the application in `App.tsx`. The theme is defined in `src/Frontend/Components/App/App.style.ts` — adding `spacing: 8` to the `createTheme({ ... })` call is the only change needed to enable standardized spacing across all components.

**Why this works:**

- MUI's `spacing: 4` uses a 4px baseline: `spacing(1)=4px`, `spacing(2)=8px`, `spacing(3)=12px`, etc.
- All 95+ hardcoded values map cleanly to the scale
- No new files, no breaking changes, no architecture overhaul required
- `sx` prop shorthand (`sx={{ p: 2, mb: 4 }}`) replaces `padding: '8px'`, `marginBottom: '16px'` everywhere

**Priority:** **Immediate** — Add `spacing: 4` to `App.style.ts` and the spacing scale is instantly available across the entire application. The infrastructure already exists; only the configuration value is missing.

**Next step:** Edit `src/Frontend/Components/App/App.style.ts:37` to add `spacing: 4` to the theme config, then run `yarn typecheck` to verify.
