// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { setResources } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { getSelectedResourceId } from '../../../state/selectors/resource-selectors';
import { renderComponent } from '../../../test-helpers/render';
import { ProgressBar } from '../ProgressBar';

async function clickOnAttributionProgressBar() {
  await userEvent.click(
    screen.getByLabelText(
      text.topBar.switchableProgressBar.attributionProgressBar.ariaLabel,
    ),
    {
      advanceTimers: jest.runOnlyPendingTimersAsync,
    },
  );
}

async function hoverOverAttributionProgressBar() {
  await userEvent.hover(
    screen.getByLabelText(
      text.topBar.switchableProgressBar.attributionProgressBar.ariaLabel,
    ),
    {
      advanceTimers: jest.runOnlyPendingTimersAsync,
    },
  );
}

async function hoverOverCriticalityProgressBar() {
  await userEvent.hover(
    screen.getByLabelText(
      text.topBar.switchableProgressBar.criticalSignalsBar.ariaLabel,
    ),
    {
      advanceTimers: jest.runOnlyPendingTimersAsync,
    },
  );
}

async function hoverOverClassificationProgressBar() {
  await userEvent.hover(
    screen.getByLabelText(
      text.topBar.switchableProgressBar.classificationProgressBar.ariaLabel,
    ),
    {
      advanceTimers: jest.runOnlyPendingTimersAsync,
    },
  );
}

async function clickOnCriticalityProgressBar() {
  await userEvent.click(
    screen.getByLabelText(
      text.topBar.switchableProgressBar.criticalSignalsBar.ariaLabel,
    ),
    {
      advanceTimers: jest.runOnlyPendingTimersAsync,
    },
  );
}

