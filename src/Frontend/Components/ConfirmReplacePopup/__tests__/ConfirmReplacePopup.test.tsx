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
import { ATTRIBUTION_IDS_FOR_REPLACEMENT } from '../../../state/variables/use-attribution-ids-for-replacement';
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
          setVariable<Array<string>>(ATTRIBUTION_IDS_FOR_REPLACEMENT, [
            attributionToReplace.id,
          ]),
        ],
      },
    );

    expect(
      await screen.findByText(
        text.confirmAttributionActionPopup.mixedWarning(
          1,
          text.confirmAttributionActionPopup.attribution,
        ),
      ),
    ).toBeVisible();
  });

  it('includes a mixed pre-selected replacement in the warning count', async () => {
    const attributionToReplace = faker.opossum.packageInfo();
    const replacementAttribution = faker.opossum.packageInfo({
      preSelected: true,
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
          setVariable<Array<string>>(ATTRIBUTION_IDS_FOR_REPLACEMENT, [
            attributionToReplace.id,
          ]),
        ],
      },
    );

    expect(
      await screen.findByText(
        text.confirmAttributionActionPopup.mixedWarning(
          1,
          text.confirmAttributionActionPopup.attribution,
        ),
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
          setVariable<Array<string>>(ATTRIBUTION_IDS_FOR_REPLACEMENT, [
            packageInfo1.id,
          ]),
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
          setVariable<Array<string>>(ATTRIBUTION_IDS_FOR_REPLACEMENT, [
            packageInfo1.id,
          ]),
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
