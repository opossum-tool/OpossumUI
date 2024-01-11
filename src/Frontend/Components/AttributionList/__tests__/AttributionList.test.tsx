// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fromPairs, remove } from 'lodash';

import { Attributions, Criticality } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { PopupType } from '../../../enums/enums';
import { setProjectMetadata } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { setVariable } from '../../../state/actions/variables-actions/variables-actions';
import { getManualAttributions } from '../../../state/selectors/all-views-resource-selectors';
import { getSelectedAttributionIdInAttributionView } from '../../../state/selectors/attribution-view-resource-selectors';
import { getOpenPopup } from '../../../state/selectors/view-selector';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { getStrippedPackageInfo } from '../../../util/get-stripped-package-info';
import { AttributionViewSorting } from '../../../util/use-active-sorting';
import {
  FilterCounts,
  filters,
  qaFilters,
} from '../../../web-workers/scripts/get-filtered-attributions';
import {
  FilteredAttributions,
  initialFilteredAttributions,
  WORKER_REDUX_KEYS,
} from '../../../web-workers/use-signals-worker';
import { AttributionList } from '../AttributionList';

describe('AttributionList', () => {
  it('renders nothing when there is no project ID', () => {
    const { container } = renderComponent(<AttributionList />, {
      actions: [setProjectMetadata(faker.opossum.metadata({ projectId: '' }))],
    });

    expect(container).toBeEmptyDOMElement();
  });

  it('sorts attributions alphabetically', () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
      packageName: 'B',
    });
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution({
      packageName: 'A',
    });
    const manualAttributions = faker.opossum.manualAttributions({
      [attributionId1]: packageInfo1,
      [attributionId2]: packageInfo2,
    });
    renderComponent(<AttributionList />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
          }),
        ),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredAttributions>(
          WORKER_REDUX_KEYS.FILTERED_ATTRIBUTIONS,
          {
            ...initialFilteredAttributions,
            attributions: manualAttributions,
          },
        ),
      ],
    });

    expect(
      screen
        .getByText(
          `${packageInfo1.packageName}, ${packageInfo1.packageVersion}`,
        )
        .compareDocumentPosition(
          screen.getByText(
            `${packageInfo2.packageName}, ${packageInfo2.packageVersion}`,
          ),
        ),
    ).toBe(2);
  });

  it('sorts attributions by criticality', () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
      criticality: undefined,
    });
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution({
      criticality: Criticality.High,
    });
    const [attributionId3, packageInfo3] = faker.opossum.manualAttribution({
      criticality: Criticality.Medium,
    });
    const manualAttributions = faker.opossum.manualAttributions({
      [attributionId1]: packageInfo1,
      [attributionId2]: packageInfo2,
      [attributionId3]: packageInfo3,
    });
    renderComponent(<AttributionList />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
          }),
        ),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredAttributions>(
          WORKER_REDUX_KEYS.FILTERED_ATTRIBUTIONS,
          {
            ...initialFilteredAttributions,
            attributions: manualAttributions,
          },
        ),
        setVariable<AttributionViewSorting>(
          'active-sorting-attribution-view',
          text.attributionViewSorting.byCriticality,
        ),
      ],
    });

    expect(
      screen
        .getByText(new RegExp(packageInfo2.packageName!))
        .compareDocumentPosition(
          screen.getByText(new RegExp(packageInfo3.packageName!)),
        ),
    ).toBe(4);
    expect(
      screen
        .getByText(new RegExp(packageInfo3.packageName!))
        .compareDocumentPosition(
          screen.getByText(new RegExp(packageInfo1.packageName!)),
        ),
    ).toBe(4);
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
        setVariable<FilteredAttributions>(
          WORKER_REDUX_KEYS.FILTERED_ATTRIBUTIONS,
          {
            ...initialFilteredAttributions,
            attributions: manualAttributions,
          },
        ),
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

  it('searches for attributions', async () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution();
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution();
    const manualAttributions = faker.opossum.manualAttributions({
      [attributionId1]: packageInfo1,
      [attributionId2]: packageInfo2,
    });
    renderComponent(<AttributionList />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
          }),
        ),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredAttributions>(
          WORKER_REDUX_KEYS.FILTERED_ATTRIBUTIONS,
          {
            ...initialFilteredAttributions,
            attributions: manualAttributions,
          },
        ),
      ],
    });

    await userEvent.click(screen.getByRole('searchbox'));
    await userEvent.paste(packageInfo1.packageName);

    expect(
      screen.getByText(new RegExp(packageInfo1.packageName!)),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(new RegExp(packageInfo2.packageName!)),
    ).not.toBeInTheDocument();
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
        setVariable<FilteredAttributions>(
          WORKER_REDUX_KEYS.FILTERED_ATTRIBUTIONS,
          {
            ...initialFilteredAttributions,
            attributions: manualAttributions,
          },
        ),
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
        setVariable<FilteredAttributions>(
          WORKER_REDUX_KEYS.FILTERED_ATTRIBUTIONS,
          {
            ...initialFilteredAttributions,
            attributions: manualAttributions,
          },
        ),
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
        setVariable<FilteredAttributions>(
          WORKER_REDUX_KEYS.FILTERED_ATTRIBUTIONS,
          {
            ...initialFilteredAttributions,
            attributions: manualAttributions,
          },
        ),
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
        setVariable<FilteredAttributions>(
          WORKER_REDUX_KEYS.FILTERED_ATTRIBUTIONS,
          {
            ...initialFilteredAttributions,
            attributions: manualAttributions,
          },
        ),
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
        setVariable<FilteredAttributions>(
          WORKER_REDUX_KEYS.FILTERED_ATTRIBUTIONS,
          {
            ...initialFilteredAttributions,
            attributions: manualAttributions,
          },
        ),
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
        setVariable<FilteredAttributions>(
          WORKER_REDUX_KEYS.FILTERED_ATTRIBUTIONS,
          {
            ...initialFilteredAttributions,
            attributions: manualAttributions,
          },
        ),
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
        setVariable<FilteredAttributions>(
          WORKER_REDUX_KEYS.FILTERED_ATTRIBUTIONS,
          {
            ...initialFilteredAttributions,
            attributions: manualAttributions,
          },
        ),
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
        setVariable<FilteredAttributions>(
          WORKER_REDUX_KEYS.FILTERED_ATTRIBUTIONS,
          {
            ...initialFilteredAttributions,
            attributions: manualAttributions,
          },
        ),
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
        setVariable<FilteredAttributions>(
          WORKER_REDUX_KEYS.FILTERED_ATTRIBUTIONS,
          {
            ...initialFilteredAttributions,
            attributions: manualAttributions,
            counts: fromPairs(
              filters.map((filter) => [
                filter,
                filter === text.attributionFilters.firstParty ? 1 : 0,
              ]),
            ) as FilterCounts,
          },
        ),
      ],
    });

    await userEvent.click(screen.getByLabelText('filter button'));

    expect(
      screen.getByText(new RegExp(text.attributionFilters.firstParty)),
    ).toBeInTheDocument();
    remove(filters, text.attributionFilters.firstParty).forEach((filter) =>
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
        setVariable<FilteredAttributions>(
          WORKER_REDUX_KEYS.FILTERED_ATTRIBUTIONS,
          {
            ...initialFilteredAttributions,
            attributions: manualAttributions,
            counts: fromPairs(
              filters.map((filter) => [filter, 1]),
            ) as FilterCounts,
          },
        ),
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
        setVariable<FilteredAttributions>(
          WORKER_REDUX_KEYS.FILTERED_ATTRIBUTIONS,
          {
            ...initialFilteredAttributions,
            attributions: manualAttributions,
            counts: fromPairs(
              filters.map((filter) => [filter, 1]),
            ) as FilterCounts,
          },
        ),
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
        setVariable<FilteredAttributions>(
          WORKER_REDUX_KEYS.FILTERED_ATTRIBUTIONS,
          {
            ...initialFilteredAttributions,
            attributions: manualAttributions,
            selectedFilters: filters,
            counts: fromPairs(
              filters.map((filter) => [filter, 0]),
            ) as FilterCounts,
          },
        ),
      ],
    });

    await waitFor(() =>
      expect(
        (
          store.getState().variablesState[
            WORKER_REDUX_KEYS.FILTERED_ATTRIBUTIONS
          ] as FilteredAttributions
        ).selectedFilters,
      ).toHaveLength(0),
    );
  });
});
