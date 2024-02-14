// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Attributions } from '../../../../../shared/shared-types';
import { text } from '../../../../../shared/text';
import { faker } from '../../../../../testing/Faker';
import { setProjectMetadata } from '../../../../state/actions/resource-actions/all-views-simple-actions';
import { loadFromFile } from '../../../../state/actions/resource-actions/load-actions';
import { setVariable } from '../../../../state/actions/variables-actions/variables-actions';
import {
  getManualAttributions,
  getSelectedAttributionId,
} from '../../../../state/selectors/resource-selectors';
import {
  FILTERED_ATTRIBUTIONS,
  FilteredData,
  initialFilteredAttributions,
} from '../../../../state/variables/use-filtered-data';
import { getParsedInputFileEnrichedWithTestData } from '../../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../../test-helpers/render';
import { AttributionList } from '../AttributionList';

describe('AttributionList', () => {
  it('correctly handles selected states on card click', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const manualAttributions = faker.opossum.attributions({
      [packageInfo.id]: packageInfo,
    });
    const { store } = renderComponent(<AttributionList />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
          }),
        ),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredData>(FILTERED_ATTRIBUTIONS, {
          ...initialFilteredAttributions,
          attributions: {
            [packageInfo.id]: packageInfo,
          },
        }),
      ],
    });

    await userEvent.click(
      screen.getByText(
        `${packageInfo.packageName}, ${packageInfo.packageVersion}`,
      ),
    );

    expect(getSelectedAttributionId(store.getState())).toBe(packageInfo.id);
  });

  it('deletes selected attribution', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const manualAttributions = faker.opossum.attributions({
      [packageInfo.id]: packageInfo,
    });
    const { store } = renderComponent(<AttributionList />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
          }),
        ),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredData>(FILTERED_ATTRIBUTIONS, {
          ...initialFilteredAttributions,
          attributions: {
            [packageInfo.id]: packageInfo,
          },
        }),
      ],
    });

    await userEvent.click(
      screen.getByText(
        `${packageInfo.packageName}, ${packageInfo.packageVersion}`,
      ),
    );
    await userEvent.click(screen.getByLabelText('delete button'));
    await userEvent.click(
      screen.getByRole('button', { name: text.deleteAttributionsPopup.delete }),
    );

    expect(getManualAttributions(store.getState())).toEqual({});
  });

  it('deletes multi-selected attributions', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const manualAttributions = faker.opossum.attributions({
      [packageInfo.id]: packageInfo,
    });
    const { store } = renderComponent(<AttributionList />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
          }),
        ),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredData>(FILTERED_ATTRIBUTIONS, {
          ...initialFilteredAttributions,
          attributions: {
            [packageInfo.id]: packageInfo,
          },
        }),
      ],
    });

    await userEvent.click(
      within(
        screen.getByLabelText(
          `package card ${packageInfo.packageName}, ${packageInfo.packageVersion}`,
        ),
      ).getByRole('checkbox'),
    );
    await userEvent.click(screen.getByLabelText('delete button'));
    await userEvent.click(
      screen.getByRole('button', { name: text.deleteAttributionsPopup.delete }),
    );

    expect(getManualAttributions(store.getState())).toEqual({});
  });

  it('confirms selected attribution', async () => {
    const packageInfo = faker.opossum.packageInfo({
      preSelected: true,
    });
    const manualAttributions = faker.opossum.attributions({
      [packageInfo.id]: packageInfo,
    });
    const { store } = renderComponent(<AttributionList />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
          }),
        ),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredData>(FILTERED_ATTRIBUTIONS, {
          ...initialFilteredAttributions,
          attributions: {
            [packageInfo.id]: packageInfo,
          },
        }),
      ],
    });

    await userEvent.click(
      screen.getByText(
        `${packageInfo.packageName}, ${packageInfo.packageVersion}`,
      ),
    );
    await userEvent.click(screen.getByLabelText('confirm button'));
    await userEvent.click(
      screen.getByRole('button', { name: text.saveAttributionsPopup.update }),
    );

    expect(getManualAttributions(store.getState())).toEqual<Attributions>({
      [packageInfo.id]: { ...packageInfo, preSelected: undefined },
    });
  });

  it('disables confirm button when selected attribution is not pre-selected', async () => {
    const packageInfo = faker.opossum.packageInfo({
      preSelected: false,
    });
    const manualAttributions = faker.opossum.attributions({
      [packageInfo.id]: packageInfo,
    });
    renderComponent(<AttributionList />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
          }),
        ),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredData>(FILTERED_ATTRIBUTIONS, {
          ...initialFilteredAttributions,
          attributions: {
            [packageInfo.id]: packageInfo,
          },
        }),
      ],
    });

    await userEvent.click(
      screen.getByText(
        `${packageInfo.packageName}, ${packageInfo.packageVersion}`,
      ),
    );

    expect(screen.getByLabelText('confirm button')).toBeDisabled();
  });

  it('confirms multi-selected attributions', async () => {
    const packageInfo = faker.opossum.packageInfo({
      preSelected: true,
    });
    const manualAttributions = faker.opossum.attributions({
      [packageInfo.id]: packageInfo,
    });
    const { store } = renderComponent(<AttributionList />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
          }),
        ),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredData>(FILTERED_ATTRIBUTIONS, {
          ...initialFilteredAttributions,
          attributions: {
            [packageInfo.id]: packageInfo,
          },
        }),
      ],
    });

    await userEvent.click(
      within(
        screen.getByLabelText(
          `package card ${packageInfo.packageName}, ${packageInfo.packageVersion}`,
        ),
      ).getByRole('checkbox'),
    );
    await userEvent.click(screen.getByLabelText('confirm button'));
    await userEvent.click(
      screen.getByRole('button', { name: text.saveAttributionsPopup.update }),
    );

    expect(getManualAttributions(store.getState())).toEqual<Attributions>({
      [packageInfo.id]: { ...packageInfo, preSelected: undefined },
    });
  });

  it('replaces selected attribution', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();
    const manualAttributions = faker.opossum.attributions({
      [packageInfo1.id]: packageInfo1,
      [packageInfo2.id]: packageInfo2,
    });
    renderComponent(<AttributionList />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
          }),
        ),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredData>(FILTERED_ATTRIBUTIONS, {
          ...initialFilteredAttributions,
          attributions: {
            [packageInfo1.id]: packageInfo1,
            [packageInfo2.id]: packageInfo2,
          },
        }),
      ],
    });

    await userEvent.click(
      screen.getByText(
        `${packageInfo1.packageName}, ${packageInfo1.packageVersion}`,
      ),
    );
    await userEvent.click(screen.getByLabelText('replace button'));

    expect(
      screen.getByText(text.packageLists.selectReplacement),
    ).toBeInTheDocument();
  });

  it('replaces multi-selected attributions', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();
    const manualAttributions = faker.opossum.attributions({
      [packageInfo1.id]: packageInfo1,
      [packageInfo2.id]: packageInfo2,
    });
    renderComponent(<AttributionList />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
          }),
        ),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredData>(FILTERED_ATTRIBUTIONS, {
          ...initialFilteredAttributions,
          attributions: {
            [packageInfo1.id]: packageInfo1,
            [packageInfo2.id]: packageInfo2,
          },
        }),
      ],
    });

    await userEvent.click(
      within(
        screen.getByLabelText(
          `package card ${packageInfo1.packageName}, ${packageInfo1.packageVersion}`,
        ),
      ).getByRole('checkbox'),
    );
    await userEvent.click(screen.getByLabelText('replace button'));

    expect(
      screen.getByText(text.packageLists.selectReplacement),
    ).toBeInTheDocument();
  });

  it('disables replace button when no replacements exist', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const manualAttributions = faker.opossum.attributions({
      [packageInfo.id]: packageInfo,
    });
    renderComponent(<AttributionList />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
          }),
        ),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredData>(FILTERED_ATTRIBUTIONS, {
          ...initialFilteredAttributions,
          attributions: {
            [packageInfo.id]: packageInfo,
          },
        }),
      ],
    });

    await userEvent.click(
      screen.getByText(
        `${packageInfo.packageName}, ${packageInfo.packageVersion}`,
      ),
    );

    expect(screen.getByLabelText('replace button')).toBeDisabled();
  });
});
