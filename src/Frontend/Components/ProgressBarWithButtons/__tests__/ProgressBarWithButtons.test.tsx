// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { faker } from '../../../../testing/Faker';
import { setResources } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { getSelectedResourceId } from '../../../state/selectors/resource-selectors';
import { renderComponent } from '../../../test-helpers/render';
import { ProgressBarWithButtons } from '../ProgressBarWithButtons';

describe('ProgressBarWithButtons', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders regular progress bar', async () => {
    renderComponent(
      <ProgressBarWithButtons
        showCriticalSignals={false}
        progressBarWithButtonsData={{
          count: {
            files: 6,
            filesWithHighlyCriticalExternalAttributions: 1,
            filesWithMediumCriticalExternalAttributions: 1,
            filesWithManualAttribution: 3,
            filesWithOnlyExternalAttribution: 1,
            filesWithOnlyPreSelectedAttribution: 1,
          },
          resources: {
            withMediumCriticalExternalAttributions: [],
            withNonInheritedExternalAttributionOnly: [],
            withHighlyCriticalExternalAttributions: [],
          },
        }}
        onSwitchClick={() => {}}
      />,
    );

    await userEvent.hover(screen.getByLabelText('ProgressBar'), {
      advanceTimers: jest.runOnlyPendingTimersAsync,
    });

    expect(screen.getByText(/Number of resources/)).toBeInTheDocument();
    expect(screen.getByText(/with attributions: 3/)).toBeInTheDocument();
    expect(
      screen.getByText(/with only pre-selected attributions: 1/),
    ).toBeInTheDocument();
    expect(screen.getByText(/with only signals: 1/)).toBeInTheDocument();
  });

  it.each<[string]>([['ProgressBar'], ['JumpButton']])(
    'click on regular %s goes to next resource with non-inherited external attributions only',
    async (ariaLabel: string) => {
      const resourceName1 = faker.opossum.resourceName();
      const resourceId1 = faker.opossum.filePath(resourceName1);
      const resourceName2 = faker.opossum.resourceName();
      const resourceId2 = faker.opossum.filePath(resourceName2);
      const { store } = renderComponent(
        <ProgressBarWithButtons
          showCriticalSignals={false}
          progressBarWithButtonsData={{
            count: {
              files: 6,
              filesWithHighlyCriticalExternalAttributions: 1,
              filesWithMediumCriticalExternalAttributions: 1,
              filesWithManualAttribution: 3,
              filesWithOnlyExternalAttribution: 1,
              filesWithOnlyPreSelectedAttribution: 1,
            },
            resources: {
              withMediumCriticalExternalAttributions: [],
              withNonInheritedExternalAttributionOnly: [
                resourceId1,
                resourceId2,
              ],
              withHighlyCriticalExternalAttributions: [],
            },
          }}
          onSwitchClick={() => {}}
        />,
        { actions: [setResources({ [resourceName1]: 1, [resourceName2]: 1 })] },
      );

      await userEvent.click(screen.getByLabelText(ariaLabel), {
        advanceTimers: jest.runOnlyPendingTimersAsync,
      });

      expect(getSelectedResourceId(store.getState())).toBe(resourceId1);

      await userEvent.click(screen.getByLabelText(ariaLabel), {
        advanceTimers: jest.runOnlyPendingTimersAsync,
      });

      expect(getSelectedResourceId(store.getState())).toBe(resourceId2);

      await userEvent.click(screen.getByLabelText(ariaLabel), {
        advanceTimers: jest.runOnlyPendingTimersAsync,
      });

      expect(getSelectedResourceId(store.getState())).toBe(resourceId1);
    },
  );

  it('renders criticality progress bar', async () => {
    renderComponent(
      <ProgressBarWithButtons
        showCriticalSignals
        progressBarWithButtonsData={{
          count: {
            files: 6,
            filesWithHighlyCriticalExternalAttributions: 1,
            filesWithMediumCriticalExternalAttributions: 1,
            filesWithManualAttribution: 1,
            filesWithOnlyExternalAttribution: 3,
            filesWithOnlyPreSelectedAttribution: 1,
          },
          resources: {
            withMediumCriticalExternalAttributions: [],
            withNonInheritedExternalAttributionOnly: [],
            withHighlyCriticalExternalAttributions: [],
          },
        }}
        onSwitchClick={() => {}}
      />,
    );

    await userEvent.hover(screen.getByLabelText('ProgressBar'), {
      advanceTimers: jest.runOnlyPendingTimersAsync,
    });

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

  it.each<[string]>([['ProgressBar'], ['JumpButton']])(
    'click on criticality %s goes to next resource with a critical attribution',
    async (ariaLabel: string) => {
      const resourceName1 = faker.opossum.resourceName();
      const resourceId1 = faker.opossum.filePath(resourceName1);
      const resourceName2 = faker.opossum.resourceName();
      const resourceId2 = faker.opossum.filePath(resourceName2);
      const { store } = renderComponent(
        <ProgressBarWithButtons
          showCriticalSignals
          progressBarWithButtonsData={{
            count: {
              files: 6,
              filesWithHighlyCriticalExternalAttributions: 1,
              filesWithMediumCriticalExternalAttributions: 1,
              filesWithManualAttribution: 1,
              filesWithOnlyExternalAttribution: 3,
              filesWithOnlyPreSelectedAttribution: 1,
            },
            resources: {
              withMediumCriticalExternalAttributions: [resourceId1],
              withNonInheritedExternalAttributionOnly: [],
              withHighlyCriticalExternalAttributions: [resourceId2],
            },
          }}
          onSwitchClick={() => {}}
        />,
        { actions: [setResources({ [resourceName1]: 1, [resourceName2]: 1 })] },
      );

      await userEvent.click(screen.getByLabelText(ariaLabel), {
        advanceTimers: jest.runOnlyPendingTimersAsync,
      });

      expect(getSelectedResourceId(store.getState())).toBe(resourceId1);

      await userEvent.click(screen.getByLabelText(ariaLabel), {
        advanceTimers: jest.runOnlyPendingTimersAsync,
      });

      expect(getSelectedResourceId(store.getState())).toBe(resourceId2);

      await userEvent.click(screen.getByLabelText(ariaLabel), {
        advanceTimers: jest.runOnlyPendingTimersAsync,
      });

      expect(getSelectedResourceId(store.getState())).toBe(resourceId1);
    },
  );
});
