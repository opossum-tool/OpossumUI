// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { SxProps } from '@mui/system';
import { Resizable, type ResizableProps } from 're-resizable';

// Resize-handle geometry in px, consumed as plain CSS by re-resizable's
// handleStyles (not sx) — fixed widths/offsets, not spacing-scaled.
const HANDLE_SIZE = '6px';
const HANDLE_OFFSET = '3px';

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
  return (
    <Resizable
      style={{ ...(sx as React.CSSProperties) }}
      handleWrapperStyle={{ zIndex: 4 }}
      handleStyles={{
        right: {
          width: HANDLE_SIZE,
          right: `-${HANDLE_SIZE}`,
        }, // move outside of potential scrollbars
        left: { width: HANDLE_SIZE, left: `-${HANDLE_OFFSET}` },
        top: { height: HANDLE_SIZE, top: 0 }, // move outside of potential scrollbars
        bottom: {
          height: HANDLE_SIZE,
          bottom: `-${HANDLE_OFFSET}`,
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
