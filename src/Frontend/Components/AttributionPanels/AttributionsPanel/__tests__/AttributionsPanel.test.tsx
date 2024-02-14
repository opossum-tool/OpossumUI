// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  Attributions,
  ResourcesToAttributions,
} from '../../../../../shared/shared-types';
import { text } from '../../../../../shared/text';
import { faker } from '../../../../../testing/Faker';
import { ROOT_PATH } from '../../../../shared-constants';
import {
  setProjectMetadata,
  setTemporaryDisplayPackageInfo,
} from '../../../../state/actions/resource-actions/all-views-simple-actions';
import {
  setSelectedAttributionId,
  setSelectedResourceId,
} from '../../../../state/actions/resource-actions/audit-view-simple-actions';
import { loadFromFile } from '../../../../state/actions/resource-actions/load-actions';
import { setVariable } from '../../../../state/actions/variables-actions/variables-actions';
import {
  getManualAttributions,
  getResourcesToManualAttributions,
  getSelectedAttributionId,
} from '../../../../state/selectors/resource-selectors';
import {
  FILTERED_ATTRIBUTIONS_AUDIT,
  FilteredData,
  initialFilteredAttributions,
} from '../../../../state/variables/use-filtered-data';
import { getParsedInputFileEnrichedWithTestData } from '../../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../../test-helpers/render';
import { AttributionsPanel } from '../AttributionsPanel';

