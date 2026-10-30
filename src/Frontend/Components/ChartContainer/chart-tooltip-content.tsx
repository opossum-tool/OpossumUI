// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useTheme } from '@mui/material/styles';
import type { CSSProperties } from 'react';

import { text } from '../../../shared/text';
import type { ChartDataItem } from '../../types/types';

interface ChartTooltipContentProps {
  item?: ChartDataItem;
  style?: CSSProperties;
  announce?: boolean;
}

export function ChartTooltipContent(props: ChartTooltipContentProps) {
  const theme = useTheme();
  const item = props.item;
  const description = item?.onActivate ? item.actionDescription : undefined;

  if (!item) {
    return null;
  }

  return (
    <div
      style={props.style}
      role={props.announce ? 'status' : undefined}
      aria-live={props.announce ? 'polite' : undefined}
    >
      <div>
        {item.name}: {item.count}
      </div>
      {description && (
        <div
          style={{
            marginTop: theme.spacing(1),
          }}
        >
          {text.projectStatisticsPopup.actions.clickTo(description)}
        </div>
      )}
    </div>
  );
}
