// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { styled } from '@mui/material/styles';
import { ResponsiveContainer as RcResponsiveContainer } from 'recharts';

export const ChartContainer = styled(RcResponsiveContainer)({
  '& svg:focus:not(:focus-visible), & svg [tabindex]:focus:not(:focus-visible)':
    {
      outline: 'none',
    },
});
