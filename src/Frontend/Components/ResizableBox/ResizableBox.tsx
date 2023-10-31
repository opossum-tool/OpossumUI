// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { SxProps } from '@mui/system';
import { Resizable, ResizableProps } from 're-resizable';

interface Props extends Omit<ResizableProps, 'sx' | 'style'> {
  children: React.ReactNode;
  sx?: SxProps;
}

export function ResizableBox({
  children,
  enable = {
    top: false,
    right: true,
    bottom: false,
    left: false,
    topRight: false,
    bottomRight: false,
    bottomLeft: false,
    topLeft: false,
  },
  sx,
  ...props
}: Props): React.ReactElement {
  return (
    <Resizable style={sx as React.CSSProperties} enable={enable} {...props}>
      {children}
    </Resizable>
  );
}
