// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { noop } from 'lodash-es';

import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { pathsToResources } from '../../../../testing/global-test-helpers';
import { setVariable } from '../../../state/actions/variables-actions/variables-actions';
import { getSelectedAttributionId } from '../../../state/selectors/resource-selectors';
import { ATTRIBUTION_SELECTION_FOR_REPLACEMENT } from '../../../state/variables/use-attribution-selection-for-replacement';
import {
  expectManualAttributions,
  expectResourcesToManualAttributions,
} from '../../../test-helpers/expectations';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { ConfirmReplacePopup } from '../ConfirmReplacePopup';

describe('ConfirmReplacePopup', () => {
  it('warns when replacing a mixed attribution', async () => {
    const attributionToReplace = faker.opossum.packageInfo();
    const replacementAttribution = faker.opossum.packageInfo();
    const editableResource = '/editable/file.ts';
    const readonlyResource = '/readonly/file.ts';

    await renderComponent(
      <ConfirmReplacePopup
        open
        onClose={noop}
        selectedAttribution={replacementAttribution}
      />,
      {
        data: getParsedInputFileEnrichedWithTestData({
          manualAttributions: faker.opossum.attributions({
            [attributionToReplace.id]: attributionToReplace,
            [replacementAttribution.id]: replacementAttribution,
          }),
          resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
            [editableResource]: [attributionToReplace.id],
            [readonlyResource]: [attributionToReplace.id],
          }),
          resources: pathsToResources([editableResource, readonlyResource]),
          readonlyRules: [{ path: '/readonly', readonly: true }],
        }),
        actions: [
          setVariable(ATTRIBUTION_SELECTION_FOR_REPLACEMENT, {
            mode: 'explicit',
            attributionUuids: [attributionToReplace.id],
          }),
        ],
      },
    );

    expect(
      await screen.findByText(
        text.confirmAttributionActionPopup.mixedWarning(1),
      ),
    ).toBeVisible();
  });

  it('includes a mixed pre-selected replacement in the warning count', async () => {
    const attributionToReplace = faker.opossum.packageInfo();
    const replacementAttribution = faker.opossum.packageInfo({
      preSelected: true,
      resourceAccess: 'mixed',
    });
    const editableResource = '/editable/file.ts';
    const readonlyResource = '/readonly/file.ts';

    await renderComponent(
      <ConfirmReplacePopup
        open
        onClose={noop}
        selectedAttribution={replacementAttribution}
      />,
      {
        data: getParsedInputFileEnrichedWithTestData({
          manualAttributions: faker.opossum.attributions({
            [attributionToReplace.id]: attributionToReplace,
            [replacementAttribution.id]: replacementAttribution,
          }),
          resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
            [editableResource]: [replacementAttribution.id],
            [readonlyResource]: [replacementAttribution.id],
          }),
          resources: pathsToResources([editableResource, readonlyResource]),
          readonlyRules: [{ path: '/readonly', readonly: true }],
        }),
        actions: [
          setVariable(ATTRIBUTION_SELECTION_FOR_REPLACEMENT, {
            mode: 'explicit',
            attributionUuids: [attributionToReplace.id],
          }),
        ],
      },
    );

    expect(
      await screen.findByText(
        text.confirmAttributionActionPopup.mixedWarning(1),
      ),
    ).toBeVisible();
  });

  it('replaces selected attribution with non-pre-selected one', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();
    const resource = faker.opossum.filePath(faker.opossum.resourceName());
    const { store } = await renderComponent(
      <ConfirmReplacePopup
        open
        onClose={noop}
        selectedAttribution={packageInfo2}
      />,
      {
        data: getParsedInputFileEnrichedWithTestData({
          manualAttributions: faker.opossum.attributions({
            [packageInfo1.id]: packageInfo1,
            [packageInfo2.id]: packageInfo2,
          }),
          resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
            [resource]: [packageInfo1.id, packageInfo2.id],
          }),
          resources: pathsToResources([resource]),
        }),
        actions: [
          setVariable(ATTRIBUTION_SELECTION_FOR_REPLACEMENT, {
            mode: 'explicit',
            attributionUuids: [packageInfo1.id],
          }),
        ],
      },
    );

    await screen.findByTestId('removed-attributions');
    await userEvent.click(
      screen.getByRole('button', {
        name: text.replaceAttributionsPopup.replace,
      }),
    );

    await expectManualAttributions({
      [packageInfo2.id]: packageInfo2,
    });
    await expectResourcesToManualAttributions({
      [resource]: [packageInfo2.id],
    });
    expect(getSelectedAttributionId(store.getState())).toBe(packageInfo2.id);
  });

  it('replaces a query-wide selection without materializing source IDs', async () => {
    const first = faker.opossum.packageInfo({ preSelected: true });
    const second = faker.opossum.packageInfo({ preSelected: true });
    const replacement = faker.opossum.packageInfo();
    const resource = faker.opossum.filePath(faker.opossum.resourceName());
    const { store } = await renderComponent(
      <ConfirmReplacePopup
        open
        onClose={noop}
        selectedAttribution={replacement}
      />,
      {
        data: getParsedInputFileEnrichedWithTestData({
          manualAttributions: faker.opossum.attributions({
            [first.id]: first,
            [second.id]: second,
            [replacement.id]: replacement,
          }),
          resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
            [resource]: [first.id, second.id, replacement.id],
          }),
          resources: pathsToResources([resource]),
        }),
        actions: [
          setVariable(ATTRIBUTION_SELECTION_FOR_REPLACEMENT, {
            mode: 'allMatching',
            query: {
              external: false,
              filters: [],
              search: '',
              valueFilters: {},
              resourcePathForRelationships: resource,
              showResolved: true,
              excludeUnrelated: false,
              relation: 'resource',
            },
            excludedAttributionUuids: [],
          }),
        ],
      },
    );

    expect(
      await screen.findByText(
        text.replaceAttributionsPopup.removeAttributions('2 attributions'),
      ),
    ).toBeVisible();

    await userEvent.click(
      await screen.findByRole('button', {
        name: text.replaceAttributionsPopup.replace,
      }),
    );

    await expectManualAttributions({ [replacement.id]: replacement });
    await expectResourcesToManualAttributions({
      [resource]: [replacement.id],
    });
    expect(
      store.getState().variablesState[ATTRIBUTION_SELECTION_FOR_REPLACEMENT],
    ).toBeNull();
  });

  it('replaces selected attribution with pre-selected one', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo({
      preSelected: true,
    });
    const resource = faker.opossum.filePath(faker.opossum.resourceName());
    const { store } = await renderComponent(
      <ConfirmReplacePopup
        open
        onClose={noop}
        selectedAttribution={packageInfo2}
      />,
      {
        data: getParsedInputFileEnrichedWithTestData({
          manualAttributions: faker.opossum.attributions({
            [packageInfo1.id]: packageInfo1,
            [packageInfo2.id]: packageInfo2,
          }),
          resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
            [resource]: [packageInfo1.id, packageInfo2.id],
          }),
          resources: pathsToResources([resource]),
        }),
        actions: [
          setVariable(ATTRIBUTION_SELECTION_FOR_REPLACEMENT, {
            mode: 'explicit',
            attributionUuids: [packageInfo1.id],
          }),
        ],
      },
    );

    await screen.findByTestId('removed-attributions');
    await userEvent.click(
      screen.getByRole('button', {
        name: text.replaceAttributionsPopup.replace,
      }),
    );

    await expectManualAttributions({
      [packageInfo2.id]: { ...packageInfo2, preSelected: undefined },
    });
    await expectResourcesToManualAttributions({
      [resource]: [packageInfo2.id],
    });
    expect(getSelectedAttributionId(store.getState())).toBe(packageInfo2.id);
  });
});
