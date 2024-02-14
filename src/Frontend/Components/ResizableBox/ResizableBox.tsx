// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SxProps } from '@mui/system';
import { Resizable, ResizableProps } from 're-resizable';
import { forwardRef } from 'react';

interface Props extends Omit<ResizableProps, 'sx' | 'style'> {
  children: React.ReactNode;
  sx?: SxProps;
}

export const ResizableBox = forwardRef<Resizable, Props>(
  ({ children, enable, sx, ...props }, ref) => {
    return (
      <Resizable
        style={{ ...(sx as React.CSSProperties) }}
        handleWrapperStyle={{ zIndex: 4 }}
        handleStyles={{
          right: { width: '6px', right: '-6px' }, // move outside of potential scrollbars
          left: { width: '6px', left: '-3px' },
          top: { height: '6px', top: 0 }, // move outside of potential scrollbars
          bottom: { height: '6px', bottom: '-3px' },
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
  },
);
