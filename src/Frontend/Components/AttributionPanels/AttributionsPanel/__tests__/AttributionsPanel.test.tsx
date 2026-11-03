// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { text } from '../../../../../shared/text';
import { faker } from '../../../../../testing/Faker';
import { pathsToResources } from '../../../../../testing/global-test-helpers';
import {
  ATTRIBUTIONS_PANEL,
  clickPackageCard,
  clickPackageCardCheckbox,
  expectButtonDisabled,
  expectButtonEnabled,
  expectButtonsDisabled,
  expectButtonsEnabled,
  expectEventuallyButtonEnabled,
  getButton,
  getPackageCardCheckbox,
} from '../../../../../testing/ui';
import { ROOT_PATH } from '../../../../shared-constants';
import { setTemporaryDisplayPackageInfo } from '../../../../state/actions/resource-actions/all-views-simple-actions';
import { setSelectedResourceId } from '../../../../state/actions/resource-actions/audit-view-simple-actions';
import { setVariable } from '../../../../state/actions/variables-actions/variables-actions';
import { getSelectedAttributionId } from '../../../../state/selectors/resource-selectors';
import { COMPARE_SELECTION_SOURCE } from '../../../../state/variables/use-compare-selection';
import {
  expectManualAttributions,
  expectResourcesToManualAttributions,
} from '../../../../test-helpers/expectations';
import { getParsedInputFileEnrichedWithTestData } from '../../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../../test-helpers/render';
import { AttributionsPanel } from '../AttributionsPanel';

