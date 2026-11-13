// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { MutationReturn } from '../../../../../../ElectronBackend/api/mutations';
import { getDb } from '../../../../../../ElectronBackend/db/db';
import { text } from '../../../../../../shared/text';
import { faker } from '../../../../../../testing/Faker';
import {
  expectButtonDisabled,
  expectButtonVisibility,
  expectEventuallyButtonEnabled,
  expectTextVisible,
  getButton,
} from '../../../../../../testing/ui';
import { setTemporaryDisplayPackageInfo } from '../../../../../state/actions/resource-actions/all-views-simple-actions';
import { setSelectedAttributionId } from '../../../../../state/actions/resource-actions/audit-view-simple-actions';
import { getParsedInputFileEnrichedWithTestData } from '../../../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../../../test-helpers/render';
import type { PackagesPanelChildrenProps } from '../../../PackagesPanel/PackagesPanel';
import { MoreActionsButton } from '../MoreActionsButton';

type UpdateAttributionPropertyResponse = Awaited<
  MutationReturn<'updateAttributionProperty'>
>;

describe('MoreActionsButton', () => {
  const defaultProps: PackagesPanelChildrenProps = {
    activeAttributionIds: ['attr1', 'attr2'],
    activeRelation: 'children',
    attributionIds: ['attr1', 'attr2'],
    attributions: {
      attr1: faker.opossum.packageInfo({
        id: 'attr1',
        needsReview: false,
        followUp: false,
        excludeFromNotice: false,
      }),
      attr2: faker.opossum.packageInfo({
        id: 'attr2',
        needsReview: true,
        followUp: false,
        excludeFromNotice: false,
      }),
    },
    contentHeight: '100px',
    loading: false,
    loadingMore: false,
    loadMoreError: null,
    fetchNextPage: vi.fn(() => Promise.resolve()),
    selection: { mode: 'explicit', attributionUuids: ['attr1', 'attr2'] },
    selectionSummaryLoading: false,
    toggleAttributionSelection: vi.fn(),
    isAttributionSelected: (id) => ['attr1', 'attr2'].includes(id),
    clearBulkSelection: vi.fn(),
    pickerMode: { mode: 'inactive', isActive: false },
    resultSetKey: 'result-set',
    selectedAttributionId: 'attr1',
    selectedAttributionIds: ['attr1', 'attr2'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the more actions button', async () => {
    await renderComponent(<MoreActionsButton {...defaultProps} />);

    await expectButtonVisibility(text.packageLists.moreActions, true);
  });

  it('is disabled when no attributions are selected', async () => {
    const props = {
      ...defaultProps,
      selectedAttributionIds: [],
    };

    await renderComponent(<MoreActionsButton {...props} />);

    expectButtonDisabled(text.packageLists.moreActions);
  });

  it('opens menu when clicked', async () => {
    await renderComponent(<MoreActionsButton {...defaultProps} />);

    await userEvent.click(getButton(text.packageLists.moreActions));

    await expectTextVisible('Mark as Needs Review by QA', true);
    await expectTextVisible('Mark as Needs Follow-Up', true);
    await expectTextVisible('Mark as Excluded from Notice', true);
  });

  it('shows correct text when all selected attributions have needsReview', async () => {
    const props = {
      ...defaultProps,
      attributions: {
        attr1: faker.opossum.packageInfo({
          id: 'attr1',
          needsReview: true,
        }),
        attr2: faker.opossum.packageInfo({
          id: 'attr2',
          needsReview: true,
        }),
      },
    };

    await renderComponent(<MoreActionsButton {...props} />);

    await userEvent.click(getButton(text.packageLists.moreActions));

    await expectTextVisible('Unmark as Needs Review by QA', true);
  });

  it('updates explicit selections while preserving the focused edit', async () => {
    const attr1 = defaultProps.attributions!.attr1;
    const attr2 = defaultProps.attributions!.attr2;
    const unsavedAttr1 = { ...attr1, packageName: 'unsaved package name' };

    await renderComponent(<MoreActionsButton {...defaultProps} />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions: { attr1, attr2 },
      }),
      actions: [
        setSelectedAttributionId('attr1'),
        setTemporaryDisplayPackageInfo(unsavedAttr1),
      ],
    });

    await userEvent.click(getButton(text.packageLists.moreActions));
    await userEvent.click(screen.getByText('Mark as Needs Review by QA'));

    await waitFor(async () => {
      const rows = await getDb()
        .selectFrom('attribution')
        .select(['uuid', 'package_name', 'needs_review'])
        .where('uuid', 'in', ['attr1', 'attr2'])
        .orderBy('uuid')
        .execute();

      expect(rows).toEqual([
        {
          uuid: 'attr1',
          package_name: 'unsaved package name',
          needs_review: 1,
        },
        {
          uuid: 'attr2',
          package_name: attr2.packageName,
          needs_review: 1,
        },
      ]);
    });
  });

  it('shows loading and prevents another action while the mutation is pending', async () => {
    let resolveMutation: (
      response: UpdateAttributionPropertyResponse,
    ) => void = () => undefined;
    const mutationPromise = new Promise<UpdateAttributionPropertyResponse>(
      (resolve) => {
        resolveMutation = resolve;
      },
    );
    const api = vi.mocked(window.electronAPI.api);
    api.mockImplementationOnce(() => mutationPromise);

    await renderComponent(<MoreActionsButton {...defaultProps} />);

    await userEvent.click(getButton(text.packageLists.moreActions));
    await userEvent.click(screen.getByText('Mark as Needs Review by QA'));

    await expectTextVisible('Mark as Needs Review by QA', false);
    expectButtonDisabled(text.packageLists.moreActions);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    expect(api).toHaveBeenCalledOnce();

    resolveMutation({
      invalidates: [],
      result: { focusedAttributionOutcome: { status: 'unchanged' } },
    });
    await waitFor(() => expect(screen.queryByRole('progressbar')).toBeNull());
  });

  it('reconciles focus and clears the selection after a successful mutation', async () => {
    const api = vi.mocked(window.electronAPI.api);
    api.mockImplementationOnce(() =>
      Promise.resolve({
        invalidates: [],
        result: {
          focusedAttributionOutcome: {
            status: 'remapped',
            attributionUuid: 'attr1',
            newAttributionUuid: 'remapped-attr1',
          },
        },
      }),
    );
    const clearBulkSelection = vi.fn();
    const { store } = await renderComponent(
      <MoreActionsButton
        {...defaultProps}
        clearBulkSelection={clearBulkSelection}
      />,
      { actions: [setSelectedAttributionId('attr1')] },
    );

    await userEvent.click(getButton(text.packageLists.moreActions));
    await userEvent.click(screen.getByText('Mark as Needs Review by QA'));

    await waitFor(() => expect(clearBulkSelection).toHaveBeenCalledOnce());
    expect(store.getState().resourceState.selectedAttributionId).toBe(
      'remapped-attr1',
    );
  });

  it('retains the selection when the mutation fails', async () => {
    const api = vi.mocked(window.electronAPI.api);
    api.mockImplementationOnce(() =>
      Promise.reject(new Error('update failed')),
    );
    const clearBulkSelection = vi.fn();
    await renderComponent(
      <MoreActionsButton
        {...defaultProps}
        clearBulkSelection={clearBulkSelection}
      />,
    );

    await userEvent.click(getButton(text.packageLists.moreActions));
    await userEvent.click(screen.getByText('Mark as Needs Review by QA'));

    await expectEventuallyButtonEnabled(text.packageLists.moreActions);
    expect(clearBulkSelection).not.toHaveBeenCalled();
  });
});
