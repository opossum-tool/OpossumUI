// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { text } from '../../../../../shared/text';
import { faker } from '../../../../../testing/Faker';
import { pathsToResources } from '../../../../../testing/global-test-helpers';
import { ROOT_PATH } from '../../../../shared-constants';
import {
  setProjectMetadata,
  setTemporaryDisplayPackageInfo,
} from '../../../../state/actions/resource-actions/all-views-simple-actions';
import {
  setSelectedAttributionId,
  setSelectedResourceId,
} from '../../../../state/actions/resource-actions/audit-view-simple-actions';
import { getSelectedAttributionId } from '../../../../state/selectors/resource-selectors';
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
      }),
      actions: [setProjectMetadata(faker.opossum.metadata())],
    });

    await userEvent.click(
      await screen.findByText(
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
    const { store } = await renderComponent(<AttributionsPanel />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions,
      }),
      actions: [setProjectMetadata(faker.opossum.metadata())],
    });

    await userEvent.click(
      within(
        await screen.findByLabelText(
          `package card ${packageInfo.packageName}, ${packageInfo.packageVersion}`,
        ),
      ).getByRole('checkbox'),
    );

    expect(getSelectedAttributionId(store.getState())).toBe(packageInfo.id);
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
        manualAttributions,
        resourcesToManualAttributions: {
          [resourceId]: [packageInfo1.id, packageInfo2.id],
        },
      }),
      actions: [setSelectedResourceId(resourceId)],
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
    const { store } = await renderComponent(<AttributionsPanel />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions,
      }),
      actions: [setProjectMetadata(faker.opossum.metadata())],
    });

    await userEvent.click(
      await screen.findByText(
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
    const { store } = await renderComponent(<AttributionsPanel />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions,
      }),
      actions: [setProjectMetadata(faker.opossum.metadata())],
    });

    await userEvent.click(
      await screen.findByText(
        `${packageInfo.packageName}, ${packageInfo.packageVersion}`,
      ),
    );
    await userEvent.click(
      screen.getByRole('button', { name: text.packageLists.delete }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: text.deleteAttributionsPopup.delete }),
    );

    await expectManualAttributions(store.getState(), {});
  });

  it('links selected attribution', async () => {
    const filePath = faker.system.filePath();
    const packageInfo = faker.opossum.packageInfo();
    const manualAttributions = faker.opossum.attributions({
      [packageInfo.id]: packageInfo,
    });
    const { store } = await renderComponent(<AttributionsPanel />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions,
        resourcesToManualAttributions: {
          [filePath]: [packageInfo.id],
        },
      }),
      actions: [setProjectMetadata(faker.opossum.metadata())],
    });

    await userEvent.click(
      await screen.findByText(
        `${packageInfo.packageName}, ${packageInfo.packageVersion}`,
      ),
    );
    await userEvent.click(
      screen.getByRole('button', { name: text.packageLists.linkAsAttribution }),
    );

    await expectResourcesToManualAttributions(store.getState(), {
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
        resourcesToManualAttributions: {
          [filePath]: [packageInfo.id],
        },
      }),
      actions: [setProjectMetadata(faker.opossum.metadata())],
    });

    await userEvent.click(
      await screen.findByText(
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
      }),
      actions: [
        setSelectedResourceId(filePath),
        setProjectMetadata(faker.opossum.metadata()),
      ],
    });

    await userEvent.click(
      await screen.findByText(
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
    await renderComponent(<AttributionsPanel />, {
      data: getParsedInputFileEnrichedWithTestData({
        resources: pathsToResources([filePath]),
        manualAttributions,
        resourcesToManualAttributions: {
          [filePath]: [packageInfo.id],
        },
        attributionBreakpoints: new Set([filePath]),
      }),
      actions: [
        setSelectedResourceId(filePath),
        setProjectMetadata(faker.opossum.metadata()),
      ],
    });

    await userEvent.click(
      await screen.findByText(
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
    const { store } = await renderComponent(<AttributionsPanel />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions,
      }),
      actions: [setProjectMetadata(faker.opossum.metadata())],
    });

    await userEvent.click(
      await screen.findByText(
        `${packageInfo.packageName}, ${packageInfo.packageVersion}`,
      ),
    );
    await userEvent.click(
      screen.getByRole('button', { name: text.packageLists.confirm }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: text.saveAttributionsPopup.confirm }),
    );

    await expectManualAttributions(store.getState(), {
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
    await renderComponent(<AttributionsPanel />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions,
      }),
      actions: [setProjectMetadata(faker.opossum.metadata())],
    });

    await userEvent.click(
      await screen.findByText(
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
    await renderComponent(<AttributionsPanel />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions,
      }),
      actions: [setProjectMetadata(faker.opossum.metadata())],
    });

    await userEvent.click(
      await screen.findByText(
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
    await renderComponent(<AttributionsPanel />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions,
      }),
      actions: [setProjectMetadata(faker.opossum.metadata())],
    });

    await userEvent.click(
      await screen.findByText(
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
    await renderComponent(<AttributionsPanel />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions,
      }),
      actions: [setProjectMetadata(faker.opossum.metadata())],
    });

    await userEvent.click(
      await screen.findByText(
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
    const { store } = await renderComponent(<AttributionsPanel />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions,
        externalAttributions: {
          [packageInfo3.id]: packageInfo3,
        },
      }),
      actions: [setProjectMetadata(faker.opossum.metadata())],
    });

    await userEvent.click(
      await screen.findByText(
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