describe('AttributionsPanel', () => {
  it('selects attribution on card click', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const manualAttributions = faker.opossum.attributions({
      [packageInfo.id]: packageInfo,
    });
    const { store } = await renderComponent(<AttributionsPanel />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions,
        metadata: faker.opossum.metadata(),
      }),
    });

    await clickPackageCard(ATTRIBUTIONS_PANEL, packageInfo);

    expect(getSelectedAttributionId(store.getState())).toBe(packageInfo.id);
    expectButtonsEnabled(text.packageLists.create);
  });

  it('selects attribution on checkbox click', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const manualAttributions = faker.opossum.attributions({
      [packageInfo.id]: packageInfo,
    });
    const { store } = await renderComponent(<AttributionsPanel />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions,
        metadata: faker.opossum.metadata(),
      }),
    });

    await clickPackageCardCheckbox(ATTRIBUTIONS_PANEL, packageInfo);

    expect(getSelectedAttributionId(store.getState())).toBe(packageInfo.id);
  });

  it('allows selecting a mixed attribution while browsing a readonly resource', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const readonlyResource = '/readonly/file.ts';
    const writableResource = '/writable/file.ts';
    await renderComponent(<AttributionsPanel />, {
      data: getParsedInputFileEnrichedWithTestData({
        resources: pathsToResources([readonlyResource, writableResource]),
        manualAttributions: { [packageInfo.id]: packageInfo },
        resourcesToManualAttributions: {
          [readonlyResource]: [packageInfo.id],
          [writableResource]: [packageInfo.id],
        },
        readonlyRules: [{ path: '/readonly', readonly: true }],
      }),
      actions: [setSelectedResourceId(readonlyResource, 'auto')],
    });

    const checkbox = await getPackageCardCheckbox(
      ATTRIBUTIONS_PANEL,
      packageInfo,
    );

    expect(checkbox).toBeEnabled();
    await userEvent.click(checkbox);

    expectButtonEnabled(text.packageLists.delete);
  });

  it('disables create and link buttons on a readonly structural ancestor', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const filePath = '/editable/file.ts';
    await renderComponent(<AttributionsPanel />, {
      data: getParsedInputFileEnrichedWithTestData({
        resources: pathsToResources([filePath]),
        manualAttributions: { [packageInfo.id]: packageInfo },
        resourcesToManualAttributions: { [filePath]: [packageInfo.id] },
        readonlyRules: [
          { path: '/', readonly: true },
          { path: '/editable', readonly: false },
        ],
      }),
    });

    await clickPackageCard(ATTRIBUTIONS_PANEL, packageInfo);

    expectButtonsDisabled(
      text.packageLists.create,
      text.packageLists.linkAsAttribution,
    );
    expectButtonEnabled(text.packageLists.delete);
  });

  it('shows alert when some attribution on current resource is incomplete', async () => {
    const resourceId = faker.system.filePath();
    const packageInfo1 = faker.opossum.packageInfo({ packageName: undefined });
    const packageInfo2 = faker.opossum.packageInfo();
    const manualAttributions = faker.opossum.attributions({
      [packageInfo1.id]: packageInfo1,
      [packageInfo2.id]: packageInfo2,
    });
    await renderComponent(<AttributionsPanel />, {
      data: getParsedInputFileEnrichedWithTestData({
        resources: pathsToResources([resourceId]),
        manualAttributions,
        resourcesToManualAttributions: {
          [resourceId]: [packageInfo1.id, packageInfo2.id],
        },
      }),
      actions: [setSelectedResourceId(resourceId, 'auto')],
    });

    expect(
      await screen.findByText(text.packageLists.incompleteAttributions),
    ).toBeInTheDocument();
  });

  it('creates new attribution', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const manualAttributions = faker.opossum.attributions({
      [packageInfo.id]: packageInfo,
    });
    const { store } = await renderComponent(<AttributionsPanel />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions,
        metadata: faker.opossum.metadata(),
      }),
    });

    await clickPackageCard(ATTRIBUTIONS_PANEL, packageInfo);
    await userEvent.click(getButton(text.packageLists.create));

    expect(getSelectedAttributionId(store.getState())).toBe('');
    expectButtonDisabled(text.packageLists.create);
  });

  it('deletes selected attribution', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const manualAttributions = faker.opossum.attributions({
      [packageInfo.id]: packageInfo,
    });
    await renderComponent(<AttributionsPanel />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions,
        metadata: faker.opossum.metadata(),
      }),
    });

    await clickPackageCard(ATTRIBUTIONS_PANEL, packageInfo);
    await userEvent.click(getButton(text.packageLists.delete));
    await expectEventuallyButtonEnabled(text.deleteAttributionsPopup.delete);
    await userEvent.click(getButton(text.deleteAttributionsPopup.delete));

    await expectManualAttributions({});
  });

  it('links selected attribution', async () => {
    const filePath = faker.system.filePath();
    const packageInfo = faker.opossum.packageInfo();
    const manualAttributions = faker.opossum.attributions({
      [packageInfo.id]: packageInfo,
    });
    await renderComponent(<AttributionsPanel />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions,
        resources: pathsToResources([filePath]),
        resourcesToManualAttributions: {
          [filePath]: [packageInfo.id],
        },
        metadata: faker.opossum.metadata(),
      }),
    });

    await clickPackageCard(ATTRIBUTIONS_PANEL, packageInfo);
    await userEvent.click(getButton(text.packageLists.linkAsAttribution));

    await expectResourcesToManualAttributions({
      [ROOT_PATH]: [packageInfo.id],
    });
  });

  it('disables link button when package info modified', async () => {
    const filePath = faker.system.filePath();
    const packageInfo = faker.opossum.packageInfo();
    const manualAttributions = faker.opossum.attributions({
      [packageInfo.id]: packageInfo,
    });
    const { store } = await renderComponent(<AttributionsPanel />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions,
        resources: pathsToResources([filePath]),
        resourcesToManualAttributions: {
          [filePath]: [packageInfo.id],
        },
        metadata: faker.opossum.metadata(),
      }),
    });

    await clickPackageCard(ATTRIBUTIONS_PANEL, packageInfo);
    act(() => {
      store.dispatch(
        setTemporaryDisplayPackageInfo(faker.opossum.packageInfo()),
      );
    });

    expectButtonDisabled(text.packageLists.linkAsAttribution);
  });

  it('disables link button when only resource related attributions available', async () => {
    const filePath = faker.system.filePath();
    const packageInfo = faker.opossum.packageInfo();
    const manualAttributions = faker.opossum.attributions({
      [packageInfo.id]: packageInfo,
    });
    await renderComponent(<AttributionsPanel />, {
      data: getParsedInputFileEnrichedWithTestData({
        resources: pathsToResources([filePath]),
        manualAttributions,
        resourcesToManualAttributions: {
          [filePath]: [packageInfo.id],
        },
        metadata: faker.opossum.metadata(),
      }),
      actions: [setSelectedResourceId(filePath, 'auto')],
    });

    await clickPackageCard(ATTRIBUTIONS_PANEL, packageInfo);

    expectButtonDisabled(text.packageLists.linkAsAttribution);
  });

  it('disables link button when selected resource is a breakpoint', async () => {
    const filePath = faker.system.filePath();
    const packageInfo = faker.opossum.packageInfo();
    const manualAttributions = faker.opossum.attributions({
      [packageInfo.id]: packageInfo,
    });
    await renderComponent(<AttributionsPanel />, {
      data: getParsedInputFileEnrichedWithTestData({
        resources: pathsToResources([filePath]),
        manualAttributions,
        resourcesToManualAttributions: {
          [filePath]: [packageInfo.id],
        },
        attributionBreakpoints: new Set([filePath]),
        metadata: faker.opossum.metadata(),
      }),
      actions: [setSelectedResourceId(filePath, 'auto')],
    });

    await clickPackageCard(ATTRIBUTIONS_PANEL, packageInfo);

    expectButtonDisabled(text.packageLists.linkAsAttribution);
  });

  it('confirms selected attribution', async () => {
    const packageInfo = faker.opossum.packageInfo({
      preSelected: true,
    });
    const manualAttributions = faker.opossum.attributions({
      [packageInfo.id]: packageInfo,
    });
    const { store } = await renderComponent(<AttributionsPanel />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions,
        metadata: faker.opossum.metadata(),
      }),
    });

    await clickPackageCard(ATTRIBUTIONS_PANEL, packageInfo);
    const selectionCheckbox = await getPackageCardCheckbox(
      ATTRIBUTIONS_PANEL,
      packageInfo,
    );
    await userEvent.click(selectionCheckbox);
    act(() => {
      store.dispatch(setTemporaryDisplayPackageInfo(packageInfo));
    });
    await userEvent.click(getButton(text.packageLists.confirm));
    await expectEventuallyButtonEnabled(text.saveAttributionsPopup.confirm);
    await userEvent.click(getButton(text.saveAttributionsPopup.confirm));

    await expectManualAttributions({
      [packageInfo.id]: { ...packageInfo, preSelected: undefined },
    });
    expect(getSelectedAttributionId(store.getState())).toBe(packageInfo.id);
    expect(selectionCheckbox).not.toBeChecked();
  });

  it('disables confirm button when selected attribution is not pre-selected', async () => {
    const packageInfo = faker.opossum.packageInfo({
      preSelected: false,
    });
    const manualAttributions = faker.opossum.attributions({
      [packageInfo.id]: packageInfo,
    });
    await renderComponent(<AttributionsPanel />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions,
        metadata: faker.opossum.metadata(),
      }),
    });

    await clickPackageCard(ATTRIBUTIONS_PANEL, packageInfo);

    expectButtonDisabled(text.packageLists.confirm);
  });

  it('replaces selected attribution', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();
    const manualAttributions = faker.opossum.attributions({
      [packageInfo1.id]: packageInfo1,
      [packageInfo2.id]: packageInfo2,
    });
    await renderComponent(<AttributionsPanel />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions,
        metadata: faker.opossum.metadata(),
      }),
    });

    await clickPackageCard(ATTRIBUTIONS_PANEL, packageInfo1);
    await userEvent.click(getButton(text.packageLists.replace));

    expect(
      screen.getByText(text.packageLists.selectReplacement),
    ).toBeInTheDocument();
  });

  it('disables replace button when no replacements exist', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const manualAttributions = faker.opossum.attributions({
      [packageInfo.id]: packageInfo,
    });
    await renderComponent(<AttributionsPanel />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions,
        metadata: faker.opossum.metadata(),
      }),
    });

    await clickPackageCard(ATTRIBUTIONS_PANEL, packageInfo);

    expectButtonDisabled(text.packageLists.replace);
  });

  it('disables replace button while compare-selection mode is active', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();
    const manualAttributions = faker.opossum.attributions({
      [packageInfo1.id]: packageInfo1,
      [packageInfo2.id]: packageInfo2,
    });
    await renderComponent(<AttributionsPanel />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions,
        metadata: faker.opossum.metadata(),
      }),
      actions: [setVariable(COMPARE_SELECTION_SOURCE, packageInfo1.id)],
    });

    await clickPackageCard(ATTRIBUTIONS_PANEL, packageInfo1);

    expectButtonDisabled(text.packageLists.replace);
  });

  it('disables various buttons in replacement mode', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();
    const manualAttributions = faker.opossum.attributions({
      [packageInfo1.id]: packageInfo1,
      [packageInfo2.id]: packageInfo2,
    });
    await renderComponent(<AttributionsPanel />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions,
        metadata: faker.opossum.metadata(),
      }),
    });

    await clickPackageCard(ATTRIBUTIONS_PANEL, packageInfo1);
    await userEvent.click(getButton(text.packageLists.replace));

    expectButtonsDisabled(
      text.packageLists.create,
      text.packageLists.linkAsAttribution,
      text.packageLists.confirm,
      text.packageLists.delete,
    );
  });
});
