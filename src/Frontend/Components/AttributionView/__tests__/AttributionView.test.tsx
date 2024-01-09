// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { faker } from '../../../../testing/Faker';
import { ButtonText, View } from '../../../enums/enums';
import { setProjectMetadata } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { setVariable } from '../../../state/actions/variables-actions/variables-actions';
import { navigateToView } from '../../../state/actions/view-actions/view-actions';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import {
  FilteredAttributions,
  initialFilteredAttributions,
  WORKER_REDUX_KEYS,
} from '../../../web-workers/use-signals-worker';
import { AttributionView } from '../AttributionView';

describe('The Attribution View', () => {
  it('renders', async () => {
    const resourceName = faker.opossum.resourceName();
    const [attributionId, packageInfo] = faker.opossum.manualAttribution();
    const manualAttributions = faker.opossum.manualAttributions({
      [attributionId]: packageInfo,
    });
    renderComponent(<AttributionView />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            resources: faker.opossum.resources({
              [resourceName]: 1,
            }),
            manualAttributions,
            resourcesToManualAttributions:
              faker.opossum.resourcesToAttributions({
                [faker.opossum.filePath(resourceName)]: [attributionId],
              }),
          }),
        ),
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<FilteredAttributions>(
          WORKER_REDUX_KEYS.FILTERED_ATTRIBUTIONS,
          {
            ...initialFilteredAttributions,
            attributions: manualAttributions,
          },
        ),
        navigateToView(View.Attribution),
      ],
    });

    await userEvent.click(
      screen.getByText(
        `${packageInfo.packageName}, ${packageInfo.packageVersion}`,
      ),
    );

    expect(
      screen.getByRole('button', { name: ButtonText.Save }),
    ).toBeInTheDocument();
    expect(screen.getByText(resourceName)).toBeInTheDocument();
  });
});
