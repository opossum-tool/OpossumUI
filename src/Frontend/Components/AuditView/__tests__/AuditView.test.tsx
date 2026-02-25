// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { View } from '../../../enums/enums';
import { setProjectMetadata } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { setVariable } from '../../../state/actions/variables-actions/variables-actions';
import { navigateToView } from '../../../state/actions/view-actions/view-actions';
import {
  AttributionFilters,
  initialFilters,
  MANUAL_ATTRIBUTION_FILTERS_AUDIT,
} from '../../../state/variables/use-filters';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { AuditView } from '../AuditView';

describe('AuditView', () => {
  it('renders', async () => {
    const resourceName = faker.opossum.resourceName();
    const packageInfo = faker.opossum.packageInfo();
    const manualAttributions = faker.opossum.attributions({
      [packageInfo.id]: packageInfo,
    });
    await renderComponent(<AuditView />, {
      data: getParsedInputFileEnrichedWithTestData({
        resources: faker.opossum.resources({
          [resourceName]: 1,
        }),
        manualAttributions,
        resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath(resourceName)]: [packageInfo.id],
        }),
      }),
      actions: [
        setProjectMetadata(faker.opossum.metadata()),
        setVariable<AttributionFilters>(MANUAL_ATTRIBUTION_FILTERS_AUDIT, {
          ...initialFilters,
          attributions: {
            [packageInfo.id]: packageInfo,
          },
        }),
        navigateToView(View.Audit),
      ],
    });

    await userEvent.click(
      screen.getByText(
        `${packageInfo.packageName}, ${packageInfo.packageVersion}`,
      ),
    );

    expect(
      screen.getByRole('button', { name: text.attributionColumn.save }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(resourceName)).not.toHaveLength(0);
  });
});
