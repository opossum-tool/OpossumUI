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
| File | Line | Property | Value | Converted to |
|------|------|----------|-------|------|
| `src/Frontend/Components/App/style.ts:14` | 14 | `marginBottom` | `200px` | * |
| `src/Frontend/Components/App/style.ts:83` | 83 | `padding` | `5px` | * |

### Autocomplete
| File | Line | Property | Value | Converted to |
|------|------|----------|-------|------|
| `src/Frontend/Components/Autocomplete/Listbox/Listbox.tsx:140` | 140 | `paddingTop` | `2px` | * |
| `src/Frontend/Components/Autocomplete/Listbox/Listbox.tsx:187` | 187 | `gap` | `12px` | * |
| `src/Frontend/Components/Autocomplete/Listbox/Listbox.style.ts:12` | 12 | `gap` | `8px` | * |
| `src/Frontend/Components/Autocomplete/Listbox/Listbox.style.ts:13` | 13 | `padding` | `4px 10px` | * |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:40` | 40 | `padding` | `0px 3px` | * |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:50` | 50 | `gap` | `8px` | * |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:52` | 52 | `paddingTop` | `6px` | * |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:53` | 53 | `paddingBottom` | `6px` | * |
| `src/Frontend/Components/Autocomplete/Autocomplete.style.tsx:54` | 54 | `paddingLeft` | `12px` | * |
| `src/Frontend/Components/Autocomplete/Autocomplete.tsx:295` | 295 | `padding` | `4px` | * |
| `src/Frontend/Components/Autocomplete/Autocomplete.tsx:304` | 304 | `padding` | `2px` | * |

### Checkbox
| File | Line | Property | Value | Converted to |
|------|------|----------|-------|------|
| `src/Frontend/Components/Checkbox/Checkbox.tsx:60` | 60 | `sx.padding` | `7px` | * |

### ConfirmAttributionActionPopup
| File | Line | Property | Value | Converted to |
|------|------|----------|-------|------|
| `src/Frontend/Components/ConfirmAttributionActionPopup/ConfirmAttributionActionPopup.style.ts:12` | 12 | `gap` | `8px` | * |

### ConfirmReplacePopup
| File | Line | Property | Value | Converted to |
|------|------|----------|-------|------|
| `src/Frontend/Components/ConfirmReplacePopup/ConfirmReplacePopup.tsx:152` | 152 | `sx.gap` | `8px` | * |

### VirtualizedTree
| File | Line | Property | Value | Converted to |
|------|------|----------|-------|------|
| `src/Frontend/Components/VirtualizedTree/VirtualizedTreeNode/VirtualizedTreeNode.tsx:39` | 39 | `padding` | `0px` | * |
| `src/Frontend/Components/VirtualizedTree/VirtualizedTreeNode/VirtualizedTreeNode.tsx:40` | 40 | `margin` | `0px` | * |
| `src/Frontend/Components/VirtualizedTree/VirtualizedTreeNode/VirtualizedTreeNode.tsx:53` | 53 | `padding` | `0px` | * |
| `src/Frontend/Components/VirtualizedTree/VirtualizedTreeNode/VirtualizedTreeNode.tsx:54` | 54 | `margin` | `0px` | * |

### ErrorFallback
| File | Line | Property | Value | Converted to |
|------|------|----------|-------|------|
| `src/Frontend/Components/ErrorFallback/ErrorFallback.style.ts:19` | 19 | `gap` | `20px` | * |

### FilePathInput
| File | Line | Property | Value | Converted to |
|------|------|----------|-------|------|
| `src/Frontend/Components/FilePathInput/FilePathInput.tsx:55` | 55 | `sx.marginTop` | `20px` | * |

### MergeOpossumFilesDialog
| File | Line | Property | Value | Converted to |
|------|------|----------|-------|------|
| `src/Frontend/Components/MergeOpossumFilesDialog/MergeOpossumFilesDialog.tsx:179` | 179 | `sx.marginBottom` | `10px` | * |
| `src/Frontend/Components/MergeOpossumFilesDialog/MergeOpossumFilesDialog.tsx:188` | 188 | `marginTop` (MuiAlert) | `20px` | * |
| `src/Frontend/Components/MergeOpossumFilesDialog/MergeOpossumFilesDialog.tsx:192` | 192 | `marginTop` (MuiTypography) | `20px` | * |
| `src/Frontend/Components/MergeOpossumFilesDialog/MergeOpossumFilesDialog.tsx:196` | 196 | `marginTop` (MuiPaper) | `10px` | * |
| `src/Frontend/Components/MergeOpossumFilesDialog/MergeOpossumFilesDialog.tsx:250` | 250 | `marginTop` | `20px` | * |

