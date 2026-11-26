// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, screen, waitFor } from '@testing-library/react';
import { type Ref, useImperativeHandle } from 'react';
import type { VirtuosoHandle, VirtuosoProps } from 'react-virtuoso';

import { deserializeAttributions } from '../ElectronBackend/input/parseInputData';
import { View } from '../Frontend/enums/enums';
import { navigateToView } from '../Frontend/state/actions/view-actions/view-actions';
import { getParsedInputFileEnrichedWithTestData } from '../Frontend/test-helpers/general-test-helpers';
import { ATTRIBUTION_PAGE_SIZE } from '../Frontend/util/attribution-page-query';
import { faker } from '../testing/Faker';
import { renderApp } from '../testing/render-app';
import { clearPanelSearch, fillPanelSearch } from '../testing/ui';

const virtualList = vi.hoisted(() => ({
  rangeChanged: undefined as VirtuosoProps<unknown, unknown>['rangeChanged'],
  endReached: undefined as VirtuosoProps<unknown, unknown>['endReached'],
}));

// Drive visible ranges explicitly: happy-dom cannot scroll or measure rows.
vi.mock('react-virtuoso', async (importOriginal) => {
  const original = await importOriginal<object>();
  return {
    ...original,
    Virtuoso: ({
      data,
      totalCount,
      rangeChanged,
      endReached,
      ref,
    }: VirtuosoProps<unknown, unknown> & { ref?: Ref<VirtuosoHandle> }) => {
      useImperativeHandle(ref, () => ({
        autoscrollToBottom: vi.fn(),
        getState: vi.fn(),
        scrollBy: vi.fn(),
        scrollIntoView: vi.fn(),
        scrollTo: vi.fn(),
        scrollToIndex: vi.fn(),
      }));
      const isAttributionsList = totalCount !== undefined;
      if (isAttributionsList) {
        virtualList.rangeChanged = rangeChanged;
        virtualList.endReached = endReached;
      }
      return (
        <div
          data-testid={isAttributionsList ? 'virtual-list' : undefined}
          data-total-count={totalCount}
          data-loaded-count={data?.filter(Boolean).length}
        />
      );
    },
  };
});

test('reserves AI-only rows, loads visible placeholders, and updates totals on search', async () => {
  const totalCount = ATTRIBUTION_PAGE_SIZE * 2 + 1;
  const attributions = Array.from({ length: totalCount }, (_, index) =>
    faker.opossum.rawAttribution({
      packageName: `AI package ${String(index).padStart(3, '0')}`,
      aiAttributes: {},
    }),
  );
  const [manualId, manualPackage] = faker.opossum.rawAttribution({
    packageName: 'Manual package',
  });
  const attributionIds = attributions.map(([id]) => id);
  await renderApp({
    data: getParsedInputFileEnrichedWithTestData({
      resources: { first: 1, second: 1 },
      manualAttributions: deserializeAttributions(
        Object.fromEntries([...attributions, [manualId, manualPackage]]),
      ),
      resourcesToManualAttributions: {
        '/first': [...attributionIds, manualId],
        '/second': attributionIds,
      },
    }),
    actions: [navigateToView(View.AiReview)],
  });

  const list = await screen.findByTestId('virtual-list');
  await waitFor(() => {
    expect(list).toHaveAttribute('data-total-count', String(totalCount));
  });
  await waitFor(() => {
    expect(list).toHaveAttribute(
      'data-loaded-count',
      String(ATTRIBUTION_PAGE_SIZE),
    );
  });
  expect(virtualList.endReached).toBeUndefined();

  act(() =>
    virtualList.rangeChanged?.({
      startIndex: totalCount - 1,
      endIndex: totalCount - 1,
    }),
  );
  await waitFor(() =>
    expect(list).toHaveAttribute('data-loaded-count', String(totalCount)),
  );

  await fillPanelSearch('ai-review-attributions-header', 'AI package 000');
  await waitFor(() => {
    expect(screen.getByTestId('virtual-list')).toHaveAttribute(
      'data-total-count',
      '1',
    );
  });
  await waitFor(() => {
    expect(screen.getByTestId('virtual-list')).toHaveAttribute(
      'data-loaded-count',
      '1',
    );
  });

  await fillPanelSearch('ai-review-attributions-header', 'Manual package');
  await waitFor(() => {
    expect(screen.getByTestId('virtual-list')).toHaveAttribute(
      'data-total-count',
      '0',
    );
  });
  await waitFor(() => {
    expect(screen.getByTestId('virtual-list')).toHaveAttribute(
      'data-loaded-count',
      '0',
    );
  });

  await clearPanelSearch('ai-review-attributions-header');
  await waitFor(() =>
    expect(screen.getByTestId('virtual-list')).toHaveAttribute(
      'data-total-count',
      String(totalCount),
    ),
  );
});
