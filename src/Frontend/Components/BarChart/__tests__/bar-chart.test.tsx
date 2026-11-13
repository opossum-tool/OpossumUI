// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable testing-library/no-node-access -- recharts renders labels
   inside foreignObject elements that are only reachable via DOM queries */
import { screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import type * as Recharts from 'recharts';
import { expect, test, vi } from 'vitest';

import { text } from '../../../../shared/text';
import { renderWithTheme } from '../../../test-helpers/render';
import type { ChartDataItem } from '../../../types/types';
import { BarChart } from '../BarChart';

// Happy DOM cannot lay out responsive charts. Fix only their container size;
// render the real chart, labels, and axis.
vi.mock('recharts', async (importOriginal) => {
  const recharts = await importOriginal<typeof Recharts>();
  return {
    ...recharts,
    ResponsiveContainer: (
      props: ComponentProps<typeof recharts.ResponsiveContainer>,
    ) => <recharts.ResponsiveContainer {...props} width={800} height={600} />,
  };
});

const data: Array<ChartDataItem> = [
  { id: 'a', name: 'Needs Review', count: 3 },
  {
    id: 'b',
    name: 'Non-deferred, human-modified',
    count: 2,
  },
];

test('renders every bar label in full on a single line', () => {
  renderWithTheme(<BarChart data={data} />);
  const tickLabels = Array.from(
    document.querySelectorAll<HTMLElement>(
      'foreignObject .recharts-cartesian-axis-tick-value',
    ),
  );

  expect(tickLabels.map((label) => label.textContent)).toEqual(
    data.map((item) => item.name),
  );
  for (const label of tickLabels) {
    expect(label).toBeVisible();
    // Labels must not shrink to their widest word (min-content): the tick
    // foreignObject has a single-row height, so wrapped text would be clipped.
    expect(label.style.width).toBe('max-content');
  }
});

test('labels the count axis as attributions by default', () => {
  renderWithTheme(<BarChart data={data} />);

  expect(
    screen.getByText(text.projectStatisticsPopup.charts.count),
  ).toBeVisible();
});

test('uses a custom axis label when provided', () => {
  renderWithTheme(
    <BarChart
      data={data}
      axisLabel={text.projectStatisticsPopup.charts.aiAttributionStates.count}
    />,
  );

  expect(
    screen.getByText(
      text.projectStatisticsPopup.charts.aiAttributionStates.count,
    ),
  ).toBeVisible();
  expect(
    screen.queryByText(text.projectStatisticsPopup.charts.count),
  ).not.toBeInTheDocument();
});
