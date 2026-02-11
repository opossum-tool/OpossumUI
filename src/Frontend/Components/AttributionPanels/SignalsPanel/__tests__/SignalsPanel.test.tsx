// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { text } from '../../../../../shared/text';
import { faker } from '../../../../../testing/Faker';
import { ROOT_PATH } from '../../../../shared-constants';
import { setProjectMetadata } from '../../../../state/actions/resource-actions/all-views-simple-actions';
import {
  setResolvedExternalAttributions,
  setSelectedResourceId,
} from '../../../../state/actions/resource-actions/audit-view-simple-actions';
import { setVariable } from '../../../../state/actions/variables-actions/variables-actions';
import { getSelectedAttributionId } from '../../../../state/selectors/resource-selectors';
import {
  FILTERED_SIGNALS,
  FilteredData,
  initialFilteredAttributions,
} from '../../../../state/variables/use-filtered-data';
import {
  expectResolvedExternalAttributions,
  expectResourcesToManualAttributions,
} from '../../../../test-helpers/expectations';
import { getParsedInputFileEnrichedWithTestData } from '../../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../../test-helpers/render';
import { SignalsPanel } from '../SignalsPanel';

describe('SignalsPanel', () => {
  it('selects signal on card click', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const externalAttributions = faker.opossum.attributions({
      [packageInfo.id]: packageInfo,
    });
    const { store } = await renderComponent(<SignalsPanel />, {
      data: getParsedInputFileEnrichedWithTestData({
        externalAttributions,
      }),
      actions: [
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredData>(FILTERED_SIGNALS, {
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

  it('selects signal on checkbox click', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const externalAttributions = faker.opossum.attributions({
      [packageInfo.id]: packageInfo,
    });
    const { store } = await renderComponent(<SignalsPanel />, {
      data: getParsedInputFileEnrichedWithTestData({
        externalAttributions,
      }),
      actions: [
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredData>(FILTERED_SIGNALS, {
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

  it('deletes selected signal', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const externalAttributions = faker.opossum.attributions({
      [packageInfo.id]: packageInfo,
    });
    const { store } = await renderComponent(<SignalsPanel />, {
      data: getParsedInputFileEnrichedWithTestData({
        externalAttributions,
      }),
      actions: [
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredData>(FILTERED_SIGNALS, {
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

    await expectResolvedExternalAttributions(
      store.getState(),
      new Set([packageInfo.id]),
    );
  });

  it('disables delete button when selected signal is already deleted', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const externalAttributions = faker.opossum.attributions({
      [packageInfo.id]: packageInfo,
    });
    await renderComponent(<SignalsPanel />, {
      data: getParsedInputFileEnrichedWithTestData({
        externalAttributions,
      }),
      actions: [
        setResolvedExternalAttributions(new Set([packageInfo.id])),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredData>(FILTERED_SIGNALS, {
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
      screen.getByRole('button', { name: text.packageLists.delete }),
    ).toBeDisabled();
  });

  it('restores selected signal', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const externalAttributions = faker.opossum.attributions({
      [packageInfo.id]: packageInfo,
    });
    const { store } = await renderComponent(<SignalsPanel />, {
      data: getParsedInputFileEnrichedWithTestData({
        externalAttributions,
      }),
      actions: [
        setResolvedExternalAttributions(new Set([packageInfo.id])),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredData>(FILTERED_SIGNALS, {
          ...initialFilteredAttributions,
          attributions: {
            [packageInfo.id]: packageInfo,
          },
        }),
      ],
    });

    await userEvent.click(
      screen.getByRole('button', { name: text.packageLists.showDeleted }),
    );
    await userEvent.click(
      screen.getByText(
        `${packageInfo.packageName}, ${packageInfo.packageVersion}`,
      ),
    );
    await userEvent.click(
      screen.getByRole('button', { name: text.packageLists.restore }),
    );

    await expectResolvedExternalAttributions(store.getState(), new Set());
  });

  it('disables restore button when selected signal is not deleted', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const externalAttributions = faker.opossum.attributions({
      [packageInfo.id]: packageInfo,
    });
    await renderComponent(<SignalsPanel />, {
      data: getParsedInputFileEnrichedWithTestData({
        externalAttributions,
      }),
      actions: [
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredData>(FILTERED_SIGNALS, {
          ...initialFilteredAttributions,
          attributions: {
            [packageInfo.id]: packageInfo,
          },
        }),
      ],
    });

    await userEvent.click(
      screen.getByRole('button', { name: text.packageLists.showDeleted }),
    );
    await userEvent.click(
      screen.getByText(
        `${packageInfo.packageName}, ${packageInfo.packageVersion}`,
      ),
    );

    expect(
      screen.getByRole('button', { name: text.packageLists.restore }),
    ).toBeDisabled();
  });

  it('links selected attribution', async () => {
    const filePath = faker.system.filePath();
    const packageInfo = faker.opossum.packageInfo();
    const externalAttributions = faker.opossum.attributions({
      [packageInfo.id]: packageInfo,
    });
    const { store } = await renderComponent(<SignalsPanel />, {
      data: getParsedInputFileEnrichedWithTestData({
        externalAttributions,
        resourcesToExternalAttributions: {
          [filePath]: [packageInfo.id],
        },
      }),
      actions: [
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredData>(FILTERED_SIGNALS, {
          ...initialFilteredAttributions,
          attributions: {
            [packageInfo.id]: packageInfo,
          },
        }),
      ],
    });

    await expectResourcesToManualAttributions(store.getState(), {});

    await userEvent.click(
      screen.getByText(
        `${packageInfo.packageName}, ${packageInfo.packageVersion}`,
      ),
    );
    await userEvent.click(
      screen.getByRole('button', { name: text.packageLists.linkAsAttribution }),
    );

    await expectResourcesToManualAttributions(store.getState(), {
      [ROOT_PATH]: [expect.any(String)],
    });
  });

  it('disables link button when selected resource is a breakpoint', async () => {
    const filePath = faker.system.filePath();
    const packageInfo = faker.opossum.packageInfo();
    const externalAttributions = faker.opossum.attributions({
      [packageInfo.id]: packageInfo,
    });
    await renderComponent(<SignalsPanel />, {
      data: getParsedInputFileEnrichedWithTestData({
        externalAttributions,
        attributionBreakpoints: new Set([filePath]),
        resourcesToExternalAttributions: {
          [filePath]: [packageInfo.id],
        },
      }),
      actions: [
        setSelectedResourceId(filePath),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredData>(FILTERED_SIGNALS, {
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
});
