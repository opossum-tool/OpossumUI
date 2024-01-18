// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fromPairs, remove } from 'lodash';

import { Attributions } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { PopupType } from '../../../enums/enums';
import { FilterCounts, filters, qaFilters } from '../../../shared-constants';
import { setProjectMetadata } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { setVariable } from '../../../state/actions/variables-actions/variables-actions';
import { getManualAttributions } from '../../../state/selectors/all-views-resource-selectors';
import { getSelectedAttributionIdInAttributionView } from '../../../state/selectors/attribution-view-resource-selectors';
import { getOpenPopup } from '../../../state/selectors/view-selector';
import {
  FILTERED_ATTRIBUTIONS,
  FilteredAttributions,
  initialFilteredAttributions,
} from '../../../state/variables/use-filtered-attributions';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { convertPackageInfoToDisplayPackageInfo } from '../../../util/convert-package-info';
import { getStrippedPackageInfo } from '../../../util/get-stripped-package-info';
import { AttributionList } from '../AttributionList';

describe('AttributionList', () => {
  it('renders nothing when there is no project ID', () => {
    const { container } = renderComponent(<AttributionList />, {
      actions: [setProjectMetadata(faker.opossum.metadata({ projectId: '' }))],
    });

    expect(container).toBeEmptyDOMElement();
  });

  it('correctly handles selected states on card click', async () => {
    const [attributionId, packageInfo] = faker.opossum.manualAttribution();
    const manualAttributions = faker.opossum.manualAttributions({
      [attributionId]: packageInfo,
    });
    const { store } = renderComponent(<AttributionList />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
          }),
        ),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredAttributions>(FILTERED_ATTRIBUTIONS, {
          ...initialFilteredAttributions,
          attributions: {
            [attributionId]: convertPackageInfoToDisplayPackageInfo(
              packageInfo,
              [attributionId],
            ),
          },
        }),
      ],
    });

    await userEvent.click(
      screen.getByText(
        `${packageInfo.packageName}, ${packageInfo.packageVersion}`,
      ),
    );

    expect(getSelectedAttributionIdInAttributionView(store.getState())).toBe(
      attributionId,
    );
  });

  it('deletes selected attribution', async () => {
    const [attributionId, packageInfo] = faker.opossum.manualAttribution();
    const manualAttributions = faker.opossum.manualAttributions({
      [attributionId]: packageInfo,
    });
    const { store } = renderComponent(<AttributionList />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
          }),
        ),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredAttributions>(FILTERED_ATTRIBUTIONS, {
          ...initialFilteredAttributions,
          attributions: {
            [attributionId]: convertPackageInfoToDisplayPackageInfo(
              packageInfo,
              [attributionId],
            ),
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

    expect(getOpenPopup(store.getState())).toBe(
      PopupType.ConfirmMultiSelectDeletionPopup,
    );
  });

  it('deletes multi-selected attributions', async () => {
    const [attributionId, packageInfo] = faker.opossum.manualAttribution();
    const manualAttributions = faker.opossum.manualAttributions({
      [attributionId]: packageInfo,
    });
    const { store } = renderComponent(<AttributionList />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
          }),
        ),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredAttributions>(FILTERED_ATTRIBUTIONS, {
          ...initialFilteredAttributions,
          attributions: {
            [attributionId]: convertPackageInfoToDisplayPackageInfo(
              packageInfo,
              [attributionId],
            ),
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

    expect(getOpenPopup(store.getState())).toBe(
      PopupType.ConfirmMultiSelectDeletionPopup,
    );
  });

  it('confirms selected attribution', async () => {
    const [attributionId, packageInfo] = faker.opossum.manualAttribution({
      preSelected: true,
    });
    const manualAttributions = faker.opossum.manualAttributions({
      [attributionId]: packageInfo,
    });
    const { store } = renderComponent(<AttributionList />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
          }),
        ),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredAttributions>(FILTERED_ATTRIBUTIONS, {
          ...initialFilteredAttributions,
          attributions: {
            [attributionId]: convertPackageInfoToDisplayPackageInfo(
              packageInfo,
              [attributionId],
            ),
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

    expect(getManualAttributions(store.getState())).toEqual<Attributions>({
      [attributionId]: getStrippedPackageInfo(packageInfo),
    });
  });

  it('disables confirm button when selected attribution is not pre-selected', async () => {
    const [attributionId, packageInfo] = faker.opossum.manualAttribution({
      preSelected: false,
    });
    const manualAttributions = faker.opossum.manualAttributions({
      [attributionId]: packageInfo,
    });
    renderComponent(<AttributionList />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
          }),
        ),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredAttributions>(FILTERED_ATTRIBUTIONS, {
          ...initialFilteredAttributions,
          attributions: {
            [attributionId]: convertPackageInfoToDisplayPackageInfo(
              packageInfo,
              [attributionId],
            ),
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
    const [attributionId, packageInfo] = faker.opossum.manualAttribution({
      preSelected: true,
    });
    const manualAttributions = faker.opossum.manualAttributions({
      [attributionId]: packageInfo,
    });
    const { store } = renderComponent(<AttributionList />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
          }),
        ),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredAttributions>(FILTERED_ATTRIBUTIONS, {
          ...initialFilteredAttributions,
          attributions: {
            [attributionId]: convertPackageInfoToDisplayPackageInfo(
              packageInfo,
              [attributionId],
            ),
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

    expect(getManualAttributions(store.getState())).toEqual<Attributions>({
      [attributionId]: getStrippedPackageInfo(packageInfo),
    });
  });

  it('replaces selected attribution', async () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution();
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution();
    const manualAttributions = faker.opossum.manualAttributions({
      [attributionId1]: packageInfo1,
      [attributionId2]: packageInfo2,
    });
    const { store } = renderComponent(<AttributionList />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
          }),
        ),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredAttributions>(FILTERED_ATTRIBUTIONS, {
          ...initialFilteredAttributions,
          attributions: {
            [attributionId1]: convertPackageInfoToDisplayPackageInfo(
              packageInfo1,
              [attributionId1],
            ),
            [attributionId2]: convertPackageInfoToDisplayPackageInfo(
              packageInfo2,
              [attributionId2],
            ),
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

    expect(getOpenPopup(store.getState())).toBe(
      PopupType.ReplaceAttributionsPopup,
    );
  });

  it('replaces multi-selected attributions', async () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution();
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution();
    const manualAttributions = faker.opossum.manualAttributions({
      [attributionId1]: packageInfo1,
      [attributionId2]: packageInfo2,
    });
    const { store } = renderComponent(<AttributionList />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
          }),
        ),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredAttributions>(FILTERED_ATTRIBUTIONS, {
          ...initialFilteredAttributions,
          attributions: {
            [attributionId1]: convertPackageInfoToDisplayPackageInfo(
              packageInfo1,
              [attributionId1],
            ),
            [attributionId2]: convertPackageInfoToDisplayPackageInfo(
              packageInfo2,
              [attributionId2],
            ),
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

    expect(getOpenPopup(store.getState())).toBe(
      PopupType.ReplaceAttributionsPopup,
    );
  });

  it('disables replace button when no replacements exist', async () => {
    const [attributionId, packageInfo] = faker.opossum.manualAttribution();
    const manualAttributions = faker.opossum.manualAttributions({
      [attributionId]: packageInfo,
    });
    renderComponent(<AttributionList />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
          }),
        ),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredAttributions>(FILTERED_ATTRIBUTIONS, {
          ...initialFilteredAttributions,
          attributions: {
            [attributionId]: convertPackageInfoToDisplayPackageInfo(
              packageInfo,
              [attributionId],
            ),
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

  it('shows only filters with non-zero counts', async () => {
    const [attributionId, packageInfo] = faker.opossum.manualAttribution();
    const manualAttributions = faker.opossum.manualAttributions({
      [attributionId]: packageInfo,
    });
    renderComponent(<AttributionList />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
          }),
        ),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredAttributions>(FILTERED_ATTRIBUTIONS, {
          ...initialFilteredAttributions,
          attributions: {
            [attributionId]: convertPackageInfoToDisplayPackageInfo(
              packageInfo,
              [attributionId],
            ),
          },
          counts: fromPairs(
            filters.map((filter) => [
              filter,
              filter === text.filters.firstParty ? 1 : 0,
            ]),
          ) as FilterCounts,
        }),
      ],
    });

    await userEvent.click(screen.getByLabelText('filter button'));

    expect(
      screen.getByText(new RegExp(text.filters.firstParty)),
    ).toBeInTheDocument();
    remove(filters, text.filters.firstParty).forEach((filter) =>
      expect(screen.queryByText(new RegExp(filter))).not.toBeInTheDocument(),
    );
  });

  it('shows QA filters in QA mode', async () => {
    const [attributionId, packageInfo] = faker.opossum.manualAttribution();
    const manualAttributions = faker.opossum.manualAttributions({
      [attributionId]: packageInfo,
    });

    jest.spyOn(window.electronAPI, 'getUserSetting').mockResolvedValue(true);

    renderComponent(<AttributionList />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
          }),
        ),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredAttributions>(FILTERED_ATTRIBUTIONS, {
          ...initialFilteredAttributions,
          attributions: {
            [attributionId]: convertPackageInfoToDisplayPackageInfo(
              packageInfo,
              [attributionId],
            ),
          },
          counts: fromPairs(
            filters.map((filter) => [filter, 1]),
          ) as FilterCounts,
        }),
      ],
    });

    await userEvent.click(screen.getByLabelText('filter button'));

    qaFilters.forEach((filter) =>
      expect(screen.getByText(new RegExp(filter))).toBeInTheDocument(),
    );
  });

  it('does not show QA filters when not in QA mode', async () => {
    const [attributionId, packageInfo] = faker.opossum.manualAttribution();
    const manualAttributions = faker.opossum.manualAttributions({
      [attributionId]: packageInfo,
    });

    jest.spyOn(window.electronAPI, 'getUserSetting').mockResolvedValue(false);

    renderComponent(<AttributionList />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
          }),
        ),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredAttributions>(FILTERED_ATTRIBUTIONS, {
          ...initialFilteredAttributions,
          attributions: {
            [attributionId]: convertPackageInfoToDisplayPackageInfo(
              packageInfo,
              [attributionId],
            ),
          },
          counts: fromPairs(
            filters.map((filter) => [filter, 1]),
          ) as FilterCounts,
        }),
      ],
    });

    await userEvent.click(screen.getByLabelText('filter button'));

    qaFilters.forEach((filter) =>
      expect(screen.queryByText(new RegExp(filter))).not.toBeInTheDocument(),
    );
  });

  it('removes filters with zero attributions', async () => {
    const [attributionId, packageInfo] = faker.opossum.manualAttribution();
    const manualAttributions = faker.opossum.manualAttributions({
      [attributionId]: packageInfo,
    });
    const { store } = renderComponent(<AttributionList />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
          }),
        ),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredAttributions>(FILTERED_ATTRIBUTIONS, {
          ...initialFilteredAttributions,
          attributions: {
            [attributionId]: convertPackageInfoToDisplayPackageInfo(
              packageInfo,
              [attributionId],
            ),
          },
          selectedFilters: filters,
          counts: fromPairs(
            filters.map((filter) => [filter, 0]),
          ) as FilterCounts,
        }),
      ],
    });

    await waitFor(() =>
      expect(
        (
          store.getState().variablesState[
            FILTERED_ATTRIBUTIONS
          ] as FilteredAttributions
        ).selectedFilters,
      ).toHaveLength(0),
    );
  });
});
