// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { noop } from 'lodash';

import {
  Attributions,
  PackageInfo,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { setTemporaryDisplayPackageInfo } from '../../../state/actions/resource-actions/all-views-simple-actions';
import {
  setSelectedAttributionId,
  setSelectedResourceId,
} from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import {
  getManualAttributions,
  getResourcesToManualAttributions,
} from '../../../state/selectors/resource-selectors';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { ConfirmSavePopup } from '../ConfirmSavePopup';

describe('ConfirmSavePopup', () => {
  it('saves attribution linked to a single resource', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo({ id: packageInfo1.id });
    const resourceName = faker.opossum.resourceName();
    const { store } = renderComponent(
      <ConfirmSavePopup
        open
        onClose={noop}
        attributionIdsToSave={[packageInfo1.id]}
      />,
      {
        actions: [
          setTemporaryDisplayPackageInfo(packageInfo2),
          setSelectedAttributionId(packageInfo1.id),
          loadFromFile(
            getParsedInputFileEnrichedWithTestData({
              manualAttributions: faker.opossum.attributions({
                [packageInfo1.id]: packageInfo1,
              }),
              resourcesToManualAttributions:
                faker.opossum.resourcesToAttributions({
                  [faker.opossum.filePath(resourceName)]: [packageInfo1.id],
                }),
            }),
          ),
        ],
      },
    );

    await userEvent.click(
      screen.getByRole('button', {
        name: text.saveAttributionsPopup.save,
      }),
    );

    expect(getManualAttributions(store.getState())).toEqual<Attributions>({
      [packageInfo1.id]: packageInfo2,
    });
    expect(
      getResourcesToManualAttributions(store.getState()),
    ).toEqual<ResourcesToAttributions>({
      [faker.opossum.filePath(resourceName)]: [packageInfo1.id],
    });
  });

  it('saves attribution linked to multiple resources on all resources', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo({ id: packageInfo1.id });
    const resourceName1 = faker.opossum.resourceName();
    const resourceName2 = faker.opossum.resourceName();
    const { store } = renderComponent(
      <ConfirmSavePopup
        open
        onClose={noop}
        attributionIdsToSave={[packageInfo1.id]}
      />,
      {
        actions: [
          setTemporaryDisplayPackageInfo(packageInfo2),
          setSelectedAttributionId(packageInfo1.id),
          loadFromFile(
            getParsedInputFileEnrichedWithTestData({
              manualAttributions: faker.opossum.attributions({
                [packageInfo1.id]: packageInfo1,
              }),
              resourcesToManualAttributions:
                faker.opossum.resourcesToAttributions({
                  [faker.opossum.filePath(resourceName1)]: [packageInfo1.id],
                  [faker.opossum.filePath(resourceName2)]: [packageInfo1.id],
                }),
            }),
          ),
        ],
      },
    );

    await userEvent.click(
      screen.getByRole('button', {
        name: text.saveAttributionsPopup.saveGlobally,
      }),
    );

    expect(getManualAttributions(store.getState())).toEqual<Attributions>({
      [packageInfo1.id]: packageInfo2,
    });
    expect(
      getResourcesToManualAttributions(store.getState()),
    ).toEqual<ResourcesToAttributions>({
      [faker.opossum.filePath(resourceName1)]: [packageInfo1.id],
      [faker.opossum.filePath(resourceName2)]: [packageInfo1.id],
    });
  });

  it('saves attribution linked to multiple resources only on selected resource', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo({ id: packageInfo1.id });
    const resourceName1 = faker.opossum.resourceName();
    const resourceName2 = faker.opossum.resourceName();
    const { store } = renderComponent(
      <ConfirmSavePopup
        open
        onClose={noop}
        attributionIdsToSave={[packageInfo1.id]}
      />,
      {
        actions: [
          setTemporaryDisplayPackageInfo(packageInfo2),
          setSelectedAttributionId(packageInfo1.id),
          setSelectedResourceId(faker.opossum.filePath(resourceName1)),
          loadFromFile(
            getParsedInputFileEnrichedWithTestData({
              manualAttributions: faker.opossum.attributions({
                [packageInfo1.id]: packageInfo1,
              }),
              resourcesToManualAttributions:
                faker.opossum.resourcesToAttributions({
                  [faker.opossum.filePath(resourceName1)]: [packageInfo1.id],
                  [faker.opossum.filePath(resourceName2)]: [packageInfo1.id],
                }),
            }),
          ),
        ],
      },
    );

    await userEvent.click(
      screen.getByRole('button', {
        name: text.saveAttributionsPopup.saveLocally,
      }),
    );

    expect(Object.keys(getManualAttributions(store.getState()))).toHaveLength(
      2,
    );
    expect(
      getManualAttributions(store.getState())[packageInfo1.id],
    ).toEqual<PackageInfo>(packageInfo1);
    expect(
      getResourcesToManualAttributions(store.getState())[
        faker.opossum.filePath(resourceName1)
      ],
    ).not.toEqual<Array<string>>([packageInfo1.id]);
    expect(
      getResourcesToManualAttributions(store.getState())[
        faker.opossum.filePath(resourceName2)
      ],
    ).toEqual<Array<string>>([packageInfo1.id]);
  });

  it('confirms attribution linked to a single resource', async () => {
    const packageInfo = faker.opossum.packageInfo({ preSelected: true });
    const resourceName = faker.opossum.resourceName();
    const { store } = renderComponent(
      <ConfirmSavePopup
        open
        onClose={noop}
        attributionIdsToSave={[packageInfo.id]}
      />,
      {
        actions: [
          setTemporaryDisplayPackageInfo(packageInfo),
          setSelectedAttributionId(packageInfo.id),
          loadFromFile(
            getParsedInputFileEnrichedWithTestData({
              manualAttributions: faker.opossum.attributions({
                [packageInfo.id]: packageInfo,
              }),
              resourcesToManualAttributions:
                faker.opossum.resourcesToAttributions({
                  [faker.opossum.filePath(resourceName)]: [packageInfo.id],
                }),
            }),
          ),
        ],
      },
    );

    await userEvent.click(
      screen.getByRole('button', {
        name: text.saveAttributionsPopup.confirm,
      }),
    );

    expect(getManualAttributions(store.getState())).toEqual<Attributions>({
      [packageInfo.id]: { ...packageInfo, preSelected: undefined },
    });
    expect(
      getResourcesToManualAttributions(store.getState()),
    ).toEqual<ResourcesToAttributions>({
      [faker.opossum.filePath(resourceName)]: [packageInfo.id],
    });
  });

  it('confirms attribution linked to multiple resources on all resources', async () => {
    const packageInfo = faker.opossum.packageInfo({ preSelected: true });
    const resourceName1 = faker.opossum.resourceName();
    const resourceName2 = faker.opossum.resourceName();
    const { store } = renderComponent(
      <ConfirmSavePopup
        open
        onClose={noop}
        attributionIdsToSave={[packageInfo.id]}
      />,
      {
        actions: [
          setTemporaryDisplayPackageInfo(packageInfo),
          setSelectedAttributionId(packageInfo.id),
          loadFromFile(
            getParsedInputFileEnrichedWithTestData({
              manualAttributions: faker.opossum.attributions({
                [packageInfo.id]: packageInfo,
              }),
              resourcesToManualAttributions:
                faker.opossum.resourcesToAttributions({
                  [faker.opossum.filePath(resourceName1)]: [packageInfo.id],
                  [faker.opossum.filePath(resourceName2)]: [packageInfo.id],
                }),
            }),
          ),
        ],
      },
    );

    await userEvent.click(
      screen.getByRole('button', {
        name: text.saveAttributionsPopup.confirmGlobally,
      }),
    );

    expect(getManualAttributions(store.getState())).toEqual<Attributions>({
      [packageInfo.id]: { ...packageInfo, preSelected: undefined },
    });
    expect(
      getResourcesToManualAttributions(store.getState()),
    ).toEqual<ResourcesToAttributions>({
      [faker.opossum.filePath(resourceName1)]: [packageInfo.id],
      [faker.opossum.filePath(resourceName2)]: [packageInfo.id],
    });
  });

  it('confirms attribution linked to multiple resources only on selected resource', async () => {
    const packageInfo = faker.opossum.packageInfo({ preSelected: true });
    const resourceName1 = faker.opossum.resourceName();
    const resourceName2 = faker.opossum.resourceName();
    const { store } = renderComponent(
      <ConfirmSavePopup
        open
        onClose={noop}
        attributionIdsToSave={[packageInfo.id]}
      />,
      {
        actions: [
          setTemporaryDisplayPackageInfo(packageInfo),
          setSelectedAttributionId(packageInfo.id),
          setSelectedResourceId(faker.opossum.filePath(resourceName1)),
          loadFromFile(
            getParsedInputFileEnrichedWithTestData({
              manualAttributions: faker.opossum.attributions({
                [packageInfo.id]: packageInfo,
              }),
              resourcesToManualAttributions:
                faker.opossum.resourcesToAttributions({
                  [faker.opossum.filePath(resourceName1)]: [packageInfo.id],
                  [faker.opossum.filePath(resourceName2)]: [packageInfo.id],
                }),
            }),
          ),
        ],
      },
    );

    await userEvent.click(
      screen.getByRole('button', {
        name: text.saveAttributionsPopup.confirmLocally,
      }),
    );

    expect(Object.keys(getManualAttributions(store.getState()))).toHaveLength(
      2,
    );
    expect(
      getManualAttributions(store.getState())[packageInfo.id],
    ).toEqual<PackageInfo>(packageInfo);
    expect(
      getResourcesToManualAttributions(store.getState())[
        faker.opossum.filePath(resourceName1)
      ],
    ).not.toEqual<Array<string>>([packageInfo.id]);
    expect(
      getResourcesToManualAttributions(store.getState())[
        faker.opossum.filePath(resourceName2)
      ],
    ).toEqual<Array<string>>([packageInfo.id]);
  });
});
