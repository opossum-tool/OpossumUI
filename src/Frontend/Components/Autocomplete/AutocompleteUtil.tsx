// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiChip from '@mui/material/Chip';
import MuiTooltip from '@mui/material/Tooltip';

import { text } from '../../../shared/text';
import { maybePluralize } from '../../util/maybe-pluralize';

export function renderOccuranceCount(count: number | undefined) {
  if (count === undefined) {
    return null;
  }

  return (
    <MuiTooltip
      title={maybePluralize(count, text.attributionColumn.occurrence, {
        showOne: true,
      })}
      enterDelay={500}
    >
      <MuiChip
        sx={{ minWidth: '24px' }}
        label={new Intl.NumberFormat('en-US', {
          notation: 'compact',
          compactDisplay: 'short',
        }).format(count)}
        size={'small'}
      />
    </MuiTooltip>
  );
}
