// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiTooltip from '@mui/material/Tooltip';
import type { ReactElement, ReactNode } from 'react';

interface ChartActionTooltipProps {
  description?: ReactNode;
  children: ReactElement;
  onOpenChange?: (open: boolean) => void;
}

export function ChartActionTooltip({
  description,
  children,
  onOpenChange,
}: ChartActionTooltipProps) {
  return (
    <MuiTooltip
      title={description ?? ''}
      describeChild
      disableInteractive
      onOpen={() => onOpenChange?.(true)}
      onClose={() => onOpenChange?.(false)}
    >
      {children}
    </MuiTooltip>
  );
}
