// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../../shared-constants';
import { setTemporaryDisplayPackageInfo } from '../../../state/actions/resource-actions/all-views-simple-actions';
import {
  setResolvedExternalAttributions,
  setSelectedAttributionId,
  setSelectedResourceId,
} from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { setVariable } from '../../../state/actions/variables-actions/variables-actions';
import { getTemporaryDisplayPackageInfo } from '../../../state/selectors/resource-selectors';
import { ATTRIBUTION_IDS_FOR_REPLACEMENT } from '../../../state/variables/use-attribution-ids-for-replacement';
import {
  FILTERED_SIGNALS,
  FilteredData,
  initialFilteredAttributions,
} from '../../../state/variables/use-filtered-data';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { AttributionDetails } from '../AttributionDetails';

describe('AttributionDetails', () => {
  it('renders nothing when the selected attribution ID is not visible', () => {
    const packageInfo = faker.opossum.packageInfo();
    const { container } = renderComponent(<AttributionDetails />, {
      actions: [
        setTemporaryDisplayPackageInfo(packageInfo),
        setSelectedAttributionId(packageInfo.id),
      ],
    });

    expect(container).toBeEmptyDOMElement();
  });

  it('renders no buttons when the selected attribution is marked for replacement', () => {
    const packageInfo = faker.opossum.packageInfo();
    renderComponent(<AttributionDetails />, {
      actions: [
        setTemporaryDisplayPackageInfo(packageInfo),
        setSelectedAttributionId(packageInfo.id),
        setVariable<FilteredData>(FILTERED_SIGNALS, {
          ...initialFilteredAttributions,
          attributions: { [packageInfo.id]: packageInfo },
        }),
        setVariable<Array<string>>(ATTRIBUTION_IDS_FOR_REPLACEMENT, [
          packageInfo.id,
        ]),
      ],
    });

    expect(
      screen.queryByRole('button', { name: text.attributionColumn.replace }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: text.attributionColumn.confirm }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: text.attributionColumn.save }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: text.attributionColumn.link }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: text.attributionColumn.delete }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: text.attributionColumn.revert }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: text.attributionColumn.restore }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: text.attributionColumn.compareToOriginal,
      }),
    ).not.toBeInTheDocument();
  });

  it('replaces attribution', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();
    const resourceId = faker.system.filePath();
    renderComponent(<AttributionDetails />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions: faker.opossum.attributions({
              [packageInfo1.id]: packageInfo1,
              [packageInfo2.id]: packageInfo2,
            }),
            resourcesToManualAttributions: {
              [resourceId]: [packageInfo1.id, packageInfo2.id],
            },
          }),
        ),
        setTemporaryDisplayPackageInfo(packageInfo1),
        setSelectedAttributionId(packageInfo1.id),
        setVariable<FilteredData>(FILTERED_SIGNALS, {
          ...initialFilteredAttributions,
          attributions: {
            [packageInfo1.id]: packageInfo1,
            [packageInfo2.id]: packageInfo2,
          },
        }),
        setVariable<Array<string>>(ATTRIBUTION_IDS_FOR_REPLACEMENT, [
          packageInfo2.id,
        ]),
      ],
    });

    await userEvent.click(
      screen.getByRole('button', { name: text.attributionColumn.replace }),
    );
    await userEvent.click(
      screen.getByRole('button', {
        name: text.replaceAttributionsPopup.replace,
      }),
    );

    expect(window.electronAPI.saveFile).toHaveBeenCalledTimes(1);
    expect(window.electronAPI.saveFile).toHaveBeenCalledWith({
      manualAttributions: {
        [packageInfo1.id]: packageInfo1,
      },
      resolvedExternalAttributions: new Set(),
      resourcesToAttributions: { [resourceId]: [packageInfo1.id] },
    });
  });

  it('saves modified attribution', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();
    const newPackageName = faker.company.name();
    const resourceId = faker.system.filePath();
    renderComponent(<AttributionDetails />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions: faker.opossum.attributions({
              [packageInfo1.id]: packageInfo1,
              [packageInfo2.id]: packageInfo2,
            }),
            resourcesToManualAttributions: {
              [resourceId]: [packageInfo1.id, packageInfo2.id],
            },
          }),
        ),
        setTemporaryDisplayPackageInfo({
          ...packageInfo1,
          packageName: newPackageName,
        }),
        setSelectedAttributionId(packageInfo1.id),
        setVariable<FilteredData>(FILTERED_SIGNALS, {
          ...initialFilteredAttributions,
          attributions: {
            [packageInfo1.id]: packageInfo1,
            [packageInfo2.id]: packageInfo2,
          },
        }),
      ],
    });

    await userEvent.click(
      screen.getByRole('button', { name: text.attributionColumn.save }),
    );

    expect(window.electronAPI.saveFile).toHaveBeenCalledTimes(1);
    expect(window.electronAPI.saveFile).toHaveBeenCalledWith({
      manualAttributions: {
        [packageInfo1.id]: {
          ...packageInfo1,
          packageName: newPackageName,
        },
        [packageInfo2.id]: packageInfo2,
      },
      resolvedExternalAttributions: new Set(),
      resourcesToAttributions: {
        [resourceId]: [packageInfo1.id, packageInfo2.id],
      },
    });
  });

  it('confirms attribution', async () => {
    const packageInfo1 = faker.opossum.packageInfo({ preSelected: true });
    const packageInfo2 = faker.opossum.packageInfo();
    const resourceId = faker.system.filePath();
    renderComponent(<AttributionDetails />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions: faker.opossum.attributions({
              [packageInfo1.id]: packageInfo1,
              [packageInfo2.id]: packageInfo2,
            }),
            resourcesToManualAttributions: {
              [resourceId]: [packageInfo1.id, packageInfo2.id],
            },
          }),
        ),
        setTemporaryDisplayPackageInfo(packageInfo1),
        setSelectedAttributionId(packageInfo1.id),
        setVariable<FilteredData>(FILTERED_SIGNALS, {
          ...initialFilteredAttributions,
          attributions: {
            [packageInfo1.id]: packageInfo1,
            [packageInfo2.id]: packageInfo2,
          },
        }),
      ],
    });

    await userEvent.click(
      screen.getByRole('button', { name: text.attributionColumn.confirm }),
    );

    expect(window.electronAPI.saveFile).toHaveBeenCalledTimes(1);
    expect(window.electronAPI.saveFile).toHaveBeenCalledWith({
      manualAttributions: {
        [packageInfo1.id]: { ...packageInfo1, preSelected: undefined },
        [packageInfo2.id]: packageInfo2,
      },
      resolvedExternalAttributions: new Set(),
      resourcesToAttributions: {
        [resourceId]: [packageInfo1.id, packageInfo2.id],
      },
    });
  });

  it('disables save button if package is neither pre-selected nor modified', () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();
    const resourceId = faker.system.filePath();
    renderComponent(<AttributionDetails />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions: faker.opossum.attributions({
              [packageInfo1.id]: packageInfo1,
              [packageInfo2.id]: packageInfo2,
            }),
            resourcesToManualAttributions: {
              [resourceId]: [packageInfo1.id, packageInfo2.id],
            },
          }),
        ),
        setTemporaryDisplayPackageInfo(packageInfo1),
        setSelectedAttributionId(packageInfo1.id),
        setVariable<FilteredData>(FILTERED_SIGNALS, {
          ...initialFilteredAttributions,
          attributions: {
            [packageInfo1.id]: packageInfo1,
            [packageInfo2.id]: packageInfo2,
          },
        }),
      ],
    });

    expect(
      screen.getByRole('button', { name: text.attributionColumn.save }),
    ).toBeDisabled();
  });

  it('links attribution', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();
    const resourceId = faker.system.filePath();
    renderComponent(<AttributionDetails />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions: faker.opossum.attributions({
              [packageInfo1.id]: packageInfo1,
              [packageInfo2.id]: packageInfo2,
            }),
            resourcesToManualAttributions: {
              [resourceId]: [packageInfo1.id],
            },
          }),
        ),
        setSelectedResourceId(resourceId),
        setTemporaryDisplayPackageInfo(packageInfo2),
        setSelectedAttributionId(packageInfo2.id),
        setVariable<FilteredData>(FILTERED_SIGNALS, {
          ...initialFilteredAttributions,
          attributions: {
            [packageInfo1.id]: packageInfo1,
            [packageInfo2.id]: packageInfo2,
          },
        }),
      ],
    });

    await userEvent.click(
      screen.getByRole('button', { name: text.attributionColumn.link }),
    );

    expect(window.electronAPI.saveFile).toHaveBeenCalledTimes(1);
    expect(window.electronAPI.saveFile).toHaveBeenCalledWith({
      manualAttributions: {
        [packageInfo1.id]: packageInfo1,
        [packageInfo2.id]: packageInfo2,
      },
      resolvedExternalAttributions: new Set(),
      resourcesToAttributions: {
        [resourceId]: [packageInfo1.id, packageInfo2.id],
      },
    });
  });

  it('disables link button when package is modified', () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();
    const resourceId = faker.system.filePath();
    renderComponent(<AttributionDetails />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions: faker.opossum.attributions({
              [packageInfo1.id]: packageInfo1,
              [packageInfo2.id]: packageInfo2,
            }),
            resourcesToManualAttributions: {
              [resourceId]: [packageInfo1.id],
            },
          }),
        ),
        setSelectedResourceId(resourceId),
        setTemporaryDisplayPackageInfo({
          ...packageInfo2,
          packageName: faker.company.name(),
        }),
        setSelectedAttributionId(packageInfo2.id),
        setVariable<FilteredData>(FILTERED_SIGNALS, {
          ...initialFilteredAttributions,
          attributions: {
            [packageInfo1.id]: packageInfo1,
            [packageInfo2.id]: packageInfo2,
          },
        }),
      ],
    });

    expect(
      screen.getByRole('button', { name: text.attributionColumn.link }),
    ).toBeDisabled();
  });

  it('hides link button when package is already linked', () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();
    const resourceId = faker.system.filePath();
    renderComponent(<AttributionDetails />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions: faker.opossum.attributions({
              [packageInfo1.id]: packageInfo1,
              [packageInfo2.id]: packageInfo2,
            }),
            resourcesToManualAttributions: {
              [resourceId]: [packageInfo1.id],
            },
          }),
        ),
        setSelectedResourceId(resourceId),
        setTemporaryDisplayPackageInfo(packageInfo1),
        setSelectedAttributionId(packageInfo1.id),
        setVariable<FilteredData>(FILTERED_SIGNALS, {
          ...initialFilteredAttributions,
          attributions: {
            [packageInfo1.id]: packageInfo1,
            [packageInfo2.id]: packageInfo2,
          },
        }),
      ],
    });

    expect(
      screen.queryByRole('button', { name: text.attributionColumn.link }),
    ).not.toBeInTheDocument();
  });

  it('deletes attribution', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();
    const resourceId = faker.system.filePath();
    renderComponent(<AttributionDetails />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions: faker.opossum.attributions({
              [packageInfo1.id]: packageInfo1,
              [packageInfo2.id]: packageInfo2,
            }),
            resourcesToManualAttributions: {
              [resourceId]: [packageInfo1.id],
            },
          }),
        ),
        setSelectedResourceId(resourceId),
        setTemporaryDisplayPackageInfo(packageInfo1),
        setSelectedAttributionId(packageInfo1.id),
        setVariable<FilteredData>(FILTERED_SIGNALS, {
          ...initialFilteredAttributions,
          attributions: {
            [packageInfo1.id]: packageInfo1,
            [packageInfo2.id]: packageInfo2,
          },
        }),
      ],
    });

    await userEvent.click(
      screen.getByRole('button', { name: text.attributionColumn.delete }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: text.deleteAttributionsPopup.delete }),
    );

    expect(window.electronAPI.saveFile).toHaveBeenCalledTimes(1);
    expect(window.electronAPI.saveFile).toHaveBeenCalledWith({
      manualAttributions: {
        [packageInfo2.id]: packageInfo2,
      },
      resolvedExternalAttributions: new Set(),
      resourcesToAttributions: {},
    });
  });

  it('reverts changes to a modified attribution', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();
    const resourceId = faker.system.filePath();
    const { store } = renderComponent(<AttributionDetails />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions: faker.opossum.attributions({
              [packageInfo1.id]: packageInfo1,
              [packageInfo2.id]: packageInfo2,
            }),
            resourcesToManualAttributions: {
              [resourceId]: [packageInfo1.id],
            },
          }),
        ),
        setSelectedResourceId(resourceId),
        setTemporaryDisplayPackageInfo({
          ...packageInfo1,
          packageName: faker.company.name(),
        }),
        setSelectedAttributionId(packageInfo1.id),
        setVariable<FilteredData>(FILTERED_SIGNALS, {
          ...initialFilteredAttributions,
          attributions: {
            [packageInfo1.id]: packageInfo1,
            [packageInfo2.id]: packageInfo2,
          },
        }),
      ],
    });

    await userEvent.click(
      screen.getByRole('button', { name: text.attributionColumn.revert }),
    );

    expect(getTemporaryDisplayPackageInfo(store.getState())).toEqual(
      packageInfo1,
    );
  });

  it('reverts changes to a newly created attribution', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();
    const resourceId = faker.system.filePath();
    const { store } = renderComponent(<AttributionDetails />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions: faker.opossum.attributions({
              [packageInfo1.id]: packageInfo1,
              [packageInfo2.id]: packageInfo2,
            }),
            resourcesToManualAttributions: {
              [resourceId]: [packageInfo1.id],
            },
          }),
        ),
        setSelectedResourceId(resourceId),
        setTemporaryDisplayPackageInfo({
          ...EMPTY_DISPLAY_PACKAGE_INFO,
          packageName: faker.company.name(),
        }),
        setSelectedAttributionId(''),
        setVariable<FilteredData>(FILTERED_SIGNALS, {
          ...initialFilteredAttributions,
          attributions: {
            [packageInfo1.id]: packageInfo1,
            [packageInfo2.id]: packageInfo2,
          },
        }),
      ],
    });

    await userEvent.click(
      screen.getByRole('button', { name: text.attributionColumn.revert }),
    );

    expect(getTemporaryDisplayPackageInfo(store.getState())).toEqual(
      EMPTY_DISPLAY_PACKAGE_INFO,
    );
  });

  it('deletes signal', async () => {
    const packageInfo = faker.opossum.packageInfo();
    renderComponent(<AttributionDetails />, {
      actions: [
        setTemporaryDisplayPackageInfo(packageInfo),
        setSelectedAttributionId(packageInfo.id),
        setVariable<FilteredData>(FILTERED_SIGNALS, {
          ...initialFilteredAttributions,
          attributions: { [packageInfo.id]: packageInfo },
        }),
      ],
    });

    await userEvent.click(
      screen.getByRole('button', { name: text.attributionColumn.delete }),
    );

    expect(window.electronAPI.saveFile).toHaveBeenCalledTimes(1);
    expect(window.electronAPI.saveFile).toHaveBeenCalledWith({
      manualAttributions: {},
      resolvedExternalAttributions: new Set([packageInfo.id]),
      resourcesToAttributions: {},
    });
  });

  it('restores deleted signal', async () => {
    const packageInfo = faker.opossum.packageInfo();
    renderComponent(<AttributionDetails />, {
      actions: [
        setResolvedExternalAttributions(new Set([packageInfo.id])),
        setTemporaryDisplayPackageInfo(packageInfo),
        setSelectedAttributionId(packageInfo.id),
        setVariable<FilteredData>(FILTERED_SIGNALS, {
          ...initialFilteredAttributions,
          attributions: { [packageInfo.id]: packageInfo },
        }),
      ],
    });

    await userEvent.click(
      screen.getByRole('button', { name: text.attributionColumn.restore }),
    );

    expect(window.electronAPI.saveFile).toHaveBeenCalledTimes(1);
    expect(window.electronAPI.saveFile).toHaveBeenCalledWith({
      manualAttributions: {},
      resolvedExternalAttributions: new Set(),
      resourcesToAttributions: {},
    });
  });

  it('compares attribution to original signal', async () => {
    const originId = faker.string.uuid();
    const signal = faker.opossum.packageInfo({ originIds: [originId] });
    const attribution = faker.opossum.packageInfo({ originIds: [originId] });
    const resourceId = faker.system.filePath();
    renderComponent(<AttributionDetails />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions: faker.opossum.attributions({
              [attribution.id]: attribution,
            }),
            externalAttributions: faker.opossum.attributions({
              [signal.id]: signal,
            }),
            resourcesToManualAttributions: {
              [resourceId]: [attribution.id],
            },
          }),
        ),
        setSelectedResourceId(resourceId),
        setTemporaryDisplayPackageInfo(attribution),
        setSelectedAttributionId(attribution.id),
        setVariable<FilteredData>(FILTERED_SIGNALS, {
          ...initialFilteredAttributions,
          attributions: {
            [attribution.id]: attribution,
          },
        }),
      ],
    });

    await userEvent.click(
      screen.getByRole('button', {
        name: text.attributionColumn.compareToOriginal,
      }),
    );

    expect(screen.getByText(text.diffPopup.title)).toBeInTheDocument();
  });
});
