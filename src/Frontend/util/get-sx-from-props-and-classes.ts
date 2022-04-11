// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { SxProps } from '@mui/material';
import { SystemStyleObject } from '@mui/system/styleFunctionSx';

export type MuiSx = (
  | boolean
  | SystemStyleObject
  // eslint-disable-next-line @typescript-eslint/ban-types
  | ((theme: {}) => SystemStyleObject)
)[];

export function getSxFromPropsAndClasses({
  sxProps,
  styleClass,
}: {
  sxProps?: SxProps;
  styleClass?: SystemStyleObject;
}): MuiSx {
  return [
    styleClass ?? {},
    ...(sxProps ? (Array.isArray(sxProps) ? sxProps : [sxProps]) : [{}]),
  ];
}
