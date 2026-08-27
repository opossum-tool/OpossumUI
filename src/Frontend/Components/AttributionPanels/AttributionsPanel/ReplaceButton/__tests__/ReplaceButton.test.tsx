// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { AttributionSelection } from '../../../../../../shared/attribution-selection';
import { text } from '../../../../../../shared/text';
import { faker } from '../../../../../../testing/Faker';
import { ATTRIBUTION_SELECTION_FOR_REPLACEMENT } from '../../../../../state/variables/use-attribution-selection-for-replacement';
import { renderComponent } from '../../../../../test-helpers/render';
import type { PackagesPanelChildrenProps } from '../../../PackagesPanel/PackagesPanel';
import { ReplaceButton } from '../ReplaceButton';

describe('ReplaceButton', () => {
  it('starts the same query-wide replacement again after cancellation', async () => {
    const first = faker.opossum.packageInfo({ id: 'first' });
    const second = faker.opossum.packageInfo({ id: 'second' });
    const selection: AttributionSelection = {
      mode: 'allMatching',
      query: {
        external: false,
        filters: [],
        search: '',
        valueFilters: {},
        resourcePathForRelationships: '/',
        showResolved: false,
        excludeUnrelated: false,
        relation: 'resource',
      },
      excludedAttributionUuids: [],
    };
    const props: PackagesPanelChildrenProps = {
      activeAttributionIds: [first.id, second.id],
      activeRelation: 'resource',
      attributionIds: [first.id, second.id],
      attributions: { [first.id]: first, [second.id]: second },
      contentHeight: '100px',
      loading: false,
      loadingMore: false,
      loadMoreError: null,
      fetchNextPage: vi.fn(() => Promise.resolve()),
      selection,
      selectionSummaryLoading: false,
      toggleAttributionSelection: vi.fn(),
      isAttributionSelected: () => false,
      clearSelection: vi.fn(),
      selectionSummary: {
        selectedCount: 2,
        preSelectedCount: 0,
        mixedCount: 0,
        writableLinkedResourceCount: 1,
        allLinkedToSelectedResource: true,
        needsReviewCount: 0,
        followUpCount: 0,
        excludeFromNoticeCount: 0,
        resolvedCount: 0,
      },
      pickerMode: { mode: 'inactive', isActive: false },
      selectedAttributionId: first.id,
      selectedAttributionIds: [first.id, second.id],
    };
    const clearSelection = vi.fn();
    const { store } = await renderComponent(
      <ReplaceButton {...props} clearSelection={clearSelection} />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: text.packageLists.replace }),
    );
    expect(
      store.getState().variablesState[ATTRIBUTION_SELECTION_FOR_REPLACEMENT],
    ).toEqual(selection);
    expect(clearSelection).not.toHaveBeenCalled();

    await userEvent.click(
      screen.getByRole('button', { name: text.packageLists.cancelReplace }),
    );
    expect(
      store.getState().variablesState[ATTRIBUTION_SELECTION_FOR_REPLACEMENT],
    ).toBeNull();
    expect(clearSelection).toHaveBeenCalledOnce();

    await userEvent.click(
      screen.getByRole('button', { name: text.packageLists.replace }),
    );
    expect(
      store.getState().variablesState[ATTRIBUTION_SELECTION_FOR_REPLACEMENT],
    ).toEqual(selection);
  });
});
