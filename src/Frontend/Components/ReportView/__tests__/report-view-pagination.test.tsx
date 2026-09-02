// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act } from '@testing-library/react';

import {
  type Attributions,
  Criticality,
} from '../../../../shared/shared-types';
import { renderComponent } from '../../../test-helpers/render';
import { ReportView } from '../ReportView';

const testState = vi.hoisted(() => ({
  attributions: null as Attributions | null,
  fetchNextPage: vi.fn(() => Promise.resolve()),
  isFetchingNextPage: false,
  resultSetKey: 'result-set',
}));
const virtuosoMock = vi.hoisted(() => ({
  rangeChanged: undefined as
    ((range: { startIndex: number; endIndex: number }) => void) | undefined,
}));

vi.mock('../../../util/use-report-attributions-list', () => ({
  useReportAttributionsList: () => ({
    attributions: testState.attributions,
    fetchNextPage: testState.fetchNextPage,
    hasNextPage: true,
    isFetchingNextPage: testState.isFetchingNextPage,
    nextPageError: null,
    resultSetKey: testState.resultSetKey,
    totalCount: 20,
  }),
}));

vi.mock('react-virtuoso', async (importOriginal) => {
  const original = await importOriginal<object>();

  return {
    ...original,
    TableVirtuoso: ({
      rangeChanged,
    }: {
      rangeChanged?: (range: { startIndex: number; endIndex: number }) => void;
    }) => {
      virtuosoMock.rangeChanged = rangeChanged;
      return <div />;
    },
  };
});

describe('ReportView pagination', () => {
  beforeEach(() => {
    testState.fetchNextPage.mockClear();
    testState.resultSetKey = 'result-set';
  });

  it('discards the observed range when the result set is cleared', async () => {
    testState.attributions = makeAttributions('old', 1);
    testState.isFetchingNextPage = true;
    const { rerender } = await renderComponent(<ReportView />);

    act(() => {
      virtuosoMock.rangeChanged?.({ startIndex: 10, endIndex: 15 });
    });
    expect(testState.fetchNextPage).not.toHaveBeenCalled();

    testState.attributions = null;
    rerender(<ReportView />);
    testState.attributions = makeAttributions('new', 10);
    testState.isFetchingNextPage = false;
    rerender(<ReportView />);

    expect(testState.fetchNextPage).not.toHaveBeenCalled();
  });

  it('ignores an observed range from another result set', async () => {
    testState.attributions = makeAttributions('old', 1);
    testState.isFetchingNextPage = true;
    testState.resultSetKey = 'old';
    const { rerender } = await renderComponent(<ReportView />);

    act(() => {
      virtuosoMock.rangeChanged?.({ startIndex: 10, endIndex: 15 });
    });

    testState.attributions = makeAttributions('new', 10);
    testState.isFetchingNextPage = false;
    testState.resultSetKey = 'new';
    rerender(<ReportView />);

    expect(testState.fetchNextPage).not.toHaveBeenCalled();
  });
});

function makeAttributions(prefix: string, count: number): Attributions {
  return Object.fromEntries(
    Array.from({ length: count }, (_, index) => {
      const id = `${prefix}-${index}`;
      return [id, { id, resources: [], criticality: Criticality.None }];
    }),
  );
}
