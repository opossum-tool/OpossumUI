// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Criticality } from '../../../../shared/shared-types';
import { faker } from '../../../../testing/Faker';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { setVariable } from '../../../state/actions/variables-actions/variables-actions';
import { getSelectedAttributionIdInAttributionView } from '../../../state/selectors/attribution-view-resource-selectors';
import {
  getParsedInputFileEnrichedWithTestData,
  selectFilter,
} from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { LOW_CONFIDENCE_THRESHOLD } from '../../Filter/FilterMultiSelect.util';
import { AttributionList } from '../AttributionList';
import {text} from '../../../../shared/text';

describe('AttributionList', () => {
  it('sorts attributions alphabetically', () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
      packageName: 'B',
    });
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution({
      packageName: 'A',
    });
    renderComponent(<AttributionList />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions: faker.opossum.manualAttributions({
              [attributionId1]: packageInfo1,
              [attributionId2]: packageInfo2,
            }),
          }),
        ),
      ],
    });

    expect(
      screen
        .getByText(
          `${packageInfo1.packageName}, ${packageInfo1.packageVersion}`,
        )
        .compareDocumentPosition(
          screen.getByText(
            `${packageInfo2.packageName}, ${packageInfo2.packageVersion}`,
          ),
        ),
    ).toBe(2);
  });

  it('sorts attributions by criticality', () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
      packageName: 'A',
    });
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution({
      packageName: 'B',
      criticality: Criticality.High,
    });
    const [attributionId3, packageInfo3] = faker.opossum.manualAttribution({
      packageName: 'C',
      criticality: Criticality.Medium,
    });
    renderComponent(<AttributionList />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions: faker.opossum.manualAttributions({
              [attributionId1]: packageInfo1,
              [attributionId2]: packageInfo2,
              [attributionId3]: packageInfo3,
            }),
          }),
        ),
        setVariable(
          'active-sorting-attribution-view',
          text.attributionViewSorting.byCriticality,
        ),
      ],
    });

    const packageDisplay1 = screen.getByText(
      `${packageInfo1.packageName}, ${packageInfo1.packageVersion}`,
    );
    const packageDisplay2 = screen.getByText(
      `${packageInfo2.packageName}, ${packageInfo2.packageVersion}`,
    );
    const packageDisplay3 = screen.getByText(
      `${packageInfo3.packageName}, ${packageInfo3.packageVersion}`,
    );

    expect(packageDisplay2.compareDocumentPosition(packageDisplay3)).toBe(4);
    expect(packageDisplay3.compareDocumentPosition(packageDisplay1)).toBe(4);
  });

  it('sets selected attribution ID on card click', async () => {
    const [attributionId, packageInfo] = faker.opossum.manualAttribution();
    const { store } = renderComponent(<AttributionList />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions: faker.opossum.manualAttributions({
              [attributionId]: packageInfo,
            }),
          }),
        ),
      ],
    });

    await userEvent.click(
      screen.getByText(
        `${packageInfo.packageName}, ${packageInfo.packageVersion}`,
      ),
    );

    expect(getSelectedAttributionIdInAttributionView(store.getState())).toBe(
      attributionId,
    );
  });

  it('filters follow-ups', async () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution();
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution({
      followUp: 'FOLLOW_UP',
    });
    renderComponent(<AttributionList />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions: faker.opossum.manualAttributions({
              [attributionId1]: packageInfo1,
              [attributionId2]: packageInfo2,
            }),
          }),
        ),
      ],
    });

    await userEvent.click(screen.getByLabelText('Filters'));
    await selectFilter(screen, 'Needs Follow-Up');

    expect(
      screen.getByText(/Attributions \(2 total, 0, 1, 0, 0, 0/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(packageInfo2.packageName!)),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(new RegExp(packageInfo1.packageName!)),
    ).not.toBeInTheDocument();
  });

  it('filters needs-review', async () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution();
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution({
      needsReview: true,
    });
    renderComponent(<AttributionList />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions: faker.opossum.manualAttributions({
              [attributionId1]: packageInfo1,
              [attributionId2]: packageInfo2,
            }),
          }),
        ),
      ],
    });

    await userEvent.click(screen.getByLabelText('Filters'));
    await selectFilter(screen, 'Needs Review by QA');

    expect(
      screen.getByText(/Attributions \(2 total, 1, 0, 0, 0, 0/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(packageInfo2.packageName!)),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(new RegExp(packageInfo1.packageName!)),
    ).not.toBeInTheDocument();
  });

  it('filters pre-selected', async () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution();
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution({
      preSelected: true,
    });
    renderComponent(<AttributionList />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions: faker.opossum.manualAttributions({
              [attributionId1]: packageInfo1,
              [attributionId2]: packageInfo2,
            }),
          }),
        ),
      ],
    });

    await userEvent.click(screen.getByLabelText('Filters'));
    await selectFilter(screen, 'Pre-selected');

    expect(
      screen.getByText(/Attributions \(2 total, 0, 0, 1, 0, 0/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(packageInfo2.packageName!)),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(new RegExp(packageInfo1.packageName!)),
    ).not.toBeInTheDocument();
  });

  it('filters first-party', async () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution();
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution({
      firstParty: true,
    });
    renderComponent(<AttributionList />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions: faker.opossum.manualAttributions({
              [attributionId1]: packageInfo1,
              [attributionId2]: packageInfo2,
            }),
          }),
        ),
      ],
    });

    await userEvent.click(screen.getByLabelText('Filters'));
    await selectFilter(screen, 'First Party');

    expect(
      screen.getByText(/Attributions \(2 total, 0, 0, 0, 0, 0/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(packageInfo2.packageName!)),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(new RegExp(packageInfo1.packageName!)),
    ).not.toBeInTheDocument();
  });

  it('filters third-party', async () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution();
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution({
      firstParty: true,
    });
    renderComponent(<AttributionList />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions: faker.opossum.manualAttributions({
              [attributionId1]: packageInfo1,
              [attributionId2]: packageInfo2,
            }),
          }),
        ),
      ],
    });

    await userEvent.click(screen.getByLabelText('Filters'));
    await selectFilter(screen, 'Third Party');

    expect(
      screen.getByText(/Attributions \(2 total, 0, 0, 0, 0, 0/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(packageInfo1.packageName!)),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(new RegExp(packageInfo2.packageName!)),
    ).not.toBeInTheDocument();
  });

  it('filters currently preferred', async () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution();
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution({
      preferred: true,
    });
    renderComponent(<AttributionList />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions: faker.opossum.manualAttributions({
              [attributionId1]: packageInfo1,
              [attributionId2]: packageInfo2,
            }),
          }),
        ),
      ],
    });

    await userEvent.click(screen.getByLabelText('Filters'));
    await selectFilter(screen, 'Currently Preferred');

    expect(
      screen.getByText(/Attributions \(2 total, 0, 0, 0, 0, 0/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(packageInfo2.packageName!)),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(new RegExp(packageInfo1.packageName!)),
    ).not.toBeInTheDocument();
  });

  it('filters previously preferred', async () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution();
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution({
      wasPreferred: true,
    });
    renderComponent(<AttributionList />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions: faker.opossum.manualAttributions({
              [attributionId1]: packageInfo1,
              [attributionId2]: packageInfo2,
            }),
          }),
        ),
      ],
    });

    await userEvent.click(screen.getByLabelText('Filters'));
    await selectFilter(screen, 'Previously Preferred');

    expect(
      screen.getByText(/Attributions \(2 total, 0, 0, 0, 0, 0/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(packageInfo2.packageName!)),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(new RegExp(packageInfo1.packageName!)),
    ).not.toBeInTheDocument();
  });

  it('filters low confidence', async () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
      attributionConfidence: LOW_CONFIDENCE_THRESHOLD + 1,
    });
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution({
      attributionConfidence: LOW_CONFIDENCE_THRESHOLD,
    });
    renderComponent(<AttributionList />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions: faker.opossum.manualAttributions({
              [attributionId1]: packageInfo1,
              [attributionId2]: packageInfo2,
            }),
          }),
        ),
      ],
    });

    await userEvent.click(screen.getByLabelText('Filters'));
    await selectFilter(screen, 'Low Confidence');

    expect(
      screen.getByText(/Attributions \(2 total, 0, 0, 0, 0, 0/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(packageInfo2.packageName!)),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(new RegExp(packageInfo1.packageName!)),
    ).not.toBeInTheDocument();
  });

  it('filters excluded-from-notice', async () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution();
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution({
      excludeFromNotice: true,
    });
    renderComponent(<AttributionList />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions: faker.opossum.manualAttributions({
              [attributionId1]: packageInfo1,
              [attributionId2]: packageInfo2,
            }),
          }),
        ),
      ],
    });

    await userEvent.click(screen.getByLabelText('Filters'));
    await selectFilter(screen, 'Excluded from Notice');

    expect(
      screen.getByText(/Attributions \(2 total, 0, 0, 0, 0, 0/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(packageInfo2.packageName!)),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(new RegExp(packageInfo1.packageName!)),
    ).not.toBeInTheDocument();
  });
});
