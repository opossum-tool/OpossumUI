// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type {
  TypographyStyle,
  TypographyVariantsOptions,
} from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface TypographyVariants {
    body3: TypographyStyle;
    dense: TypographyStyle;
  }

  interface TypographyVariantsOptions {
    body3?: Partial<TypographyStyle>;
    dense?: Partial<TypographyStyle>;
  }
}

export const typographyVariants: TypographyVariantsOptions = {
  fontFamily: ['Karla Variable', 'sans-serif'].join(','),
  body1: {
    fontSize: '14px',
    lineHeight: '20px',
  },
  body2: {
    fontSize: '14px',
    lineHeight: '18px',
  },
  body3: {
    fontSize: '13px',
    lineHeight: '20px',
  },
  dense: {
    fontSize: '11px',
    lineHeight: '18px',
  },
  caption: {
    fontSize: '12px',
    lineHeight: '20px',
  },
};
