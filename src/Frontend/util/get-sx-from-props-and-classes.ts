// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { SxProps, Theme } from '@mui/material';
import { SystemStyleObject } from '@mui/system/styleFunctionSx';

export type MuiSx = (
  | boolean
  | SystemStyleObject
  | ((theme: Theme) => SystemStyleObject)
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
