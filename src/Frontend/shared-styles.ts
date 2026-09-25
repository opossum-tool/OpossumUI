// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable @typescript-eslint/no-magic-numbers -- theme spacing values fed to theme.spacing / typography reads (exact 4px lattice: 3.75 = 15px icons, 50 = 200px widths, 1 = 4px, 0.75 = 3px radii/padding) */
import type { SxProps } from '@mui/material';
import type { Theme } from '@mui/material/styles';

import { Criticality } from '../shared/shared-types';
// pulls in the MUI TypographyVariants module augmentation
// (body3/dense variants) declared in app-typography.ts
import './app-typography';

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

export const baseIcon = {
  width: ({ spacing }: Theme) => spacing(3.75),
  height: ({ spacing }: Theme) => spacing(3.75),
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
    maxWidth: ({ spacing }: Theme) => spacing(50),
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
    borderRadius: ({ spacing }: Theme) => spacing(0.75),
  },
  notContainsResourcesWithOnlyExternalAttribution: {
    color: OpossumColors.pastelMiddleGreen,
  },
} as const satisfies SxProps<Theme>;

export const TRANSITION = 'all 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms';

export const AUDITING_OPTION_ICON_THEME_SIZE = 4.75;

export const PICKER_MODE_DISABLED_OPACITY = 0.5;
export const readonlyStyle = { opacity: 0.6 };

export const chartTooltipContentStyle = (
  theme: Theme,
): React.CSSProperties => ({
  fontSize: theme.typography.caption.fontSize,
  background: OpossumColors.grey,
  padding: theme.spacing(0.75),
  border: 0,
  borderRadius: theme.spacing(1),
});

export const chartTooltipTextStyle: React.CSSProperties = {
  color: OpossumColors.white,
  fontFamily: 'sans-serif',
};
