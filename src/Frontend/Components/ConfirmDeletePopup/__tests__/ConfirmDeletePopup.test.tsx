// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { noop } from 'lodash';

import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { pathsToResources } from '../../../../testing/global-test-helpers';
import { setSelectedAttributionId } from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { expectManualAttributions } from '../../../test-helpers/expectations';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { ConfirmDeletePopup } from '../ConfirmDeletePopup';

describe('ConfirmDeletePopup', () => {
  it('displays to-be-deleted attributions and counts the affected resources', async () => {
    const attribution1 = faker.opossum.packageInfo();
    const attribution2 = faker.opossum.packageInfo();
    const resource1 = faker.opossum.filePath(faker.opossum.resourceName());
    const resource2 = faker.opossum.filePath(faker.opossum.resourceName());

    await renderComponent(
      <ConfirmDeletePopup
        open
        onClose={noop}
        attributionIdsToDelete={[attribution1.id, attribution2.id]}
      />,
      {
        data: getParsedInputFileEnrichedWithTestData({
          manualAttributions: faker.opossum.attributions({
            [attribution1.id]: attribution1,
            [attribution2.id]: attribution2,
          }),
          resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
            [resource1]: [attribution1.id],
            [resource2]: [attribution1.id],
          }),
          resources: pathsToResources([resource1, resource2]),
        }),
        actions: [setSelectedAttributionId(attribution1.id)],
      },
    );

    expect(
      await screen.findByText(
        text.deleteAttributionsPopup.deleteAttributions({
          attributions: '2 attributions',
          resources: '2 resources',
        }),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(text.deleteAttributionsPopup.title),
    ).toBeInTheDocument();
  });

  it('deletes attributions', async () => {
    const attribution1 = faker.opossum.packageInfo();
    const attribution2 = faker.opossum.packageInfo();
    const resource1 = faker.opossum.filePath(faker.opossum.resourceName());
    const resource2 = faker.opossum.filePath(faker.opossum.resourceName());

    const { store } = await renderComponent(
      <ConfirmDeletePopup
        open
        onClose={noop}
        attributionIdsToDelete={[attribution1.id, attribution2.id]}
      />,
      {
        data: getParsedInputFileEnrichedWithTestData({
          manualAttributions: faker.opossum.attributions({
            [attribution1.id]: attribution1,
            [attribution2.id]: attribution2,
          }),
          resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
            [resource1]: [attribution1.id],
            [resource2]: [attribution1.id],
          }),
          resources: pathsToResources([resource1, resource2]),
        }),
        actions: [setSelectedAttributionId(attribution1.id)],
      },
    );

    await userEvent.click(
      await screen.findByText(text.deleteAttributionsPopup.deleteGlobally),
    );

    await expectManualAttributions(store.getState(), {});
  });
});
