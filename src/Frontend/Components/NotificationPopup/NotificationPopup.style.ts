// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { SxProps, Theme } from '@mui/material/styles';

const SCROLLABLE_SECTION_MIN_HEIGHT = '100px';
const SCROLLABLE_SECTION_MAX_HEIGHT = '400px';
const SCROLLABLE_SECTION_MAX_VIEWPORT_HEIGHT = '40vh';

export const popupColumnContentSx = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  minHeight: 0,
} satisfies SxProps<Theme>;

export const popupFixedSectionSx = {
  flex: '0 0 auto',
} satisfies SxProps<Theme>;

export const popupScrollableSectionSx = {
  flex: '0 1 auto',
  minHeight: SCROLLABLE_SECTION_MIN_HEIGHT,
  maxHeight: `min(${SCROLLABLE_SECTION_MAX_HEIGHT}, ${SCROLLABLE_SECTION_MAX_VIEWPORT_HEIGHT})`,
  overflowY: 'auto',
  boxSizing: 'border-box',
} satisfies SxProps<Theme>;
