// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { pathsToResources } from '../../../../testing/global-test-helpers';
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../../shared-constants';
import { setTemporaryDisplayPackageInfo } from '../../../state/actions/resource-actions/all-views-simple-actions';
import {
  setSelectedAttributionId,
  setSelectedResourceId,
} from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { savePackageInfo } from '../../../state/actions/resource-actions/save-actions';
import { setUserSetting } from '../../../state/actions/user-settings-actions/user-settings-actions';
import { setVariable } from '../../../state/actions/variables-actions/variables-actions';
import {
  getIsPackageInfoDirty,
  getTemporaryDisplayPackageInfo,
} from '../../../state/selectors/resource-selectors';
import { ATTRIBUTION_IDS_FOR_REPLACEMENT } from '../../../state/variables/use-attribution-ids-for-replacement';
import {
  expectManualAttributions,
  expectResolvedExternalAttributions,
  expectResourcesToManualAttributions,
} from '../../../test-helpers/expectations';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { AttributionDetails } from '../AttributionDetails';

describe('AttributionDetails', () => {
  it('renders nothing when the selected attribution ID is not visible', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const { container } = await renderComponent(<AttributionDetails />, {
      actions: [
        setTemporaryDisplayPackageInfo(packageInfo),
        setSelectedAttributionId(packageInfo.id),
      ],
    });

    expect(container).toBeEmptyDOMElement();
  });

  it('renders no buttons when the selected attribution is marked for replacement', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const { container } = await renderComponent(<AttributionDetails />, {
      data: getParsedInputFileEnrichedWithTestData({
        externalAttributions: { [packageInfo.id]: packageInfo },
      }),
      actions: [
        setTemporaryDisplayPackageInfo(packageInfo),
        setSelectedAttributionId(packageInfo.id),
        setVariable<Array<string>>(ATTRIBUTION_IDS_FOR_REPLACEMENT, [
          packageInfo.id,
        ]),
      ],
    });

    await waitFor(() => expect(container).not.toBeEmptyDOMElement());

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
    const { store } = await renderComponent(<AttributionDetails />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToManualAttributions: {
          [resourceId]: [packageInfo1.id, packageInfo2.id],
        },
        resources: pathsToResources([resourceId]),
      }),
      actions: [
        setTemporaryDisplayPackageInfo(packageInfo1),
        setSelectedAttributionId(packageInfo1.id),
        setVariable<Array<string>>(ATTRIBUTION_IDS_FOR_REPLACEMENT, [
          packageInfo2.id,
        ]),
      ],
    });

    await userEvent.click(
      await screen.findByRole('button', {
        name: text.attributionColumn.replace,
      }),
    );
    await userEvent.click(
      screen.getByRole('button', {
        name: text.replaceAttributionsPopup.replace,
      }),
    );

    await expectManualAttributions({
      [packageInfo1.id]: packageInfo1,
    });
    await expectResourcesToManualAttributions({
      [resourceId]: [packageInfo1.id],
    });
    await expectResolvedExternalAttributions(new Set());
  });

  it('saves modified attribution', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();
    const newPackageName = faker.company.name();
    const resourceId = faker.system.filePath();
    const { store } = await renderComponent(<AttributionDetails />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToManualAttributions: {
          [resourceId]: [packageInfo1.id, packageInfo2.id],
        },
        resources: pathsToResources([resourceId]),
      }),
      actions: [setSelectedAttributionId(packageInfo1.id)],
    });

    await waitFor(() =>
      expect(getTemporaryDisplayPackageInfo(store.getState())).toEqual(
        packageInfo1,
      ),
    );

    act(() => {
      store.dispatch(
        setTemporaryDisplayPackageInfo({
          ...packageInfo1,
          packageName: newPackageName,
        }),
      );
    });

    await userEvent.click(
      await screen.findByRole('button', {
        name: text.attributionColumn.save,
      }),
    );

    await expectManualAttributions({
      [packageInfo1.id]: {
        ...packageInfo1,
        packageName: newPackageName,
      },
      [packageInfo2.id]: packageInfo2,
    });
    await expectResourcesToManualAttributions({
      [resourceId]: [packageInfo1.id, packageInfo2.id],
    });
    await expectResolvedExternalAttributions(new Set());
  });

  it('confirms attribution', async () => {
    const packageInfo1 = faker.opossum.packageInfo({ preSelected: true });
    const packageInfo2 = faker.opossum.packageInfo();
    const resourceId = faker.system.filePath();
    const { store } = await renderComponent(<AttributionDetails />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToManualAttributions: {
          [resourceId]: [packageInfo1.id, packageInfo2.id],
        },
        resources: pathsToResources([resourceId]),
      }),
      actions: [
        setTemporaryDisplayPackageInfo(packageInfo1),
        setSelectedAttributionId(packageInfo1.id),
      ],
    });

    await userEvent.click(
      await screen.findByRole('button', {
        name: text.attributionColumn.confirm,
      }),
    );

    await expectManualAttributions({
      [packageInfo1.id]: { ...packageInfo1, preSelected: undefined },
      [packageInfo2.id]: packageInfo2,
    });
    await expectResourcesToManualAttributions({
      [resourceId]: [packageInfo1.id, packageInfo2.id],
    });
    await expectResolvedExternalAttributions(new Set());
  });

  it('disables save button if package is neither pre-selected nor modified', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();
    const resourceId = faker.system.filePath();
    await renderComponent(<AttributionDetails />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToManualAttributions: {
          [resourceId]: [packageInfo1.id, packageInfo2.id],
        },
      }),
      actions: [
        setTemporaryDisplayPackageInfo(packageInfo1),
        setSelectedAttributionId(packageInfo1.id),
      ],
    });

    expect(
      await screen.findByRole('button', {
        name: text.attributionColumn.save,
      }),
    ).toBeDisabled();
  });

  it('links attribution', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();
    const resourceId = faker.system.filePath();
    const { store } = await renderComponent(<AttributionDetails />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToManualAttributions: {
          [resourceId]: [packageInfo1.id],
        },
        resources: pathsToResources([resourceId]),
      }),
      actions: [
        setSelectedResourceId(resourceId),
        setTemporaryDisplayPackageInfo(packageInfo2),
        setSelectedAttributionId(packageInfo2.id),
      ],
    });

    await userEvent.click(
      await screen.findByRole('button', {
        name: text.attributionColumn.link,
      }),
    );

    await expectManualAttributions({
      [packageInfo1.id]: packageInfo1,
      [packageInfo2.id]: packageInfo2,
    });
    await expectResourcesToManualAttributions({
      [resourceId]: [packageInfo1.id, packageInfo2.id],
    });
    await expectResolvedExternalAttributions(new Set());
  });

  it('disables link button when package is modified', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();
    const resourceId = faker.system.filePath();
    const { store } = await renderComponent(<AttributionDetails />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToManualAttributions: {
          [resourceId]: [packageInfo1.id],
        },
        resources: pathsToResources([resourceId]),
      }),
      actions: [
        setSelectedResourceId(resourceId),
        setSelectedAttributionId(packageInfo2.id),
      ],
    });

    await waitFor(() =>
      expect(getTemporaryDisplayPackageInfo(store.getState())).toEqual(
        packageInfo2,
      ),
    );

    act(() => {
      store.dispatch(
        setTemporaryDisplayPackageInfo({
          ...packageInfo2,
          packageName: faker.company.name(),
        }),
      );
    });

    expect(
      await screen.findByRole('button', {
        name: text.attributionColumn.link,
      }),
    ).toBeDisabled();
  });

  it('hides link button when package is already linked', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();
    const resourceId = faker.system.filePath();
    await renderComponent(<AttributionDetails />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToManualAttributions: {
          [resourceId]: [packageInfo1.id],
        },
        resources: pathsToResources([resourceId]),
      }),
      actions: [
        setSelectedResourceId(resourceId),
        setTemporaryDisplayPackageInfo(packageInfo1),
        setSelectedAttributionId(packageInfo1.id),
      ],
    });

    await screen.findByRole('button', { name: text.attributionColumn.save });

    expect(
      screen.queryByRole('button', { name: text.attributionColumn.link }),
    ).not.toBeInTheDocument();
  });

  it('deletes attribution', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();
    const resourceId = faker.system.filePath();
    const { store } = await renderComponent(<AttributionDetails />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToManualAttributions: {
          [resourceId]: [packageInfo1.id],
        },
        resources: pathsToResources([resourceId]),
      }),
      actions: [
        setSelectedResourceId(resourceId),
        setTemporaryDisplayPackageInfo(packageInfo1),
        setSelectedAttributionId(packageInfo1.id),
      ],
    });

    await userEvent.click(
      await screen.findByRole('button', {
        name: text.attributionColumn.delete,
      }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: text.deleteAttributionsPopup.delete }),
    );

    await expectManualAttributions({
      [packageInfo2.id]: packageInfo2,
    });
    await expectResourcesToManualAttributions({});
    await expectResolvedExternalAttributions(new Set());
  });

  it('reverts changes to a modified attribution', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();
    const resourceId = faker.system.filePath();
    const { store } = await renderComponent(<AttributionDetails />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToManualAttributions: {
          [resourceId]: [packageInfo1.id],
        },
        resources: pathsToResources([resourceId]),
      }),
      actions: [
        setSelectedResourceId(resourceId),
        setSelectedAttributionId(packageInfo1.id),
      ],
    });

    await waitFor(() =>
      expect(getTemporaryDisplayPackageInfo(store.getState())).toEqual(
        packageInfo1,
      ),
    );

    act(() => {
      store.dispatch(
        setTemporaryDisplayPackageInfo({
          ...packageInfo1,
          packageName: faker.company.name(),
        }),
      );
    });

    await userEvent.click(
      await screen.findByRole('button', {
        name: text.attributionColumn.revert,
      }),
    );

    expect(getTemporaryDisplayPackageInfo(store.getState())).toEqual(
      packageInfo1,
    );
  });

  it('reverts changes to a newly created attribution', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();
    const resourceId = faker.system.filePath();
    const { store } = await renderComponent(<AttributionDetails />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToManualAttributions: {
          [resourceId]: [packageInfo1.id],
        },
        resources: pathsToResources([resourceId]),
      }),
      actions: [
        setSelectedResourceId(resourceId),
        setSelectedAttributionId(''),
      ],
    });

    act(() => {
      store.dispatch(
        setTemporaryDisplayPackageInfo({
          ...EMPTY_DISPLAY_PACKAGE_INFO,
          packageName: faker.company.name(),
        }),
      );
    });

    await userEvent.click(
      await screen.findByRole('button', {
        name: text.attributionColumn.revert,
      }),
    );

    expect(getTemporaryDisplayPackageInfo(store.getState())).toEqual(
      EMPTY_DISPLAY_PACKAGE_INFO,
    );
  });

  it('deletes signal', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const { store } = await renderComponent(<AttributionDetails />, {
      data: getParsedInputFileEnrichedWithTestData({
        externalAttributions: { [packageInfo.id]: packageInfo },
      }),
      actions: [
        setTemporaryDisplayPackageInfo(packageInfo),
        setSelectedAttributionId(packageInfo.id),
      ],
    });

    await userEvent.click(
      await screen.findByRole('button', {
        name: text.attributionColumn.delete,
      }),
    );

    await expectManualAttributions({});
    await expectResourcesToManualAttributions({});
    await expectResolvedExternalAttributions(new Set([packageInfo.id]));
  });

  it('restores deleted signal', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const { store } = await renderComponent(<AttributionDetails />, {
      data: getParsedInputFileEnrichedWithTestData({
        externalAttributions: { [packageInfo.id]: packageInfo },
        resolvedExternalAttributions: new Set([packageInfo.id]),
      }),
      actions: [
        setUserSetting({ areHiddenSignalsVisible: true }),
        setTemporaryDisplayPackageInfo(packageInfo),
        setSelectedAttributionId(packageInfo.id),
      ],
    });

    await userEvent.click(
      await screen.findByRole('button', {
        name: text.attributionColumn.restore,
      }),
    );

    await expectManualAttributions({});
    await expectResourcesToManualAttributions({});
    await expectResolvedExternalAttributions(new Set());
  });

  it('compares attribution to original signal', async () => {
    const signal = faker.opossum.packageInfo();
    const attribution = faker.opossum.packageInfo({
      originalAttributionId: signal.id,
    });
    const resourceId = faker.system.filePath();
    await renderComponent(<AttributionDetails />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions: faker.opossum.attributions({
          [attribution.id]: attribution,
        }),
        externalAttributions: faker.opossum.attributions({
          [signal.id]: signal,
        }),
        resourcesToManualAttributions: {
          [resourceId]: [attribution.id],
        },
        resources: pathsToResources([resourceId]),
      }),
      actions: [
        setSelectedResourceId(resourceId),
        setTemporaryDisplayPackageInfo(attribution),
        setSelectedAttributionId(attribution.id),
      ],
    });

    await userEvent.click(
      await screen.findByRole('button', {
        name: text.attributionColumn.compareToOriginal,
      }),
    );

    expect(screen.getByText(text.diffPopup.title)).toBeInTheDocument();
  });

  it('resets temporaryDisplayPackageInfo when selected attribution changes', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();
    const resourceId = faker.system.filePath();
    const { store } = await renderComponent(<AttributionDetails />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToManualAttributions: {
          [resourceId]: [packageInfo1.id, packageInfo2.id],
        },
        resources: pathsToResources([resourceId]),
      }),
      actions: [
        setSelectedResourceId(resourceId),
        setSelectedAttributionId(packageInfo1.id),
      ],
    });

    await waitFor(() =>
      expect(getTemporaryDisplayPackageInfo(store.getState())).toEqual(
        packageInfo1,
      ),
    );

    act(() => {
      store.dispatch(setSelectedAttributionId(packageInfo2.id));
    });

    await waitFor(() =>
      expect(getTemporaryDisplayPackageInfo(store.getState())).toEqual(
        packageInfo2,
      ),
    );
  });

  it('resets temporaryDisplayPackageInfo to empty when selection is cleared', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const resourceId = faker.system.filePath();
    const { store } = await renderComponent(<AttributionDetails />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions: faker.opossum.attributions({
          [packageInfo.id]: packageInfo,
        }),
        resourcesToManualAttributions: {
          [resourceId]: [packageInfo.id],
        },
        resources: pathsToResources([resourceId]),
      }),
      actions: [
        setSelectedResourceId(resourceId),
        setSelectedAttributionId(packageInfo.id),
      ],
    });

    await waitFor(() =>
      expect(getTemporaryDisplayPackageInfo(store.getState())).toEqual(
        packageInfo,
      ),
    );

    act(() => {
      store.dispatch(setSelectedAttributionId(''));
    });

    await waitFor(() =>
      expect(getTemporaryDisplayPackageInfo(store.getState())).toEqual(
        EMPTY_DISPLAY_PACKAGE_INFO,
      ),
    );
  });

  it('resets temporaryDisplayPackageInfo after saving an attribution', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const modifiedName = faker.company.name();
    const resourceId = faker.system.filePath();
    const { store } = await renderComponent(<AttributionDetails />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions: faker.opossum.attributions({
          [packageInfo.id]: packageInfo,
        }),
        resourcesToManualAttributions: {
          [resourceId]: [packageInfo.id],
        },
        resources: pathsToResources([resourceId]),
      }),
      actions: [
        setSelectedResourceId(resourceId),
        setSelectedAttributionId(packageInfo.id),
        setTemporaryDisplayPackageInfo({
          ...packageInfo,
          packageName: modifiedName,
        }),
      ],
    });

    await act(async () => {
      await store.dispatch(
        savePackageInfo(resourceId, packageInfo.id, {
          ...packageInfo,
          packageName: modifiedName,
        }),
      );
    });

    await waitFor(() =>
      expect(getTemporaryDisplayPackageInfo(store.getState())).toEqual({
        ...packageInfo,
        packageName: modifiedName,
      }),
    );
  });

  it('sets isPackageInfoDirty to true when temp differs from stored', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const resourceId = faker.system.filePath();
    const { store } = await renderComponent(<AttributionDetails />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions: faker.opossum.attributions({
          [packageInfo.id]: packageInfo,
        }),
        resourcesToManualAttributions: {
          [resourceId]: [packageInfo.id],
        },
        resources: pathsToResources([resourceId]),
      }),
      actions: [
        setSelectedResourceId(resourceId),
        setSelectedAttributionId(packageInfo.id),
      ],
    });

    act(() => {
      store.dispatch(
        setTemporaryDisplayPackageInfo({
          ...packageInfo,
          packageName: faker.company.name(),
        }),
      );
    });

    await waitFor(() =>
      expect(getIsPackageInfoDirty(store.getState())).toBe(true),
    );
  });

  it('sets isPackageInfoDirty to false when temp matches stored', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const resourceId = faker.system.filePath();
    const { store } = await renderComponent(<AttributionDetails />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions: faker.opossum.attributions({
          [packageInfo.id]: packageInfo,
        }),
        resourcesToManualAttributions: {
          [resourceId]: [packageInfo.id],
        },
        resources: pathsToResources([resourceId]),
      }),
      actions: [
        setSelectedResourceId(resourceId),
        setSelectedAttributionId(packageInfo.id),
      ],
    });

    await waitFor(() =>
      expect(getIsPackageInfoDirty(store.getState())).toBe(false),
    );
  });
});
