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
import { ReplaceAttributionsPopup } from '../ReplaceAttributionsPopup';

describe('ReplaceAttributionsPopup', () => {
  it('omits attributions to replace from list of attributions to replace with', () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();
    renderComponent(<ReplaceAttributionsPopup />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions: faker.opossum.attributions({
              [packageInfo1.id]: packageInfo1,
              [packageInfo2.id]: packageInfo2,
            }),
          }),
        ),
        setMultiSelectSelectedAttributionIds([packageInfo1.id]),
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
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();
    const packageInfo3 = faker.opossum.packageInfo();
    renderComponent(<ReplaceAttributionsPopup />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions: faker.opossum.attributions({
              [packageInfo1.id]: packageInfo1,
              [packageInfo2.id]: packageInfo2,
              [packageInfo3.id]: packageInfo3,
            }),
          }),
        ),
        setMultiSelectSelectedAttributionIds([packageInfo1.id]),
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
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();
    const resourceName = faker.opossum.resourceName();
    const { store } = renderComponent(<ReplaceAttributionsPopup />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions: faker.opossum.attributions({
              [packageInfo1.id]: packageInfo1,
              [packageInfo2.id]: packageInfo2,
            }),
            resourcesToManualAttributions:
              faker.opossum.resourcesToAttributions({
                [faker.opossum.filePath(resourceName)]: [
                  packageInfo1.id,
                  packageInfo2.id,
                ],
              }),
          }),
        ),
        setMultiSelectSelectedAttributionIds([packageInfo1.id]),
        setSelectedAttributionId(packageInfo1.id),
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
      [packageInfo2.id]: packageInfo2,
    });
    expect(
      getResourcesToManualAttributions(store.getState()),
    ).toEqual<ResourcesToAttributions>({
      [faker.opossum.filePath(resourceName)]: [packageInfo2.id],
    });
    expect(getSelectedAttributionIdInAttributionView(store.getState())).toBe(
      packageInfo2.id,
    );
    expect(getMultiSelectSelectedAttributionIds(store.getState())).toEqual([]);
  });

  it('replaces selected attribution with pre-selected one', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo({
      preSelected: true,
    });
    const resourceName = faker.opossum.resourceName();
    const { store } = renderComponent(<ReplaceAttributionsPopup />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions: faker.opossum.attributions({
              [packageInfo1.id]: packageInfo1,
              [packageInfo2.id]: packageInfo2,
            }),
            resourcesToManualAttributions:
              faker.opossum.resourcesToAttributions({
                [faker.opossum.filePath(resourceName)]: [
                  packageInfo1.id,
                  packageInfo2.id,
                ],
              }),
          }),
        ),
        setMultiSelectSelectedAttributionIds([packageInfo1.id]),
        setSelectedAttributionId(packageInfo1.id),
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
      [packageInfo2.id]: { ...packageInfo2, preSelected: undefined },
    });
    expect(
      getResourcesToManualAttributions(store.getState()),
    ).toEqual<ResourcesToAttributions>({
      [faker.opossum.filePath(resourceName)]: [packageInfo2.id],
    });
    expect(getSelectedAttributionIdInAttributionView(store.getState())).toBe(
      packageInfo2.id,
    );
    expect(getMultiSelectSelectedAttributionIds(store.getState())).toEqual([]);
  });
});
