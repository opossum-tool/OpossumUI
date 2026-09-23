// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable @typescript-eslint/no-magic-numbers -- theme spacing unit values (1.5 units = 6px handles, 0.75 units = 3px offsets) */
import { useTheme } from '@mui/material/styles';
import type { SxProps } from '@mui/system';
import { Resizable, type ResizableProps } from 're-resizable';

interface Props extends Omit<ResizableProps, 'sx' | 'style'> {
  children: React.ReactNode;
  ref?: React.RefObject<Resizable | null>;
  sx?: SxProps;
}

export const ResizableBox: React.FC<Props> = ({
  children,
  enable,
  ref,
  sx,
  ...props
}) => {
  const theme = useTheme();

  return (
    <Resizable
      style={{ ...(sx as React.CSSProperties) }}
      handleWrapperStyle={{ zIndex: 4 }}
      handleStyles={{
        right: {
          width: theme.spacing(1.5),
          right: `-${theme.spacing(1.5)}`,
        }, // move outside of potential scrollbars
        left: { width: theme.spacing(1.5), left: `-${theme.spacing(0.75)}` },
        top: { height: theme.spacing(1.5), top: 0 }, // move outside of potential scrollbars
        bottom: {
          height: theme.spacing(1.5),
          bottom: `-${theme.spacing(0.75)}`,
        },
      }}
      ref={ref}
      enable={{
        top: false,
        right: false,
        bottom: false,
        left: false,
        topRight: false,
        bottomRight: false,
        bottomLeft: false,
        topLeft: false,
        ...enable,
      }}
      {...props}
    >
      {children}
    </Resizable>
  );
};
