// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { executeCommand } from '../../../../ElectronBackend/api/commands';
import { Criticality, type PackageInfo } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { pathsToResources } from '../../../../testing/global-test-helpers';
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../../shared-constants';
import { setTemporaryDisplayPackageInfo } from '../../../state/actions/resource-actions/all-views-simple-actions';
import {
  setAttributionSelectionPending,
  setSelectedAttributionId,
  setSelectedResourceId,
} from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { setUserSetting } from '../../../state/actions/user-settings-actions/user-settings-actions';
import { setVariable } from '../../../state/actions/variables-actions/variables-actions';
import {
  getIsPackageInfoDirty,
  getTemporaryDisplayPackageInfo,
} from '../../../state/selectors/resource-selectors';
import { ATTRIBUTION_SELECTION_FOR_REPLACEMENT } from '../../../state/variables/use-attribution-selection-for-replacement';
import {
  expectManualAttributions,
  expectResolvedExternalAttributions,
  expectResourcesToManualAttributions,
} from '../../../test-helpers/expectations';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { backend } from '../../../util/backendClient';
import { AttributionDetails } from '../AttributionDetails';

function makeComparisonPackage(
  overrides: Partial<PackageInfo> = {},
): PackageInfo {
  return {
    id: 'package',
    attributionConfidence: 50,
    criticality: Criticality.None,
    packageName: 'react',
    packageVersion: '18.2.0',
    packageType: 'npm',
    url: 'https://react.dev',
    ...overrides,
  };
}

function makeComparisonData(
  overrides: Parameters<typeof getParsedInputFileEnrichedWithTestData>[0],
) {
  return getParsedInputFileEnrichedWithTestData({
    resources: pathsToResources(['/comparison.ts']),
    ...overrides,
  });
}

