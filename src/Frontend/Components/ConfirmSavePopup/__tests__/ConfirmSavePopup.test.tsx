// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { noop } from 'lodash';

import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { pathsToResources } from '../../../../testing/global-test-helpers';
import { setTemporaryDisplayPackageInfo } from '../../../state/actions/resource-actions/all-views-simple-actions';
import {
  setSelectedAttributionId,
  setSelectedResourceId,
} from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { getSelectedAttributionId } from '../../../state/selectors/resource-selectors';
import {
  expectManualAttributions,
  expectResourcesToManualAttributions,
} from '../../../test-helpers/expectations';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { ConfirmSavePopup } from '../ConfirmSavePopup';

describe('ConfirmSavePopup', () => {
  it('saves attribution linked to a single resource', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo({ id: packageInfo1.id });
    const resource = faker.opossum.filePath(faker.opossum.resourceName());
    const { store } = await renderComponent(
      <ConfirmSavePopup
        open
        onClose={noop}
        attributionIdsToSave={[packageInfo1.id]}
      />,
      {
        data: getParsedInputFileEnrichedWithTestData({
          manualAttributions: faker.opossum.attributions({
            [packageInfo1.id]: packageInfo1,
          }),
          resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
            [resource]: [packageInfo1.id],
          }),
          resources: pathsToResources([resource]),
        }),
        actions: [
          setTemporaryDisplayPackageInfo(packageInfo2),
          setSelectedAttributionId(packageInfo1.id),
        ],
      },
    );

    await userEvent.click(
      screen.getByRole('button', {
        name: text.saveAttributionsPopup.save,
      }),
    );

    await expectManualAttributions(store.getState(), {
      [packageInfo1.id]: packageInfo2,
    });
    await expectResourcesToManualAttributions(store.getState(), {
      [resource]: [packageInfo1.id],
    });
  });

  it('saves attribution linked to multiple resources on all resources', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo({ id: packageInfo1.id });
    const resource1 = faker.opossum.filePath(faker.opossum.resourceName());
    const resource2 = faker.opossum.filePath(faker.opossum.resourceName());
    const { store } = await renderComponent(
      <ConfirmSavePopup
        open
        onClose={noop}
        attributionIdsToSave={[packageInfo1.id]}
      />,
      {
        data: getParsedInputFileEnrichedWithTestData({
          manualAttributions: faker.opossum.attributions({
            [packageInfo1.id]: packageInfo1,
          }),
          resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
            [resource1]: [packageInfo1.id],
            [resource2]: [packageInfo1.id],
          }),
          resources: pathsToResources([resource1, resource2]),
        }),
        actions: [
          setTemporaryDisplayPackageInfo(packageInfo2),
          setSelectedAttributionId(packageInfo1.id),
        ],
      },
    );

    await userEvent.click(
      screen.getByRole('button', {
        name: text.saveAttributionsPopup.saveGlobally,
      }),
    );

    await expectManualAttributions(store.getState(), {
      [packageInfo1.id]: packageInfo2,
    });
    await expectResourcesToManualAttributions(store.getState(), {
      [resource1]: [packageInfo1.id],
      [resource2]: [packageInfo1.id],
    });
  });

  it('saves attribution linked to multiple resources only on selected resource', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo({ id: packageInfo1.id });
    const resource1 = faker.opossum.filePath(faker.opossum.resourceName());
    const resource2 = faker.opossum.filePath(faker.opossum.resourceName());
    const { store } = await renderComponent(
      <ConfirmSavePopup
        open
        onClose={noop}
        attributionIdsToSave={[packageInfo1.id]}
      />,
      {
        data: getParsedInputFileEnrichedWithTestData({
          manualAttributions: faker.opossum.attributions({
            [packageInfo1.id]: packageInfo1,
          }),
          resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
            [resource1]: [packageInfo1.id],
            [resource2]: [packageInfo1.id],
          }),
          resources: pathsToResources([resource1, resource2]),
        }),
        actions: [
          setTemporaryDisplayPackageInfo(packageInfo2),
          setSelectedAttributionId(packageInfo1.id),
          setSelectedResourceId(resource1),
        ],
      },
    );

    await userEvent.click(
      screen.getByRole('button', {
        name: text.saveAttributionsPopup.saveLocally,
      }),
    );

    const newId = getSelectedAttributionId(store.getState());

    await expectManualAttributions(store.getState(), {
      [packageInfo1.id]: packageInfo1,
      [newId]: { ...packageInfo2, id: newId },
    });
    await expectResourcesToManualAttributions(store.getState(), {
      [resource1]: [newId],
      [resource2]: [packageInfo1.id],
    });
  });

  it('confirms attribution linked to a single resource', async () => {
    const packageInfo = faker.opossum.packageInfo({ preSelected: true });
    const resource = faker.opossum.filePath(faker.opossum.resourceName());
    const { store } = await renderComponent(
      <ConfirmSavePopup
        open
        onClose={noop}
        attributionIdsToSave={[packageInfo.id]}
      />,
      {
        data: getParsedInputFileEnrichedWithTestData({
          manualAttributions: faker.opossum.attributions({
            [packageInfo.id]: packageInfo,
          }),
          resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
            [resource]: [packageInfo.id],
          }),
          resources: pathsToResources([resource]),
        }),
        actions: [
          setTemporaryDisplayPackageInfo(packageInfo),
          setSelectedAttributionId(packageInfo.id),
        ],
      },
    );

    await userEvent.click(
      screen.getByRole('button', {
        name: text.saveAttributionsPopup.confirm,
      }),
    );

    await expectManualAttributions(store.getState(), {
      [packageInfo.id]: { ...packageInfo, preSelected: undefined },
    });
    await expectResourcesToManualAttributions(store.getState(), {
      [resource]: [packageInfo.id],
    });
  });

  it('confirms attribution linked to multiple resources on all resources', async () => {
    const packageInfo = faker.opossum.packageInfo({ preSelected: true });
    const resourceName1 = faker.opossum.resourceName();
    const resourceName2 = faker.opossum.resourceName();
    const { store } = await renderComponent(
      <ConfirmSavePopup
        open
        onClose={noop}
        attributionIdsToSave={[packageInfo.id]}
      />,
      {
        data: getParsedInputFileEnrichedWithTestData({
          manualAttributions: faker.opossum.attributions({
            [packageInfo.id]: packageInfo,
          }),
          resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
            [faker.opossum.filePath(resourceName1)]: [packageInfo.id],
            [faker.opossum.filePath(resourceName2)]: [packageInfo.id],
          }),
          resources: pathsToResources([resourceName1, resourceName2]),
        }),
        actions: [
          setTemporaryDisplayPackageInfo(packageInfo),
          setSelectedAttributionId(packageInfo.id),
        ],
      },
    );

    await userEvent.click(
      screen.getByRole('button', {
        name: text.saveAttributionsPopup.confirmGlobally,
      }),
    );

    await expectManualAttributions(store.getState(), {
      [packageInfo.id]: { ...packageInfo, preSelected: undefined },
    });
    await expectResourcesToManualAttributions(store.getState(), {
      [faker.opossum.filePath(resourceName1)]: [packageInfo.id],
      [faker.opossum.filePath(resourceName2)]: [packageInfo.id],
    });
  });

  it('confirms attribution linked to multiple resources only on selected resource', async () => {
    const packageInfo = faker.opossum.packageInfo({ preSelected: true });
    const resource1 = faker.opossum.filePath(faker.opossum.resourceName());
    const resource2 = faker.opossum.filePath(faker.opossum.resourceName());
    const { store } = await renderComponent(
      <ConfirmSavePopup
        open
        onClose={noop}
        attributionIdsToSave={[packageInfo.id]}
      />,
      {
        data: getParsedInputFileEnrichedWithTestData({
          manualAttributions: faker.opossum.attributions({
            [packageInfo.id]: packageInfo,
          }),
          resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
            [resource1]: [packageInfo.id],
            [resource2]: [packageInfo.id],
          }),
          resources: pathsToResources([resource1, resource2]),
        }),
        actions: [
          setTemporaryDisplayPackageInfo(packageInfo),
          setSelectedAttributionId(packageInfo.id),
          setSelectedResourceId(resource1),
        ],
      },
    );

    await userEvent.click(
      screen.getByRole('button', {
        name: text.saveAttributionsPopup.confirmLocally,
      }),
    );

    const newId = getSelectedAttributionId(store.getState());

    await expectManualAttributions(store.getState(), {
      [packageInfo.id]: packageInfo,
      [newId]: { ...packageInfo, id: newId, preSelected: undefined },
    });
    await expectResourcesToManualAttributions(store.getState(), {
      [resource1]: [newId],
      [resource2]: [packageInfo.id],
    });
  });
});
