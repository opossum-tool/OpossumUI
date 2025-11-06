// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { text } from '../../../../../../shared/text';
import { faker } from '../../../../../../testing/Faker';
import { renderComponent } from '../../../../../test-helpers/render';
import { PackagesPanelChildrenProps } from '../../../PackagesPanel/PackagesPanel';
import { MoreActionsButton } from '../MoreActionsButton';

describe('MoreActionsButton', () => {
  const mockSetMultiSelectedAttributionIds = jest.fn();

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
    multiSelectedAttributionIds: ['attr1', 'attr2'],
    selectedAttributionId: 'attr1',
    selectedAttributionIds: ['attr1', 'attr2'],
    setMultiSelectedAttributionIds: mockSetMultiSelectedAttributionIds,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the more actions button', () => {
    renderComponent(<MoreActionsButton {...defaultProps} />);

    expect(
      screen.getByRole('button', { name: text.packageLists.moreActions }),
    ).toBeInTheDocument();
  });

  it('is disabled when no attributions are selected', () => {
    const props = {
      ...defaultProps,
      selectedAttributionIds: [],
    };

    renderComponent(<MoreActionsButton {...props} />);

    expect(
      screen.getByRole('button', { name: text.packageLists.moreActions }),
    ).toBeDisabled();
  });

  it('opens menu when clicked', async () => {
    const user = userEvent.setup();
    renderComponent(<MoreActionsButton {...defaultProps} />);

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

    renderComponent(<MoreActionsButton {...props} />);

    const button = screen.getByRole('button', {
      name: text.packageLists.moreActions,
    });
    await user.click(button);

    expect(
      screen.getByText('Unmark as Needs Review by QA'),
    ).toBeInTheDocument();
  });
});
