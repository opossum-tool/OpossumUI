// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import CircleIcon from '@mui/icons-material/Circle';
import Box from '@mui/material/Box';

import { text } from '../../../shared/text';
import { Sizing } from '../../shared-styles';
import type { AiProgressBarSteps } from './ProgressBar.util';

const aiText = text.topBar.switchableProgressBar.aiBar;

export function AiProgressBarTooltip({ steps }: { steps: AiProgressBarSteps }) {
  const pendingCount = steps.deferredUnmodified.count;
  const formatCount = (count: number) => new Intl.NumberFormat().format(count);
  const rows = [
    {
      label: aiText.nonDeferred,
      unmodified: 'nonDeferredUnmodified',
      modified: 'nonDeferredModified',
    },
    {
      label: aiText.deferred,
      unmodified: 'deferredUnmodified',
      modified: 'deferredModified',
    },
  ] satisfies Array<{
    label: string;
    unmodified: keyof AiProgressBarSteps;
    modified: keyof AiProgressBarSteps;
  }>;

  return (
    <Box sx={{ whiteSpace: 'normal' }}>
      <Box sx={{ fontWeight: 'bold', mb: Sizing.Tiny }}>{aiText.intro}</Box>
      <Box sx={{ fontWeight: 'bold', mb: Sizing.Tiny }}>
        {aiText.needsManualInput}: {formatCount(pendingCount)}
      </Box>
      <Box
        component="table"
        aria-label={aiText.intro}
        sx={{
          width: '100%',
          tableLayout: 'fixed',
          borderSpacing: 0,
          '& th, & td': {
            py: Sizing.Tiny,
            px: Sizing.Tiny,
            verticalAlign: 'middle',
            overflowWrap: 'anywhere',
          },
          '& thead th': { textAlign: 'right' },
          '& thead th:first-of-type': { textAlign: 'left' },
          '& tbody th': { textAlign: 'left', fontWeight: 'normal' },
          '& td': { textAlign: 'right', fontVariantNumeric: 'tabular-nums' },
        }}
      >
        <thead>
          <tr>
            <th scope="col">{aiText.status}</th>
            <th scope="col">{aiText.unmodified}</th>
            <th scope="col">{aiText.humanModified}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              {[row.unmodified, row.modified].map((key) => (
                <td key={key}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: Sizing.Tiny,
                    }}
                  >
                    <CircleIcon
                      fontSize="inherit"
                      sx={{ color: steps[key].color, flexShrink: 0 }}
                    />
                    <span>{formatCount(steps[key].count)}</span>
                  </Box>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Box>
      <Box sx={{ mt: Sizing.Tiny }}>
        {pendingCount ? aiText.navigationHint : aiText.completed}
      </Box>
    </Box>
  );
}
