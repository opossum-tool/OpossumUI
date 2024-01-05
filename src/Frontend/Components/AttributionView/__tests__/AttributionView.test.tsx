// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { faker } from '../../../../testing/Faker';
import { ButtonText, View } from '../../../enums/enums';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { navigateToView } from '../../../state/actions/view-actions/view-actions';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { AttributionView } from '../AttributionView';

describe('The Attribution View', () => {
  it('renders', async () => {
    const resourceName = faker.opossum.resourceName();
    const [attributionId, packageInfo] = faker.opossum.manualAttribution();
    renderComponent(<AttributionView />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            resources: faker.opossum.resources({
              [resourceName]: 1,
            }),
            manualAttributions: faker.opossum.manualAttributions({
              [attributionId]: packageInfo,
            }),
            resourcesToManualAttributions:
              faker.opossum.resourcesToAttributions({
                [faker.opossum.filePath(resourceName)]: [attributionId],
              }),
          }),
        ),
        navigateToView(View.Attribution),
      ],
    });
    const attributionCard = screen.getByText(
      `${packageInfo.packageName}, ${packageInfo.packageVersion}`,
    );

    expect(
      screen.getByText(/Attributions \(1 total, 0, 0, 0, 0, 0/),
    ).toBeInTheDocument();
    expect(attributionCard).toBeInTheDocument();

    await userEvent.click(attributionCard);
    expect(
      screen.getByRole('button', { name: ButtonText.Save }),
    ).toBeInTheDocument();
    expect(screen.getByText(resourceName)).toBeInTheDocument();
  });
});