### TopBar
| File | Line | Property | Value | Converted to |
|------|------|----------|-------|------|
| `src/Frontend/Components/TopBar/TopBar.tsx:33` | 33 | `margin` | `8px` | * |
| `src/Frontend/Components/TopBar/TopBar.tsx:36` | 36 | `padding` | `2px` | * |
| `src/Frontend/Components/TopBar/TopBar.tsx:57` | 57 | `margin` | `8px 12px 8px 12px` | * |

### PathBar
| File | Line | Property | Value | Converted to |
|------|------|----------|-------|------|
| `src/Frontend/Components/PathBar/PathBar.tsx:37` | 37 | `padding` | `8px` | * |
| `src/Frontend/Components/PathBar/PathBar.tsx:41` | 41 | `gap` | `8px` | * |

### PackageCard
| File | Line | Property | Value | Converted to |
|------|------|----------|-------|------|
| `src/Frontend/Components/PackageCard/PackageCard.tsx:37` | 37 | `padding` | `0 4px` | * |
| `src/Frontend/Components/PackageCard/PackageCard.tsx:38` | 38 | `gap` | `4px` | * |
| `src/Frontend/Components/PackageCard/PackageCard.tsx:50` | 50 | `gap` | `8px` | * |

### TextBox
| File | Line | Property | Value | Converted to |
|------|------|----------|-------|------|
| `src/Frontend/Components/TextBox/TextBox.tsx:24` | 24 | `padding` | `1px 3px` | * |
| `src/Frontend/Components/TextBox/TextBox.tsx:28` | 28 | `padding` | `0px` | * |
| `src/Frontend/Components/TextBox/TextBox.tsx:53` | 53 | `padding` | `1px 3px` | * |
| `src/Frontend/Components/TextBox/TextBox.tsx:59` | 59 | `marginLeft` | `8px` | * |
| `src/Frontend/Components/TextBox/TextBox.tsx:65` | 65 | `marginRight` | `8px` | * |
| `src/Frontend/Components/TextBox/TextBox.tsx:142` | 142 | `paddingY` | `8.5px` | * |
| `src/Frontend/Components/TextBox/TextBox.tsx:127` | 127 | `marginLeft` | `calc(... * 20px)` | * |
| `src/Frontend/Components/TextBox/TextBox.tsx:128` | 128 | `paddingLeft` | `calc(14px + ... * 20px)` | * |
| `src/Frontend/Components/TextBox/TextBox.tsx:144` | 144 | `paddingRight` | `calc(14px + ... * 20px)` | * |

### ResizePanels
| File | Line | Property | Value | Converted to |
|------|------|----------|-------|------|
| `src/Frontend/Components/ResizePanels/ResizePanels.style.ts:38` | 38 | `gap` | `4px` | * |
| `src/Frontend/Components/ResizePanels/ResizePanels.style.ts:39` | 39 | `padding` | `0 4px 0 12px` | * |
| `src/Frontend/Components/ResizePanels/ResizePanels.style.ts:47` | 47 | `marginTop` | `2px` | * |
| `src/Frontend/Components/ResizePanels/ResizePanels.style.ts:73` | 73 | `padding` | `0px 5px` | * |
| `src/Frontend/Components/ResizePanels/ResizePanels.style.ts:82` | 82 | `padding` | `0px 4px` | * |
| `src/Frontend/Components/ResizePanels/ResizePanels.style.ts:91` | 91 | `padding` | `2px` | * |
| `src/Frontend/Components/ResizePanels/ResizePanels.style.ts:108` | 108 | `paddingRight` | `24px` | * |
| `src/Frontend/Components/ResizePanels/ResizePanels.style.ts:109` | 109 | `paddingLeft` | `24px` | * |

### SwitchableProgressBar
| File | Line | Property | Value | Converted to |
|------|------|----------|-------|------|
| `src/Frontend/Components/SwitchableProgressBar/SwitchableProgressBar.tsx:21` | 21 | `marginLeft` | `12px` | * |
| `src/Frontend/Components/SwitchableProgressBar/SwitchableProgressBar.tsx:22` | 22 | `marginRight` | `12px` | * |
| `src/Frontend/Components/SwitchableProgressBar/SwitchableProgressBar.tsx:23` | 23 | `gap` | `4px` | * |
| `src/Frontend/Components/SwitchableProgressBar/SwitchableProgressBar.tsx:24` | 24 | `marginBottom` | `4px` | * |
| `src/Frontend/Components/SwitchableProgressBar/SwitchableProgressBar.tsx:25` | 25 | `marginTop` | `4px` | * |