describe('AttributionDetails', () => {
  it('renders nothing for a readonly structural ancestor without a selected attribution', async () => {
    const { container } = await renderComponent(<AttributionDetails />, {
      data: getParsedInputFileEnrichedWithTestData({
        resources: pathsToResources(['/editable/file.ts']),
        readonlyRules: [
          { path: '/', readonly: true },
          { path: '/editable', readonly: false },
        ],
      }),
      actions: [setSelectedResourceId('/')],
    });

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('shows readonly attribution details without edit controls', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const resourcePath = '/readonly/file.ts';
    const { store } = await renderComponent(<AttributionDetails />, {
      data: getParsedInputFileEnrichedWithTestData({
        resources: pathsToResources([resourcePath]),
        manualAttributions: { [packageInfo.id]: packageInfo },
        resourcesToManualAttributions: { [resourcePath]: [packageInfo.id] },
        readonlyRules: [{ path: '/readonly', readonly: true }],
      }),
      actions: [
        setSelectedResourceId(resourcePath),
        setSelectedAttributionId(packageInfo.id),
      ],
    });

    await waitFor(() =>
      expect(getTemporaryDisplayPackageInfo(store.getState()).id).toBe(
        packageInfo.id,
      ),
    );
    expect(
      getTemporaryDisplayPackageInfo(store.getState()).resourceAccess,
    ).toBe('readonly');
    expect(
      screen.queryByRole('button', { name: text.attributionColumn.save }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: text.attributionColumn.delete }),
    ).not.toBeInTheDocument();
  });

  it('renders nothing when the selected attribution ID is not visible', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const { container } = await renderComponent(<AttributionDetails />, {
      data: getParsedInputFileEnrichedWithTestData({}),
      actions: [
        setTemporaryDisplayPackageInfo(packageInfo),
        setSelectedAttributionId(packageInfo.id),
      ],
    });

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('shows a read-only form while the selected attribution is loading', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const { container } = await renderComponent(<AttributionDetails />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions: { [packageInfo.id]: packageInfo },
      }),
      actions: [setSelectedAttributionId(packageInfo.id)],
    });

    expect(
      screen.getByTestId('attribution-details-loading'),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(text.attributionColumn.packageName),
    ).toHaveAttribute('readonly');
    expect(container).not.toHaveTextContent(text.attributionColumn.save);
  });

  it('keeps selected attribution details available while the resource changes', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const nextPackageInfo = faker.opossum.packageInfo();
    const resourceId = faker.system.filePath();
    const nextResourceId = faker.system.filePath();
    const { store } = await renderComponent(<AttributionDetails />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions: {
          [packageInfo.id]: packageInfo,
          [nextPackageInfo.id]: nextPackageInfo,
        },
        resources: pathsToResources([resourceId, nextResourceId]),
        resourcesToManualAttributions: {
          [resourceId]: [packageInfo.id],
          [nextResourceId]: [nextPackageInfo.id],
        },
      }),
      actions: [
        setSelectedResourceId(resourceId),
        setSelectedAttributionId(packageInfo.id),
      ],
    });

    await screen.findByDisplayValue(packageInfo.packageName ?? '');

    act(() => {
      store.dispatch(setSelectedResourceId(nextResourceId));
    });

    expect(
      screen.queryByTestId('attribution-details-loading'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByLabelText(text.attributionColumn.packageName),
    ).toHaveValue(packageInfo.packageName ?? '');
  });

  it('disables editing while attribution selection is pending', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const { store } = await renderComponent(<AttributionDetails />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions: { [packageInfo.id]: packageInfo },
      }),
      actions: [
        setSelectedResourceId('/resource'),
        setSelectedAttributionId(packageInfo.id),
      ],
    });

    await screen.findByDisplayValue(packageInfo.packageName ?? '');
    act(() => {
      store.dispatch(setAttributionSelectionPending('/resource'));
    });

    expect(
      screen.getByTestId('attribution-details-loading'),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(text.attributionColumn.packageName),
    ).toHaveAttribute('readonly');
  });

  it('shows only the cancel button when the selected attribution is marked for replacement', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const { container } = await renderComponent(<AttributionDetails />, {
      data: getParsedInputFileEnrichedWithTestData({
        externalAttributions: { [packageInfo.id]: packageInfo },
      }),
      actions: [
        setTemporaryDisplayPackageInfo(packageInfo),
        setSelectedAttributionId(packageInfo.id),
        setVariable(ATTRIBUTION_SELECTION_FOR_REPLACEMENT, {
          mode: 'explicit',
          attributionUuids: [packageInfo.id],
        }),
      ],
    });

    await waitFor(() => expect(container).not.toBeEmptyDOMElement());

    expect(
      await screen.findByRole('button', { name: text.buttons.cancel }),
    ).toBeInTheDocument();
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
    expect(
      screen.queryByRole('button', {
        name: text.attributionColumn.compareWith,
      }),
    ).not.toBeInTheDocument();
  });

  it('hides use as replacement when the selected attribution is external', async () => {
    const externalAttribution = faker.opossum.packageInfo();
    const manualAttribution = faker.opossum.packageInfo();
    await renderComponent(<AttributionDetails />, {
      data: getParsedInputFileEnrichedWithTestData({
        externalAttributions: {
          [externalAttribution.id]: externalAttribution,
        },
        manualAttributions: {
          [manualAttribution.id]: manualAttribution,
        },
      }),
      actions: [
        setTemporaryDisplayPackageInfo(externalAttribution),
        setSelectedAttributionId(externalAttribution.id),
        setVariable(ATTRIBUTION_SELECTION_FOR_REPLACEMENT, {
          mode: 'explicit',
          attributionUuids: [manualAttribution.id],
        }),
      ],
    });

    expect(
      await screen.findByRole('button', { name: text.buttons.cancel }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: text.attributionColumn.replace }),
    ).not.toBeInTheDocument();
  });

  it('shows only picker mode actions when multiple attributions are marked for replacement', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();
    await renderComponent(<AttributionDetails />, {
      data: getParsedInputFileEnrichedWithTestData({
        externalAttributions: { [packageInfo1.id]: packageInfo1 },
      }),
      actions: [
        setTemporaryDisplayPackageInfo(packageInfo1),
        setSelectedAttributionId(packageInfo1.id),
        setVariable(ATTRIBUTION_SELECTION_FOR_REPLACEMENT, {
          mode: 'explicit',
          attributionUuids: [packageInfo1.id, packageInfo2.id],
        }),
      ],
    });

    expect(
      await screen.findByRole('button', { name: text.buttons.cancel }),
    ).toBeInTheDocument();
  });

  it('reduces the opacity of the attribution form while picker mode is active', async () => {
    const packageInfo = faker.opossum.packageInfo();
    await renderComponent(<AttributionDetails />, {
      data: getParsedInputFileEnrichedWithTestData({
        externalAttributions: { [packageInfo.id]: packageInfo },
      }),
      actions: [
        setTemporaryDisplayPackageInfo(packageInfo),
        setSelectedAttributionId(packageInfo.id),
        setVariable(ATTRIBUTION_SELECTION_FOR_REPLACEMENT, {
          mode: 'explicit',
          attributionUuids: [packageInfo.id],
        }),
      ],
    });

    expect(await screen.findByTestId('attribution-form-wrapper')).toHaveStyle({
      opacity: '0.5',
    });
  });

  it('keeps full opacity of the attribution form when picker mode is inactive', async () => {
    const packageInfo = faker.opossum.packageInfo();
    await renderComponent(<AttributionDetails />, {
      data: getParsedInputFileEnrichedWithTestData({
        externalAttributions: { [packageInfo.id]: packageInfo },
      }),
      actions: [
        setTemporaryDisplayPackageInfo(packageInfo),
        setSelectedAttributionId(packageInfo.id),
      ],
    });

    expect(await screen.findByTestId('attribution-form-wrapper')).toHaveStyle({
      opacity: '1',
    });
  });

  it('replaces attribution', async () => {
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
        resources: pathsToResources([resourceId]),
      }),
      actions: [
        setTemporaryDisplayPackageInfo(packageInfo1),
        setSelectedAttributionId(packageInfo1.id),
        setVariable(ATTRIBUTION_SELECTION_FOR_REPLACEMENT, {
          mode: 'explicit',
          attributionUuids: [packageInfo2.id],
        }),
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

  it('cancels replacement mode via cancel button', async () => {
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
        setVariable(ATTRIBUTION_SELECTION_FOR_REPLACEMENT, {
          mode: 'allMatching',
          query: {
            external: false,
            filters: [],
            search: '',
            valueFilters: {},
            resourcePathForRelationships: resourceId,
            showResolved: false,
            excludeUnrelated: false,
            relation: 'resource',
          },
          excludedAttributionUuids: [],
        }),
      ],
    });

    expect(
      await screen.findByRole('button', {
        name: text.attributionColumn.replace,
      }),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: text.buttons.cancel }),
    );

    expect(
      await screen.findByRole('button', { name: text.attributionColumn.save }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: text.attributionColumn.replace }),
    ).not.toBeInTheDocument();
    expect(
      store.getState().variablesState[ATTRIBUTION_SELECTION_FOR_REPLACEMENT],
    ).toBeNull();
  });

  it('saves modified attribution', async () => {
    const packageInfo1 = makeComparisonPackage({
      id: 'first',
      packageName: 'opening-name',
      attributionConfidence: 50,
    });
    const packageInfo2 = makeComparisonPackage({
      id: 'second',
      packageName: 'other-name',
      attributionConfidence: 80,
    });
    const newPackageName = 'edited-name';
    const resourceId = '/comparison.ts';
    const { store } = await renderComponent(<AttributionDetails />, {
      data: makeComparisonData({
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
      expect(getTemporaryDisplayPackageInfo(store.getState())).toMatchObject(
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
    await renderComponent(<AttributionDetails />, {
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
        resources: pathsToResources([resourceId]),
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
    const otherResourceId = faker.system.filePath();
    await renderComponent(<AttributionDetails />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToManualAttributions: {
          [resourceId]: [packageInfo1.id],
          [otherResourceId]: [packageInfo2.id],
        },
        resources: pathsToResources([resourceId, otherResourceId]),
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
      [otherResourceId]: [packageInfo2.id],
    });
    await expectResolvedExternalAttributions(new Set());
  });

  it('disables link button when package is modified', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();
    const resourceId = faker.system.filePath();
    const otherResourceId = faker.system.filePath();
    const { store } = await renderComponent(<AttributionDetails />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToManualAttributions: {
          [resourceId]: [packageInfo1.id],
          [otherResourceId]: [packageInfo2.id],
        },
        resources: pathsToResources([resourceId, otherResourceId]),
      }),
      actions: [
        setSelectedResourceId(resourceId),
        setSelectedAttributionId(packageInfo2.id),
      ],
    });

    await waitFor(() =>
      expect(getTemporaryDisplayPackageInfo(store.getState())).toMatchObject(
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

    await userEvent.click(
      await screen.findByRole('button', {
        name: text.attributionColumn.delete,
      }),
    );
    const deleteButton = screen.getByRole('button', {
      name: text.deleteAttributionsPopup.delete,
    });
    await waitFor(() => expect(deleteButton).toBeEnabled());
    await userEvent.click(deleteButton);

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
      expect(getTemporaryDisplayPackageInfo(store.getState())).toMatchObject(
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

    expect(getTemporaryDisplayPackageInfo(store.getState())).toMatchObject(
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

    expect(getTemporaryDisplayPackageInfo(store.getState())).toMatchObject(
      EMPTY_DISPLAY_PACKAGE_INFO,
    );
  });

  it('deletes signal', async () => {
    const packageInfo = faker.opossum.packageInfo();
    await renderComponent(<AttributionDetails />, {
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
    await renderComponent(<AttributionDetails />, {
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

    const diffPopup = within(screen.getByLabelText(text.diffPopup.ariaLabel));
    expect(diffPopup.getByText(text.diffPopup.title)).toBeInTheDocument();
    expect(
      diffPopup.getByText(text.attributionColumn.packageCoordinates),
    ).toBeInTheDocument();
    expect(
      diffPopup.getByText(text.attributionColumn.legalInformation),
    ).toBeInTheDocument();
  });

  it('keeps unsaved details when cancelling a comparison to the persisted value', async () => {
    const original = makeComparisonPackage({
      id: 'original',
      packageName: 'A',
    });
    const attribution = makeComparisonPackage({
      id: 'attribution',
      packageName: 'A',
      originalAttributionId: original.id,
    });
    const resourceId = faker.system.filePath();
    const { store } = await renderComponent(<AttributionDetails />, {
      data: makeComparisonData({
        manualAttributions: { [attribution.id]: attribution },
        externalAttributions: { [original.id]: original },
        resourcesToManualAttributions: {
          [resourceId]: [attribution.id],
        },
        resourcesToExternalAttributions: {
          [resourceId]: [original.id],
        },
        resources: pathsToResources([resourceId]),
      }),
      actions: [
        setSelectedResourceId(resourceId),
        setSelectedAttributionId(attribution.id),
      ],
    });

    const packageName = await screen.findByLabelText(
      text.attributionColumn.packageName,
    );
    await waitFor(() => expect(packageName).not.toHaveAttribute('readonly'));
    fireEvent.change(packageName, { target: { value: 'B' } });
    await userEvent.click(
      await screen.findByRole('button', {
        name: text.attributionColumn.compareToOriginal,
      }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: text.buttons.cancel }),
    );

    expect(getTemporaryDisplayPackageInfo(store.getState())).toMatchObject({
      ...attribution,
      packageName: 'B',
    });
  });

  it('enters compare-selection mode and shows only Cancel while previewing the compare source', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const resourceId = faker.system.filePath();
    await renderComponent(<AttributionDetails />, {
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
        setTemporaryDisplayPackageInfo(packageInfo),
        setSelectedAttributionId(packageInfo.id),
      ],
    });

    await userEvent.click(
      await screen.findByRole('button', {
        name: text.attributionColumn.compareWith,
      }),
    );

    expect(
      screen.queryByRole('button', {
        name: text.attributionColumn.compareConfirm,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: text.attributionColumn.save }),
    ).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: text.buttons.cancel }),
    );

    expect(
      await screen.findByRole('button', {
        name: text.attributionColumn.compareWith,
      }),
    ).toBeInTheDocument();
  });

  it('disables compare-selection mode while the attribution has unsaved changes', async () => {
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

    await userEvent.type(
      await screen.findByLabelText(text.attributionColumn.packageName),
      'unsaved changes',
    );

    expect(getIsPackageInfoDirty(store.getState())).toBe(true);
    expect(
      screen.getByRole('button', {
        name: text.attributionColumn.compareWith,
      }),
    ).toBeDisabled();
  });

  it('lets the user preview another item and opens a read-only comparison against the pinned source', async () => {
    const source = faker.opossum.packageInfo();
    const target = faker.opossum.packageInfo();
    const resourceId = faker.system.filePath();
    const { store } = await renderComponent(<AttributionDetails />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions: faker.opossum.attributions({
          [source.id]: source,
          [target.id]: target,
        }),
        resourcesToManualAttributions: {
          [resourceId]: [source.id, target.id],
        },
        resources: pathsToResources([resourceId]),
      }),
      actions: [
        setSelectedResourceId(resourceId),
        setTemporaryDisplayPackageInfo(source),
        setSelectedAttributionId(source.id),
      ],
    });

    await userEvent.click(
      await screen.findByRole('button', {
        name: text.attributionColumn.compareWith,
      }),
    );

    act(() => {
      store.dispatch(setSelectedAttributionId(target.id));
    });

    await waitFor(() =>
      expect(getTemporaryDisplayPackageInfo(store.getState())).toMatchObject(
        target,
      ),
    );

    await userEvent.click(
      await screen.findByRole('button', {
        name: text.attributionColumn.compareConfirm,
      }),
    );

    const diffPopup = within(screen.getByLabelText(text.diffPopup.ariaLabel));
    expect(diffPopup.getByText(text.diffPopup.title)).toBeInTheDocument();
    expect(
      diffPopup.getByDisplayValue(target.packageName!),
    ).toBeInTheDocument();
    expect(
      diffPopup.getByText(text.attributionColumn.packageCoordinates),
    ).toBeInTheDocument();
    expect(
      diffPopup.getByText(text.attributionColumn.legalInformation),
    ).toBeInTheDocument();
    expect(
      diffPopup.queryByText(text.attributionColumn.original),
    ).not.toBeInTheDocument();
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
      expect(getTemporaryDisplayPackageInfo(store.getState())).toMatchObject(
        packageInfo1,
      ),
    );

    act(() => {
      store.dispatch(setSelectedAttributionId(packageInfo2.id));
    });

    await waitFor(() =>
      expect(getTemporaryDisplayPackageInfo(store.getState())).toMatchObject(
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
      expect(getTemporaryDisplayPackageInfo(store.getState())).toMatchObject(
        packageInfo,
      ),
    );

    act(() => {
      store.dispatch(setSelectedAttributionId(''));
    });

    await waitFor(() =>
      expect(getTemporaryDisplayPackageInfo(store.getState())).toMatchObject(
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

    await backend.updateOrMatchAttributions.mutate({
      attributions: {
        [packageInfo.id]: { ...packageInfo, packageName: modifiedName },
      },
    });

    await waitFor(() =>
      expect(getTemporaryDisplayPackageInfo(store.getState())).toMatchObject({
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
    expect(screen.getByLabelText('attribution column')).toHaveAttribute(
      'data-dirty',
      'true',
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
    expect(screen.getByLabelText('attribution column')).toHaveAttribute(
      'data-dirty',
      'false',
    );
  });

  it('waits for a current relationship result before showing signal Link', async () => {
    const signal = faker.opossum.packageInfo({
      source: { name: 'Scanner', documentConfidence: 0 },
    });
    let resolveStatus: (() => void) | undefined;
    let markStatusSettled: (() => void) | undefined;
    const statusSettled = new Promise<void>((resolve) => {
      markStatusSettled = resolve;
    });
    vi.mocked(window.electronAPI.api).mockImplementation((command, params) =>
      command === 'getAttributionLinkStatus'
        ? new Promise<Awaited<ReturnType<typeof window.electronAPI.api>>>(
            (resolve) => {
              resolveStatus = () =>
                resolve({
                  result: { onResource: false, onDescendants: true },
                });
            },
          ).finally(() => markStatusSettled?.())
        : executeCommand(command, params as never),
    );

    await renderComponent(<AttributionDetails />, {
      data: getParsedInputFileEnrichedWithTestData({
        resources: pathsToResources(['/root/child/file.ts']),
        externalAttributions: { [signal.id]: signal },
        resourcesToExternalAttributions: {
          '/root/child/file.ts': [signal.id],
        },
      }),
      actions: [
        setSelectedResourceId('/root'),
        setSelectedAttributionId(signal.id),
      ],
    });

    await screen.findByDisplayValue(signal.packageName ?? '');
    await waitFor(() => expect(resolveStatus).toBeDefined());
    expect(
      screen.queryByRole('button', { name: text.attributionColumn.link }),
    ).not.toBeInTheDocument();

    await act(async () => {
      resolveStatus?.();
      await statusSettled;
    });

    expect(
      await screen.findByRole('button', { name: text.attributionColumn.link }),
    ).toBeEnabled();
  });

  it('hides signal Link when the relationship query fails', async () => {
    const signal = faker.opossum.packageInfo({
      source: { name: 'Scanner', documentConfidence: 0 },
    });
    let rejectStatus: (() => void) | undefined;
    let markStatusSettled: (() => void) | undefined;
    const statusSettled = new Promise<void>((resolve) => {
      markStatusSettled = resolve;
    });
    let statusRequestStarted = false;
    vi.mocked(window.electronAPI.api).mockImplementation((command, params) =>
      command === 'getAttributionLinkStatus'
        ? new Promise<Awaited<ReturnType<typeof window.electronAPI.api>>>(
            (_, reject) => {
              statusRequestStarted = true;
              rejectStatus = () =>
                reject(new Error('relationship unavailable'));
            },
          ).finally(() => markStatusSettled?.())
        : executeCommand(command, params as never),
    );

    await renderComponent(<AttributionDetails />, {
      data: getParsedInputFileEnrichedWithTestData({
        resources: pathsToResources(['/root/child/file.ts']),
        externalAttributions: { [signal.id]: signal },
        resourcesToExternalAttributions: {
          '/root/child/file.ts': [signal.id],
        },
      }),
      actions: [
        setSelectedResourceId('/root'),
        setSelectedAttributionId(signal.id),
      ],
    });

    await screen.findByDisplayValue(signal.packageName ?? '');
    await waitFor(() => expect(statusRequestStarted).toBe(true));
    await act(async () => {
      rejectStatus?.();
      await statusSettled;
    });
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: text.attributionColumn.link }),
      ).not.toBeInTheDocument(),
    );
  });

  it('ignores a delayed eligible result after navigating to an unrelated resource', async () => {
    const signal = faker.opossum.packageInfo({
      source: { name: 'Scanner', documentConfidence: 0 },
    });
    let resolveOldStatus: (() => void) | undefined;
    let markOldStatusSettled: (() => void) | undefined;
    const oldStatusSettled = new Promise<void>((resolve) => {
      markOldStatusSettled = resolve;
    });
    let oldStatusRequested = false;
    let currentStatusSettled = false;
    vi.mocked(window.electronAPI.api).mockImplementation((command, params) => {
      if (command === 'getAttributionLinkStatus') {
        const query = params as { resourcePath: string };
        if (query.resourcePath === '/root') {
          oldStatusRequested = true;
          return new Promise<
            Awaited<ReturnType<typeof window.electronAPI.api>>
          >((resolve) => {
            resolveOldStatus = () =>
              resolve({
                result: { onResource: false, onDescendants: true },
              });
          }).finally(() => markOldStatusSettled?.());
        }
        return executeCommand(command, params as never).then((response) => {
          currentStatusSettled = true;
          return response;
        });
      }
      return executeCommand(command, params as never);
    });

    const { store } = await renderComponent(<AttributionDetails />, {
      data: getParsedInputFileEnrichedWithTestData({
        resources: pathsToResources(['/root/child/file.ts', '/other/file.ts']),
        externalAttributions: { [signal.id]: signal },
        resourcesToExternalAttributions: {
          '/root/child/file.ts': [signal.id],
        },
      }),
      actions: [
        setSelectedResourceId('/root'),
        setSelectedAttributionId(signal.id),
      ],
    });

    await screen.findByDisplayValue(signal.packageName ?? '');
    await waitFor(() => expect(oldStatusRequested).toBe(true));
    await act(() => store.dispatch(setSelectedResourceId('/other')));
    await waitFor(() => expect(currentStatusSettled).toBe(true));
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: text.attributionColumn.link }),
      ).not.toBeInTheDocument(),
    );

    await act(async () => {
      resolveOldStatus?.();
      await oldStatusSettled;
    });
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: text.attributionColumn.link }),
      ).not.toBeInTheDocument(),
    );
  });

  it('keeps eligible Link visible but disabled for edits and shows its spinner while linking', async () => {
    const user = userEvent.setup();
    const signal = faker.opossum.packageInfo({
      source: { name: 'Scanner', documentConfidence: 0 },
    });
    let resolveLink: (() => void) | undefined;
    vi.mocked(window.electronAPI.api).mockImplementation((command, params) =>
      command === 'createOrMatchAttributions'
        ? new Promise((resolve) => {
            resolveLink = () =>
              resolve({
                result: { focusedAttributionOutcome: { status: 'unchanged' } },
                invalidates: [],
              });
          })
        : executeCommand(command, params as never),
    );

    const { store } = await renderComponent(<AttributionDetails />, {
      data: getParsedInputFileEnrichedWithTestData({
        resources: pathsToResources(['/root/child/file.ts']),
        externalAttributions: { [signal.id]: signal },
        resourcesToExternalAttributions: {
          '/root/child/file.ts': [signal.id],
        },
      }),
      actions: [
        setSelectedResourceId('/root'),
        setSelectedAttributionId(signal.id),
      ],
    });

    const linkButton = await screen.findByRole('button', {
      name: text.attributionColumn.link,
    });
    await waitFor(() => expect(linkButton).toBeEnabled());
    await act(() =>
      store.dispatch(
        setTemporaryDisplayPackageInfo({ ...signal, comment: 'draft edit' }),
      ),
    );
    expect(linkButton).toBeDisabled();
    await act(() => store.dispatch(setTemporaryDisplayPackageInfo(signal)));
    await waitFor(() => expect(linkButton).toBeEnabled());

    await user.click(linkButton);
    expect(linkButton).toBeDisabled();
    expect(within(linkButton).getByRole('progressbar')).toBeInTheDocument();
    act(() => resolveLink?.());
  });
});
