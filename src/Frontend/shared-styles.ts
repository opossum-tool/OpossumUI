// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { SxProps } from '@mui/material';
import type { Theme } from '@mui/material/styles';

import { Criticality } from '../shared/shared-types';
// pulls in the MUI TypographyVariants module augmentation
// (body3/dense variants) declared in app-typography.ts
import './app-typography';

/**
 * Commonly used values on the 4px theme spacing lattice.
 * Each entry carries its px meaning so call sites stay readable.
 */
export enum Sizing {
  /** 1 unit = 4px: tiny gaps, fine offsets, icon padding */
  Tiny = 1,
  /** 2 units = 8px: gap between related elements */
  SmallGap = 2,
  /** 3 units = 12px: standard block padding and medium gap */
  MediumPad = 3,
  /** 4 units = 16px: icon dimension or large gap */
  Large = 4,
  /** 5 units = 20px: default row, bar, or button height */
  Row = 5,
  /** 6 units = 24px: prominent controls, buffers between sections */
  Section = 6,
  /** 9 units = 36px: top-bar height */
  TopBar = 9,
  /** 20 units = 80px: top-bar view button width */
  WideButton = 20,
  /** 50 units = 200px: report table content width */
  Content = 50,
}

export const OpossumColors = {
  white: 'hsl(0, 0%, 100%)',
  whiteOnHover: 'hsl(220, 41%, 65%)',
  almostWhiteBlue: 'hsl(220, 41%, 97%)',
  lightestBlue: 'hsl(220, 41%, 92%)',
  lightestBlueOnHover: 'hsl(220, 41%, 75%)',
  lighterBlue: 'hsl(220, 41%, 87%)',
  lightBlue: 'hsl(220, 41%, 85%)',
  lightBlueOnHover: 'hsl(220, 41%, 75%)',
  middleBlue: 'hsl(220, 41%, 70%)',
  middleBlueOnHover: 'hsl(220, 41%, 60%)',
  darkBlue: 'hsl(220, 41%, 41%)',
  darkBlueOnHover: 'hsl(220, 41%, 65%)',
  disabledButtonGrey: 'hsla(0, 0%, 0%, 0.13)',
  disabledGrey: 'hsla(0, 0%, 0%, 0.26)',
  grey: 'hsla(0, 0%, 0%, 0.52)',
  lightGrey: 'hsla(0, 0%, 0%, 0.09)',
  lightestGrey: 'hsla(0, 0%, 0%, 0.04)',
  mediumGrey: 'hsla(0, 0%, 0%, 0.36)',
  darkGrey: 'hsla(0, 0%, 0%, 0.7)',
  black: 'hsl(0, 0%, 0%)',
  pastelLightGreen: 'hsl(146, 50%, 80%)',
  pastelMiddleGreen: 'hsl(146, 50%, 68%)',
  pastelDarkGreen: 'hsl(146, 50%, 55%)',
  green: 'hsl(146, 50%, 45%)',
  lightOrange: 'hsl(27, 100%, 94%)',
  lightOrangeOnHover: 'hsl(27, 100%, 89%)',
  mediumOrange: 'hsl(20, 100%, 72%)',
  orange: 'hsl(16, 100%, 50%)',
  pastelRed: 'hsl(0, 70%, 70%)',
  darkOrange: 'hsl(20, 80%, 78%)',
  darkOrangeOnHover: 'hsl(20, 80%, 65%)',
  red: 'hsl(0, 100%, 45%)',
  brown: 'hsl(33, 55%, 44%)',
};

export const criticalityColor = {
  [Criticality.High]: OpossumColors.orange,
  [Criticality.Medium]: OpossumColors.mediumOrange,
  [Criticality.None]: OpossumColors.darkBlue,
};

// Border-width and line-thickness tokens
export const borderThin = '1px';
export const borderMedium = '2px';
export const borderTableHead = '1.5px';

// Icon-size tokens. Plain px literals
export const baseIconSize = '15px';
export const resourceIconSize = '18px';
export const auditingOptionIconSize = '19px';
export const checkIconSize = '20px';
export const warningIconFontSize = '16px';
export const occurrenceChipMinWidth = '24px';
export const spinnerDefaultSize = 12;
export const buttonSpinnerSize = 16;

// Popup width bounds shared by the file import / merge / split dialogs.
export const popupMinWidth = '300px';
export const popupMaxWidth = '700px';
export const popupViewportWidth = '80vw';

export const baseIcon = {
  width: baseIconSize,
  height: baseIconSize,
  p: 0.5,
  my: 0,
  mx: 0.5,
} satisfies SxProps<Theme>;

export const clickableIcon = {
  ...baseIcon,
  color: OpossumColors.darkBlue,
  '&:hover': {
    background: OpossumColors.middleBlue,
  },
};

export const disabledIcon = {
  ...baseIcon,
  color: OpossumColors.disabledButtonGrey,
};

export const tableClasses = {
  head: {
    fontSize: (theme: Theme) => theme.typography.body3.fontSize,
    background: OpossumColors.darkBlue,
    color: OpossumColors.white,
  },
  body: {
    fontSize: (theme: Theme) => theme.typography.dense.fontSize,
    background: OpossumColors.lightestBlue,
    maxWidth: ({ spacing }: Theme) => spacing(Sizing.Content),
    overflow: 'auto',
    color: OpossumColors.black,
  },
  footer: {
    fontWeight: 'bold',
    fontSize: (theme: Theme) => theme.typography.caption.fontSize,
    background: OpossumColors.lightBlue,
    position: 'sticky',
    bottom: 0,
    color: OpossumColors.black,
  },
} satisfies SxProps<Theme>;

export const treeItemClasses = {
  labelRoot: {
    display: 'flex',
    alignItems: 'center',
  },
  text: {
    pr: 1.25,
  },
  breakpoint: {
    fontWeight: 'bold',
    color: OpossumColors.grey,
  },
  hasSignal: {
    color: OpossumColors.pastelRed,
  },
  hasAttribution: {
    color: OpossumColors.green,
  },
  hasParentWithManualAttribution: {
    color: OpossumColors.pastelMiddleGreen,
  },
  containsManualAttribution: {
    color: OpossumColors.pastelMiddleGreen,
  },
  containsManualAndExternalAttribution: {
    color: OpossumColors.middleBlue,
  },
  resourceWithoutInformation: {
    color: OpossumColors.disabledGrey,
  },
  matchesFilters: {
    backgroundColor: OpossumColors.lightBlue,
    borderRadius: ({ shape }: Theme) => shape.borderRadiusSmall,
  },
  notContainsResourcesWithOnlyExternalAttribution: {
    color: OpossumColors.pastelMiddleGreen,
  },
} as const satisfies SxProps<Theme>;

export const TRANSITION = 'all 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms';

export const PICKER_MODE_DISABLED_OPACITY = 0.5;
export const readonlyStyle = { opacity: 0.6 };

export const chartTooltipContentStyle = (
  theme: Theme,
): React.CSSProperties => ({
  fontSize: theme.typography.caption.fontSize,
  background: OpossumColors.grey,
  // 0.75 units = 3px tooltip padding
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  padding: theme.spacing(0.75),
  border: 0,
  borderRadius: theme.shape.borderRadiusDefault,
});

export const chartTooltipTextStyle: React.CSSProperties = {
  color: OpossumColors.white,
  fontFamily: 'sans-serif',
};