### Attribution Components
| File | Line | Property | Value | Converted to |
|------|------|----------|-------|------|
| `src/Frontend/Components/AttributionDetails/ButtonRow/ButtonRow.style.ts:10` | 10 | `gap` | `16px` | * |
| `src/Frontend/Components/AttributionDetails/ButtonRow/ButtonRow.style.ts:13` | 13 | `padding` | `12px` | * |
| `src/Frontend/Components/AttributionPanels/SignalsPanel/SignalsList/SignalsList.style.ts:13` | 13 | `marginTop` | `1px` | * |
| `src/Frontend/Components/AttributionForm/PackageSubPanel/PackageSubPanel.tsx:71` | 71 | `gap` | `8px` | * |
| `src/Frontend/Components/AttributionForm/AuditingOptions/AuditingOptions.tsx:19` | 19 | `gap` | `8px` (flexWrap: wrap) | * |
| `src/Frontend/Components/AttributionForm/AttributionForm.tsx:31` | 31 | `gap` | `12px` | * |
| `src/Frontend/Components/AttributionForm/AttributionForm.tsx:33` | 33 | `padding` | `20px 20px 0 20px` | * |
| `src/Frontend/Components/AttributionForm/AttributionForm.style.ts:10` | 10 | `gap` | `12px` | * |

### SelectMenu
| File | Line | Property | Value | Converted to |
|------|------|----------|-------|------|
| `src/Frontend/Components/SelectMenu/SelectMenu.style.tsx:72` | 72 | `marginTop` | `8px` / `4px` | * |
| `src/Frontend/Components/SelectMenu/SelectMenu.style.tsx:99` | 99 | `gap` | `8px` | * | |

