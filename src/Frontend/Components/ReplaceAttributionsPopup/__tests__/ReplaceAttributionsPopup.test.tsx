// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { noop } from 'lodash';

import {
  Attributions,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { setVariable } from '../../../state/actions/variables-actions/variables-actions';
import {
  getManualAttributions,
  getResourcesToManualAttributions,
  getSelectedAttributionId,
} from '../../../state/selectors/resource-selectors';
import { ATTRIBUTION_IDS_FOR_REPLACEMENT } from '../../../state/variables/use-attribution-ids-for-replacement';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { ReplaceAttributionsPopup } from '../ReplaceAttributionsPopup';

describe('ReplaceAttributionsPopup', () => {
  it('replaces selected attribution with non-pre-selected one', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();
    const resourceName = faker.opossum.resourceName();
    const { store } = renderComponent(
      <ReplaceAttributionsPopup
        open
        onClose={noop}
        selectedAttribution={packageInfo2}
      />,
      {
        actions: [
          loadFromFile(
            getParsedInputFileEnrichedWithTestData({
              manualAttributions: faker.opossum.attributions({
                [packageInfo1.id]: packageInfo1,
                [packageInfo2.id]: packageInfo2,
              }),
              resourcesToManualAttributions:
                faker.opossum.resourcesToAttributions({
                  [faker.opossum.filePath(resourceName)]: [
                    packageInfo1.id,
                    packageInfo2.id,
                  ],
                }),
            }),
          ),
          setVariable<Array<string>>(ATTRIBUTION_IDS_FOR_REPLACEMENT, [
            packageInfo1.id,
          ]),
        ],
      },
    );

    await userEvent.click(
      screen.getByRole('button', {
        name: text.replaceAttributionsPopup.replace,
      }),
    );

    expect(getManualAttributions(store.getState())).toEqual<Attributions>({
      [packageInfo2.id]: packageInfo2,
    });
    expect(
      getResourcesToManualAttributions(store.getState()),
    ).toEqual<ResourcesToAttributions>({
      [faker.opossum.filePath(resourceName)]: [packageInfo2.id],
    });
    expect(getSelectedAttributionId(store.getState())).toBe(packageInfo2.id);
  });

  it('replaces selected attribution with pre-selected one', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo({
      preSelected: true,
    });
    const resourceName = faker.opossum.resourceName();
    const { store } = renderComponent(
      <ReplaceAttributionsPopup
        open
        onClose={noop}
        selectedAttribution={packageInfo2}
      />,
      {
        actions: [
          loadFromFile(
            getParsedInputFileEnrichedWithTestData({
              manualAttributions: faker.opossum.attributions({
                [packageInfo1.id]: packageInfo1,
                [packageInfo2.id]: packageInfo2,
              }),
              resourcesToManualAttributions:
                faker.opossum.resourcesToAttributions({
                  [faker.opossum.filePath(resourceName)]: [
                    packageInfo1.id,
                    packageInfo2.id,
                  ],
                }),
            }),
          ),
          setVariable<Array<string>>(ATTRIBUTION_IDS_FOR_REPLACEMENT, [
            packageInfo1.id,
          ]),
        ],
      },
    );

    await userEvent.click(
      screen.getByRole('button', {
        name: text.replaceAttributionsPopup.replace,
      }),
    );

    expect(getManualAttributions(store.getState())).toEqual<Attributions>({
      [packageInfo2.id]: { ...packageInfo2, preSelected: undefined },
    });
    expect(
      getResourcesToManualAttributions(store.getState()),
    ).toEqual<ResourcesToAttributions>({
      [faker.opossum.filePath(resourceName)]: [packageInfo2.id],
    });
    expect(getSelectedAttributionId(store.getState())).toBe(packageInfo2.id);
  });
});
