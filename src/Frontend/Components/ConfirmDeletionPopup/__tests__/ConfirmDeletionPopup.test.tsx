// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { noop } from 'lodash';

import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { setManualData } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { getManualAttributions } from '../../../state/selectors/resource-selectors';
import { getAttributionsToResources } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { ConfirmDeletionPopup } from '../ConfirmDeletionPopup';

describe('The ConfirmMultiSelectDeletionPopup', () => {
  it('displays to-be-deleted attributions and counts the affected resources', () => {
    const attribution1 = faker.opossum.packageInfo();
    const attribution2 = faker.opossum.packageInfo();
    const attributions = faker.opossum.attributions({
      [attribution1.id]: attribution1,
      [attribution2.id]: attribution2,
    });
    const resourcesToAttributions = faker.opossum.resourcesToAttributions({
      resource1: [attribution1.id],
      resource2: [attribution2.id],
    });

    renderComponent(
      <ConfirmDeletionPopup
        open
        onClose={noop}
        attributionIdsToDelete={[attribution1.id, attribution2.id]}
      />,
      {
        actions: [
          setManualData(
            attributions,
            resourcesToAttributions,
            getAttributionsToResources(resourcesToAttributions),
          ),
        ],
      },
    );

    expect(
      screen.getByText(
        text.deleteAttributionsPopup.deleteAttributions(
          '2 attributions',
          '2 resources',
        ),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(text.deleteAttributionsPopup.title),
    ).toBeInTheDocument();
  });

  it('deletes attributions', async () => {
    const attribution1 = faker.opossum.packageInfo();
    const attribution2 = faker.opossum.packageInfo();
    const attributions = faker.opossum.attributions({
      [attribution1.id]: attribution1,
      [attribution2.id]: attribution2,
    });
    const resourcesToAttributions = faker.opossum.resourcesToAttributions({
      resource1: [attribution1.id],
      resource2: [attribution2.id],
    });

    const { store } = renderComponent(
      <ConfirmDeletionPopup
        open
        onClose={noop}
        attributionIdsToDelete={[attribution1.id, attribution2.id]}
      />,
      {
        actions: [
          setManualData(
            attributions,
            resourcesToAttributions,
            getAttributionsToResources(resourcesToAttributions),
          ),
        ],
      },
    );

    await userEvent.click(
      screen.getByText(text.deleteAttributionsPopup.deleteGlobally),
    );

    expect(getManualAttributions(store.getState())).toEqual({});
  });
});
