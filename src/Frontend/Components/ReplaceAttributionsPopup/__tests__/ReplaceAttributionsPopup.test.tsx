// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  Attributions,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import {
  setMultiSelectSelectedAttributionIds,
  setSelectedAttributionId,
} from '../../../state/actions/resource-actions/attribution-view-simple-actions';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import {
  getManualAttributions,
  getResourcesToManualAttributions,
} from '../../../state/selectors/all-views-resource-selectors';
import {
  getMultiSelectSelectedAttributionIds,
  getSelectedAttributionIdInAttributionView,
} from '../../../state/selectors/attribution-view-resource-selectors';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { getStrippedPackageInfo } from '../../../util/get-stripped-package-info';
import { ReplaceAttributionsPopup } from '../ReplaceAttributionsPopup';

describe('ReplaceAttributionsPopup', () => {
  it('omits attributions to replace from list of attributions to replace with', () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution();
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution();
    renderComponent(<ReplaceAttributionsPopup />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions: faker.opossum.manualAttributions({
              [attributionId1]: packageInfo1,
              [attributionId2]: packageInfo2,
            }),
          }),
        ),
        setMultiSelectSelectedAttributionIds([attributionId1]),
      ],
    });

    expect(
      within(screen.getByTestId('removed-attributions')).getByText(
        new RegExp(packageInfo1.packageName!),
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId('removed-attributions')).queryByText(
        new RegExp(packageInfo2.packageName!),
      ),
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByTestId('added-attributions')).queryByText(
        new RegExp(packageInfo1.packageName!),
      ),
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByTestId('added-attributions')).getByText(
        new RegExp(packageInfo2.packageName!),
      ),
    ).toBeInTheDocument();
  });

  it('only displays search hits in list of attributions to replace with', async () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution();
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution();
    const [attributionId3, packageInfo3] = faker.opossum.manualAttribution();
    renderComponent(<ReplaceAttributionsPopup />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions: faker.opossum.manualAttributions({
              [attributionId1]: packageInfo1,
              [attributionId2]: packageInfo2,
              [attributionId3]: packageInfo3,
            }),
          }),
        ),
        setMultiSelectSelectedAttributionIds([attributionId1]),
      ],
    });

    await userEvent.type(
      screen.getByRole('searchbox'),
      packageInfo3.packageName!,
    );

    expect(
      within(screen.getByTestId('added-attributions')).queryByText(
        new RegExp(packageInfo2.packageName!),
      ),
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByTestId('added-attributions')).getByText(
        new RegExp(packageInfo3.packageName!),
      ),
    ).toBeInTheDocument();
  });

  it('replaces selected attribution with non-pre-selected one', async () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution();
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution();
    const resourceName = faker.opossum.resourceName();
    const { store } = renderComponent(<ReplaceAttributionsPopup />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions: faker.opossum.manualAttributions({
              [attributionId1]: packageInfo1,
              [attributionId2]: packageInfo2,
            }),
            resourcesToManualAttributions:
              faker.opossum.resourcesToAttributions({
                [faker.opossum.filePath(resourceName)]: [
                  attributionId1,
                  attributionId2,
                ],
              }),
          }),
        ),
        setMultiSelectSelectedAttributionIds([attributionId1]),
        setSelectedAttributionId(attributionId1),
      ],
    });

    await userEvent.click(
      screen.getByText(new RegExp(packageInfo2.packageName!)),
    );
    await userEvent.click(
      screen.getByRole('button', {
        name: text.replaceAttributionsPopup.replace,
      }),
    );

    expect(getManualAttributions(store.getState())).toEqual<Attributions>({
      [attributionId2]: packageInfo2,
    });
    expect(
      getResourcesToManualAttributions(store.getState()),
    ).toEqual<ResourcesToAttributions>({
      [faker.opossum.filePath(resourceName)]: [attributionId2],
    });
    expect(getSelectedAttributionIdInAttributionView(store.getState())).toBe(
      attributionId2,
    );
    expect(getMultiSelectSelectedAttributionIds(store.getState())).toEqual([]);
  });

  it('replaces selected attribution with pre-selected one', async () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution();
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution({
      preSelected: true,
    });
    const resourceName = faker.opossum.resourceName();
    const { store } = renderComponent(<ReplaceAttributionsPopup />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions: faker.opossum.manualAttributions({
              [attributionId1]: packageInfo1,
              [attributionId2]: packageInfo2,
            }),
            resourcesToManualAttributions:
              faker.opossum.resourcesToAttributions({
                [faker.opossum.filePath(resourceName)]: [
                  attributionId1,
                  attributionId2,
                ],
              }),
          }),
        ),
        setMultiSelectSelectedAttributionIds([attributionId1]),
        setSelectedAttributionId(attributionId1),
      ],
    });

    await userEvent.click(
      screen.getByText(new RegExp(packageInfo2.packageName!)),
    );
    await userEvent.click(
      screen.getByRole('button', {
        name: text.replaceAttributionsPopup.replace,
      }),
    );

    expect(getManualAttributions(store.getState())).toEqual<Attributions>({
      [attributionId2]: getStrippedPackageInfo(packageInfo2),
    });
    expect(
      getResourcesToManualAttributions(store.getState()),
    ).toEqual<ResourcesToAttributions>({
      [faker.opossum.filePath(resourceName)]: [attributionId2],
    });
    expect(getSelectedAttributionIdInAttributionView(store.getState())).toBe(
      attributionId2,
    );
    expect(getMultiSelectSelectedAttributionIds(store.getState())).toEqual([]);
  });
});