describe('ProgressBar', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('click on regular progress bar goes to next resource with non-inherited external attributions only', async () => {
    const resourceName1 = faker.opossum.resourceName();
    const resourceId1 = faker.opossum.filePath(resourceName1);
    const resourceName2 = faker.opossum.resourceName();
    const resourceId2 = faker.opossum.filePath(resourceName2);
    const { store } = renderComponent(
      <ProgressBar
        selectedProgressBar={'attribution'}
        progressBarData={{
          fileCount: 6,
          filesWithHighlyCriticalExternalAttributionsCount: 1,
          filesWithMediumCriticalExternalAttributionsCount: 1,
          filesWithManualAttributionCount: 3,
          filesWithOnlyExternalAttributionCount: 1,
          filesWithOnlyPreSelectedAttributionCount: 1,
          resourcesWithMediumCriticalExternalAttributions: [],
          resourcesWithNonInheritedExternalAttributionOnly: [
            resourceId1,
            resourceId2,
          ],
          resourcesWithHighlyCriticalExternalAttributions: [],
          classificationStatistics: {},
        }}
      />,
      { actions: [setResources({ [resourceName1]: 1, [resourceName2]: 1 })] },
    );
    await clickOnAttributionProgressBar();

    expect(getSelectedResourceId(store.getState())).toBe(resourceId1);

    await clickOnAttributionProgressBar();

    expect(getSelectedResourceId(store.getState())).toBe(resourceId2);

    await clickOnAttributionProgressBar();

    expect(getSelectedResourceId(store.getState())).toBe(resourceId1);
  });

  it('renders regular progress bar', async () => {
    renderComponent(
      <ProgressBar
        selectedProgressBar={'attribution'}
        progressBarData={{
          fileCount: 6,
          filesWithHighlyCriticalExternalAttributionsCount: 1,
          filesWithMediumCriticalExternalAttributionsCount: 1,
          filesWithManualAttributionCount: 3,
          filesWithOnlyExternalAttributionCount: 1,
          filesWithOnlyPreSelectedAttributionCount: 1,
          resourcesWithMediumCriticalExternalAttributions: [],
          resourcesWithNonInheritedExternalAttributionOnly: [],
          resourcesWithHighlyCriticalExternalAttributions: [],
          classificationStatistics: {},
        }}
      />,
    );
    await hoverOverAttributionProgressBar();

    expect(screen.getByText(/Number of resources/)).toBeInTheDocument();
    expect(screen.getByText(/with attributions: 3/)).toBeInTheDocument();
    expect(
      screen.getByText(/with only pre-selected attributions: 1/),
    ).toBeInTheDocument();
    expect(screen.getByText(/with only signals: 1/)).toBeInTheDocument();
  });

  it('renders criticality progress bar', async () => {
    renderComponent(
      <ProgressBar
        selectedProgressBar={'criticality'}
        progressBarData={{
          fileCount: 6,
          filesWithHighlyCriticalExternalAttributionsCount: 1,
          filesWithMediumCriticalExternalAttributionsCount: 1,
          filesWithManualAttributionCount: 1,
          filesWithOnlyExternalAttributionCount: 3,
          filesWithOnlyPreSelectedAttributionCount: 1,
          resourcesWithMediumCriticalExternalAttributions: [],
          resourcesWithNonInheritedExternalAttributionOnly: [],
          resourcesWithHighlyCriticalExternalAttributions: [],
          classificationStatistics: {},
        }}
      />,
    );
    await hoverOverCriticalityProgressBar();

    expect(
      screen.getByText(/Number of resources with signals and no attributions/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/containing highly critical signals: 1/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/containing medium critical signals: 1/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/containing only non-critical signals: 1/),
    ).toBeInTheDocument();
  });

  it('click on criticality progress bar goes to next resource with a critical attribution', async () => {
    const resourceName1 = faker.opossum.resourceName();
    const resourceId1 = faker.opossum.filePath(resourceName1);
    const resourceName2 = faker.opossum.resourceName();
    const resourceId2 = faker.opossum.filePath(resourceName2);
    const { store } = renderComponent(
      <ProgressBar
        selectedProgressBar={'criticality'}
        progressBarData={{
          fileCount: 6,
          filesWithHighlyCriticalExternalAttributionsCount: 1,
          filesWithMediumCriticalExternalAttributionsCount: 1,
          filesWithManualAttributionCount: 1,
          filesWithOnlyExternalAttributionCount: 3,
          filesWithOnlyPreSelectedAttributionCount: 1,
          resourcesWithMediumCriticalExternalAttributions: [resourceId1],
          resourcesWithNonInheritedExternalAttributionOnly: [],
          resourcesWithHighlyCriticalExternalAttributions: [resourceId2],
          classificationStatistics: {},
        }}
      />,
      { actions: [setResources({ [resourceName1]: 1, [resourceName2]: 1 })] },
    );
    await clickOnCriticalityProgressBar();

    expect(getSelectedResourceId(store.getState())).toBe(resourceId1);

    await clickOnCriticalityProgressBar();

    expect(getSelectedResourceId(store.getState())).toBe(resourceId2);

    await clickOnCriticalityProgressBar();

    expect(getSelectedResourceId(store.getState())).toBe(resourceId1);
  });

  it('renders classification progress bar', async () => {
    renderComponent(
      <ProgressBar
        selectedProgressBar={'classification'}
        progressBarData={{
          fileCount: 6,
          filesWithHighlyCriticalExternalAttributionsCount: 1,
          filesWithMediumCriticalExternalAttributionsCount: 1,
          filesWithManualAttributionCount: 1,
          filesWithOnlyExternalAttributionCount: 3,
          filesWithOnlyPreSelectedAttributionCount: 1,
          resourcesWithMediumCriticalExternalAttributions: [],
          resourcesWithNonInheritedExternalAttributionOnly: [],
          resourcesWithHighlyCriticalExternalAttributions: [],
          classificationStatistics: {
            0: 4,
            1: 3,
            2: 2,
          },
        }}
      />,
    );
    await hoverOverClassificationProgressBar();

    expect(
      screen.getByText(/Number of resources with signals and no attributions/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/containing classification 0: 4/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/containing classification 1: 3/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/containing classification 2: 2/),
    ).toBeInTheDocument();
  });
});