describe('AttributionsPanel', () => {
  it('selects attribution on card click', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const manualAttributions = faker.opossum.attributions({
      [packageInfo.id]: packageInfo,
    });
    const { store } = renderComponent(<AttributionsPanel />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
          }),
        ),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredData>(FILTERED_ATTRIBUTIONS_AUDIT, {
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
    expect(
      screen.getByRole('button', { name: text.packageLists.create }),
    ).toBeEnabled();
  });

  it('selects attribution on checkbox click', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const manualAttributions = faker.opossum.attributions({
      [packageInfo.id]: packageInfo,
    });
    const { store } = renderComponent(<AttributionsPanel />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
          }),
        ),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredData>(FILTERED_ATTRIBUTIONS_AUDIT, {
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

    expect(getSelectedAttributionId(store.getState())).toBe(packageInfo.id);
  });

  it('shows alert when some attribution on current resource is incomplete', () => {
    const resourceId = faker.system.filePath();
    const packageInfo1 = faker.opossum.packageInfo({ packageName: undefined });
    const packageInfo2 = faker.opossum.packageInfo();
    const manualAttributions = faker.opossum.attributions({
      [packageInfo1.id]: packageInfo1,
      [packageInfo2.id]: packageInfo2,
    });
    renderComponent(<AttributionsPanel />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
            resourcesToManualAttributions: {
              [resourceId]: [packageInfo1.id, packageInfo2.id],
            },
          }),
        ),
        setSelectedResourceId(resourceId),
      ],
    });

    expect(
      screen.getByText(text.packageLists.incompleteAttributions),
    ).toBeInTheDocument();
  });

  it('creates new attribution', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const manualAttributions = faker.opossum.attributions({
      [packageInfo.id]: packageInfo,
    });
    const { store } = renderComponent(<AttributionsPanel />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
          }),
        ),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredData>(FILTERED_ATTRIBUTIONS_AUDIT, {
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
    await userEvent.click(
      screen.getByRole('button', { name: text.packageLists.create }),
    );

    expect(getSelectedAttributionId(store.getState())).toBe('');
    expect(
      screen.getByRole('button', { name: text.packageLists.create }),
    ).toBeDisabled();
  });

  it('deletes selected attribution', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const manualAttributions = faker.opossum.attributions({
      [packageInfo.id]: packageInfo,
    });
    const { store } = renderComponent(<AttributionsPanel />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
          }),
        ),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredData>(FILTERED_ATTRIBUTIONS_AUDIT, {
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
    await userEvent.click(
      screen.getByRole('button', { name: text.packageLists.delete }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: text.deleteAttributionsPopup.delete }),
    );

    expect(getManualAttributions(store.getState())).toEqual({});
  });

  it('links selected attribution', async () => {
    const filePath = faker.system.filePath();
    const packageInfo = faker.opossum.packageInfo();
    const manualAttributions = faker.opossum.attributions({
      [packageInfo.id]: packageInfo,
    });
    const { store } = renderComponent(<AttributionsPanel />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
            resourcesToManualAttributions: {
              [filePath]: [packageInfo.id],
            },
          }),
        ),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredData>(FILTERED_ATTRIBUTIONS_AUDIT, {
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
    await userEvent.click(
      screen.getByRole('button', { name: text.packageLists.linkAsAttribution }),
    );

    expect(
      getResourcesToManualAttributions(store.getState()),
    ).toEqual<ResourcesToAttributions>({
      [ROOT_PATH]: [packageInfo.id],
    });
  });

  it('disables link button when package info modified', async () => {
    const filePath = faker.system.filePath();
    const packageInfo = faker.opossum.packageInfo();
    const manualAttributions = faker.opossum.attributions({
      [packageInfo.id]: packageInfo,
    });
    const { store } = renderComponent(<AttributionsPanel />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
            resourcesToManualAttributions: {
              [filePath]: [packageInfo.id],
            },
          }),
        ),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredData>(FILTERED_ATTRIBUTIONS_AUDIT, {
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
    act(() => {
      store.dispatch(
        setTemporaryDisplayPackageInfo({
          ...packageInfo,
          packageName: faker.string.sample(),
        }),
      );
    });

    expect(
      screen.getByRole('button', { name: text.packageLists.linkAsAttribution }),
    ).toBeDisabled();
  });

  it('disables link button when only resource related attributions available', async () => {
    const filePath = faker.system.filePath();
    const packageInfo = faker.opossum.packageInfo({ relation: 'resource' });
    const manualAttributions = faker.opossum.attributions({
      [packageInfo.id]: packageInfo,
    });
    renderComponent(<AttributionsPanel />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
            resourcesToManualAttributions: {
              [filePath]: [packageInfo.id],
            },
          }),
        ),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredData>(FILTERED_ATTRIBUTIONS_AUDIT, {
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

    expect(
      screen.getByRole('button', { name: text.packageLists.linkAsAttribution }),
    ).toBeDisabled();
  });

  it('disables link button when selected resource is a breakpoint', async () => {
    const filePath = faker.system.filePath();
    const packageInfo = faker.opossum.packageInfo();
    const manualAttributions = faker.opossum.attributions({
      [packageInfo.id]: packageInfo,
    });
    renderComponent(<AttributionsPanel />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
            attributionBreakpoints: new Set([filePath]),
            resourcesToExternalAttributions: {
              [filePath]: [packageInfo.id],
            },
          }),
        ),
        setSelectedResourceId(filePath),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredData>(FILTERED_ATTRIBUTIONS_AUDIT, {
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

    expect(
      screen.getByRole('button', { name: text.packageLists.linkAsAttribution }),
    ).toBeDisabled();
  });

  it('confirms selected attribution', async () => {
    const packageInfo = faker.opossum.packageInfo({
      preSelected: true,
    });
    const manualAttributions = faker.opossum.attributions({
      [packageInfo.id]: packageInfo,
    });
    const { store } = renderComponent(<AttributionsPanel />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
          }),
        ),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredData>(FILTERED_ATTRIBUTIONS_AUDIT, {
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
    await userEvent.click(
      screen.getByRole('button', { name: text.packageLists.confirm }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: text.saveAttributionsPopup.confirm }),
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
    renderComponent(<AttributionsPanel />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
          }),
        ),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredData>(FILTERED_ATTRIBUTIONS_AUDIT, {
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

    expect(
      screen.getByRole('button', { name: text.packageLists.confirm }),
    ).toBeDisabled();
  });

  it('replaces selected attribution', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();
    const manualAttributions = faker.opossum.attributions({
      [packageInfo1.id]: packageInfo1,
      [packageInfo2.id]: packageInfo2,
    });
    renderComponent(<AttributionsPanel />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
          }),
        ),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredData>(FILTERED_ATTRIBUTIONS_AUDIT, {
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
    await userEvent.click(
      screen.getByRole('button', { name: text.packageLists.replace }),
    );

    expect(
      screen.getByText(text.packageLists.selectReplacement),
    ).toBeInTheDocument();
  });

  it('disables replace button when no replacements exist', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const manualAttributions = faker.opossum.attributions({
      [packageInfo.id]: packageInfo,
    });
    renderComponent(<AttributionsPanel />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
          }),
        ),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredData>(FILTERED_ATTRIBUTIONS_AUDIT, {
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

    expect(
      screen.getByRole('button', { name: text.packageLists.replace }),
    ).toBeDisabled();
  });

  it('disables various buttons in replacement mode', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();
    const manualAttributions = faker.opossum.attributions({
      [packageInfo1.id]: packageInfo1,
      [packageInfo2.id]: packageInfo2,
    });
    renderComponent(<AttributionsPanel />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
          }),
        ),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredData>(FILTERED_ATTRIBUTIONS_AUDIT, {
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
    await userEvent.click(
      screen.getByRole('button', { name: text.packageLists.replace }),
    );

    expect(
      screen.getByRole('button', { name: text.packageLists.create }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: text.packageLists.linkAsAttribution }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: text.packageLists.confirm }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: text.packageLists.delete }),
    ).toBeDisabled();
  });

  it('exits replacement mode when an external attribution is selected', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();
    const packageInfo3 = faker.opossum.packageInfo();
    const manualAttributions = faker.opossum.attributions({
      [packageInfo1.id]: packageInfo1,
      [packageInfo2.id]: packageInfo2,
    });
    const { store } = renderComponent(<AttributionsPanel />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions,
            externalAttributions: {
              [packageInfo3.id]: packageInfo3,
            },
          }),
        ),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredData>(FILTERED_ATTRIBUTIONS_AUDIT, {
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
    await userEvent.click(
      screen.getByRole('button', { name: text.packageLists.replace }),
    );
    act(() => {
      store.dispatch(setSelectedAttributionId(packageInfo3.id));
    });

    expect(
      screen.queryByText(text.packageLists.selectReplacement),
    ).not.toBeInTheDocument();
  });
});
