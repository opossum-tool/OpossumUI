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
    clearSelection: vi.fn(),
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

    expect(
      screen.getByRole('button', { name: text.packageLists.moreActions }),
    ).toBeInTheDocument();
  });

  it('is disabled when no attributions are selected', async () => {
    const props = {
      ...defaultProps,
      selectedAttributionIds: [],
    };

    await renderComponent(<MoreActionsButton {...props} />);

    expect(
      screen.getByRole('button', { name: text.packageLists.moreActions }),
    ).toBeDisabled();
  });

  it('opens menu when clicked', async () => {
    const user = userEvent.setup();
    await renderComponent(<MoreActionsButton {...defaultProps} />);

    const button = screen.getByRole('button', {
      name: text.packageLists.moreActions,
    });
    await user.click(button);

    expect(screen.getByText('Mark as Needs Review by QA')).toBeInTheDocument();
    expect(screen.getByText('Mark as Needs Follow-Up')).toBeInTheDocument();
    expect(
      screen.getByText('Mark as Excluded from Notice'),
    ).toBeInTheDocument();
  });

  it('shows correct text when all selected attributions have needsReview', async () => {
    const user = userEvent.setup();
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

    const button = screen.getByRole('button', {
      name: text.packageLists.moreActions,
    });
    await user.click(button);

    expect(
      screen.getByText('Unmark as Needs Review by QA'),
    ).toBeInTheDocument();
  });

  it('updates explicit selections while preserving the focused edit', async () => {
    const attr1 = defaultProps.attributions!.attr1;
    const attr2 = defaultProps.attributions!.attr2;
    const unsavedAttr1 = { ...attr1, packageName: 'unsaved package name' };
    const user = userEvent.setup();

    await renderComponent(<MoreActionsButton {...defaultProps} />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions: { attr1, attr2 },
      }),
      actions: [
        setSelectedAttributionId('attr1'),
        setTemporaryDisplayPackageInfo(unsavedAttr1),
      ],
    });

    await user.click(
      screen.getByRole('button', { name: text.packageLists.moreActions }),
    );
    await user.click(screen.getByText('Mark as Needs Review by QA'));

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
    const user = userEvent.setup();

    await renderComponent(<MoreActionsButton {...defaultProps} />);
    const moreActionsButton = screen.getByRole('button', {
      name: text.packageLists.moreActions,
    });

    await user.click(moreActionsButton);
    await user.click(screen.getByText('Mark as Needs Review by QA'));

    expect(
      screen.queryByText('Mark as Needs Review by QA'),
    ).not.toBeInTheDocument();
    expect(moreActionsButton).toBeDisabled();
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
    const clearSelection = vi.fn();
    const { store } = await renderComponent(
      <MoreActionsButton {...defaultProps} clearSelection={clearSelection} />,
      { actions: [setSelectedAttributionId('attr1')] },
    );

    await userEvent.click(
      screen.getByRole('button', { name: text.packageLists.moreActions }),
    );
    await userEvent.click(screen.getByText('Mark as Needs Review by QA'));

    await waitFor(() => expect(clearSelection).toHaveBeenCalledOnce());
    expect(store.getState().resourceState.selectedAttributionId).toBe(
      'remapped-attr1',
    );
  });

  it('retains the selection when the mutation fails', async () => {
    const api = vi.mocked(window.electronAPI.api);
    api.mockImplementationOnce(() =>
      Promise.reject(new Error('update failed')),
    );
    const clearSelection = vi.fn();
    await renderComponent(
      <MoreActionsButton {...defaultProps} clearSelection={clearSelection} />,
    );

    const moreActionsButton = screen.getByRole('button', {
      name: text.packageLists.moreActions,
    });
    await userEvent.click(moreActionsButton);
    await userEvent.click(screen.getByText('Mark as Needs Review by QA'));

    await waitFor(() => expect(moreActionsButton).toBeEnabled());
    expect(clearSelection).not.toHaveBeenCalled();
  });
});