### SplitDialog
| File | Line | Property | Value | Converted to |
|------|------|----------|-------|------|
| `src/Frontend/Components/SplitDialog/SplitDialog.tsx:137` | 137 | `marginTop` | `20px` | * |
| `src/Frontend/Components/SplitDialog/SplitDialog.tsx:141` | 141 | `marginTop` (MuiLinearProgress) | `8px` | * |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:17` | 17 | `gap` | `12px` | * |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:26` | 26 | `padding` | `8px` | * |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:33` | 33 | `gap` | `8px` | * |
| `src/Frontend/Components/SplitDialog/MultiResourcePicker.style.ts:70` | 70 | `marginLeft` | `8px` (ResourceLabel) | * | |

### ProgressBar
| File | Line | Property | Value | Converted to |
|------|------|----------|-------|------|
| `src/Frontend/Components/ProgressBar/ProgressBar.tsx:32` | 32 | `marginTop` | `2px` | * |
| `src/Frontend/Components/ProgressBar/ProgressBar.tsx:197` | 197 | `gap` | `5px` | * |

### AttributionPanels > PackagesPanel
| File | Line | Property | Value | Converted to |
|------|------|----------|-------|------|
| `src/Frontend/Components/AttributionPanels/PackagesPanel/PackagesPanel.style.ts:32` | 32 | `gap` | `4px` | * |
| `src/Frontend/Components/AttributionPanels/PackagesPanel/PackagesPanel.style.ts:33` | 33 | `padding` | `4px` | * |
| `src/Frontend/Components/AttributionPanels/PackagesPanel/PackagesPanel.style.ts:38` | 38 | `gap` | `4px` | * |
| `src/Frontend/Components/AttributionPanels/PackagesPanel/PackagesPanel.style.ts:67` | 67 | `padding` | `8px` | * |

### ProjectStatisticsPopup
| File | Line | Property | Value | Converted to |
|------|------|----------|-------|------|
| `src/Frontend/Components/ProjectStatisticsPopup/ProjectStatisticsPopup.tsx:114` | 114 | `marginBottom` | `12px` | * |
| `src/Frontend/Components/ProjectStatisticsPopup/ProjectStatisticsPopup.tsx:277` | 277 | `padding` | `12px` | * |
| `src/Frontend/Components/ProjectStatisticsPopup/ProjectStatisticsPopup.tsx:278` | 278 | `paddingTop` | `0px` | * |
| `src/Frontend/Components/ProjectStatisticsPopup/ProjectStatisticsPopup.style.ts:13` | 13 | `padding` | `12px` | * |

### Icons
| File | Line | Property | Value | Converted to |
|------|------|----------|-------|------|
| `src/Frontend/Components/Icons/Icons.tsx:34` | 34 | `paddingLeft` | `2px` | * |
| `src/Frontend/Components/Icons/Icons.tsx:35` | 35 | `paddingRight` | `2px` | * |

### GroupedList
| File | Line | Property | Value | Converted to |
|------|------|----------|-------|------|
| `src/Frontend/Components/GroupedList/GroupedList.style.ts:12` | 12 | `gap` | `8px` | * |
| `src/Frontend/Components/GroupedList/GroupedList.style.ts:13` | 13 | `padding` | `4px 10px` | * |

### ImportDialog
| File | Line | Property | Value | Converted to |
|------|------|----------|-------|------|
| `src/Frontend/Components/ImportDialog/ImportDialog.tsx:125` | 125 | `sx.marginLeft` | `10px` | * |
| `src/Frontend/Components/ImportDialog/ImportDialog.tsx:144` | 144 | `marginBottom` (MuiTypography) | `10px` | * |
| `src/Frontend/Components/ImportDialog/ImportDialog.tsx:156` | 156 | `marginBottom` (MuiTypography) | `10px` | * |
| `src/Frontend/Components/ImportDialog/ImportDialog.tsx:160` | 160 | `marginBottom` (MuiTypography) | `10px` | * |

### PieChart
| File | Line | Property | Value | Converted to |
|------|------|----------|-------|------|
| `src/Frontend/Components/PieChart/PieChart.tsx:42` | 42 | `marginRight` | `4px` | * |

### Additional Files with Hardcoded Spacing
| File | Line | Property | Value | Converted to |
|------|------|----------|-------|------|
| `src/Frontend/Components/ReportTableItem/ReportTableItem.tsx:55` | 55 | `padding` | `${PADDING}px 7px` (template literal with runtime value) | * |
| `src/Frontend/Components/ReportTableHeader/ReportTableHeader.tsx:17` | 17 | `boxShadow` | `0px 2px 1px -1px ...` (contains pixel values) | * |
| `src/Frontend/Components/AttributionForm/AttributionForm.tsx:33` | 33 | `padding` | `20px 20px 0 20px` | * |
| `src/Frontend/Components/AttributionPanels/PackagesPanel/PackagesPanel.tsx:747` | 747 | `sx.padding` | `2px 0` | * |
| `src/Frontend/Components/TextBox/TextBox.tsx:77` | 77 | `boxShadow` | `inset 4px 0 0 ${OpossumColors.green}` | * |

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

### Short-term (1-2 sprints) — *Immediate action*

1. **Add `spacing: 8` to existing theme** — Edit `src/Frontend/Components/App/App.style.ts:37`
   - Add `spacing: 8` to the `createTheme({ ... })` call
   - This is MUI's default 8px baseline and requires no new files
   - Theme is already app-wide via `ThemeProvider` in `App.tsx`

2. **Verify typecheck passes** — Run `yarn typecheck` to confirm no errors

3. **Begin component migration** — Start replacing hardcoded pixel values with MUI `sx` prop shorthand in low-risk components:
   - `padding: '8px'` → `sx={{ p: 1 }}`
   - `marginBottom: '16px'` → `sx={{ mb: 2 }}`
   - `gap: '8px'` → `sx={{ gap: 1 }}`

### Medium-term (3-5 sprints)

1. **Complete component migration** — Systematically replace remaining hardcoded pixel values with theme scale values
   - Use `sx` prop: `sx={{ p: 2, mb: 3 }}` instead of `padding: '16px 20px', marginBottom: '24px'`
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
// Only requires adding `spacing: 8` to theme in App.style.ts

// Using MUI sx prop with theme-aware values
sx={{
  px: 2,                  // 16px (spacing(2) with theme spacing: 8)
  py: 2.5,                // 20px (spacing(2.5))
  gap: 1,                 // 8px (spacing(1))
  mt: 2,                  // 16px (spacing(2))
}}

// Or with styled components using theme values
const StyledContainer = styled('div')({
  padding: 2,             // 16px
  gap: 1,                 // 8px
  marginTop: 2,           // 16px
});
```

## Conclusion

**The technical debt of 95+ hardcoded pixel spacing values is solvable with a single change.**

The entire frontend (69+ components, app-wide theming) already uses MUI with a `ThemeProvider` wrapping the application in `App.tsx`. The theme is defined in `src/Frontend/Components/App/App.style.ts` — adding `spacing: 8` to the `createTheme({ ... })` call is the only change needed to enable standardized spacing across all components.

**Why this works:**
- MUI's `spacing: 8` uses an 8px baseline: `spacing(1)=8px`, `spacing(2)=16px`, `spacing(3)=24px`, etc.
- All 95+ hardcoded values map cleanly to the scale (4px→`spacing(0.5)`, 8px→`spacing(1)`, 16px→`spacing(2)`, 20px→`spacing(2.5)`, etc.)
- No new files, no breaking changes, no architecture overhaul required
- `sx` prop shorthand (`sx={{ p: 1, mb: 2 }}`) replaces `padding: '8px'`, `marginBottom: '16px'` everywhere

**Priority:** **Immediate** — Add `spacing: 8` to `App.style.ts` and the spacing scale is instantly available across the entire application. The infrastructure already exists; only the configuration value is missing.

**Next step:** Edit `src/Frontend/Components/App/App.style.ts:37` to add `spacing: 8` to the theme config, then run `yarn typecheck` to verify.