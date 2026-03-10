// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Criticality } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import {
  initializeDbWithTestData,
  pathsToResources,
} from '../../../../testing/global-test-helpers';
import { setConfig } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { getSelectedResourceId } from '../../../state/selectors/resource-selectors';
import { renderComponent } from '../../../test-helpers/render';
import { setDatabaseInitialized } from '../../../util/backendClient';
import { ProgressBar } from '../ProgressBar';

async function clickOnAttributionProgressBar() {
  await userEvent.click(
    screen.getByLabelText(
      text.topBar.switchableProgressBar.attributionBar.ariaLabel,
    ),
    {
      advanceTimers: vi.runOnlyPendingTimersAsync,
    },
  );
}

async function hoverOverAttributionProgressBar() {
  await userEvent.hover(
    screen.getByLabelText(
      text.topBar.switchableProgressBar.attributionBar.ariaLabel,
    ),
    {
      advanceTimers: vi.runOnlyPendingTimersAsync,
    },
  );
}

async function hoverOverCriticalityProgressBar() {
  await userEvent.hover(
    screen.getByLabelText(
      text.topBar.switchableProgressBar.criticalityBar.ariaLabel,
    ),
    {
      advanceTimers: vi.runOnlyPendingTimersAsync,
    },
  );
}

async function hoverOverClassificationProgressBar() {
  await userEvent.hover(
    screen.getByLabelText(
      text.topBar.switchableProgressBar.classificationBar.ariaLabel,
    ),
    {
      advanceTimers: vi.runOnlyPendingTimersAsync,
    },
  );
}

async function clickOnCriticalityProgressBar() {
  await userEvent.click(
    screen.getByLabelText(
      text.topBar.switchableProgressBar.criticalityBar.ariaLabel,
    ),
    {
      advanceTimers: vi.runOnlyPendingTimersAsync,
    },
  );
}

async function clickOnClassificationProgressBar() {
  await userEvent.click(
    screen.getByLabelText(
      text.topBar.switchableProgressBar.classificationBar.ariaLabel,
    ),
    {
      advanceTimers: vi.runOnlyPendingTimersAsync,
    },
  );
}

describe('ProgressBar', () => {
  beforeEach(async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await initializeDbWithTestData({
      resources: pathsToResources(['/a', '/b']),
      config: {
        classifications: {
          1: 'Low',
          2: 'High',
        },
      },
      externalAttributions: {
        attributions: {
          high: {
            id: 'high',
            criticality: Criticality.High,
            classification: 1,
          },
          medium: {
            id: 'medium',
            criticality: Criticality.Medium,
            classification: 2,
          },
        },
        resourcesToAttributions: {
          '/a': ['high'],
          '/b': ['medium'],
        },
        attributionsToResources: {
          high: ['/a'],
          medium: ['/b'],
        },
      },
    });
    setDatabaseInitialized(true);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('click on regular progress bar goes to next resource with non-inherited external attributions', async () => {
    const { store } = await renderComponent(
      <ProgressBar selectedProgressBar={'attribution'} />,
    );
    // check that the text is right when hovering over the progress bar
    await hoverOverAttributionProgressBar();
    expect(await screen.findByText(/Number of files/)).toBeInTheDocument();
    expect(screen.getByText(/with only signals: 2/)).toBeInTheDocument();
    // check that the clicks work
    expect(getSelectedResourceId(store.getState())).toBe('/');
    await clickOnAttributionProgressBar();
    expect(getSelectedResourceId(store.getState())).toBe('/a');
    await clickOnAttributionProgressBar();
    expect(getSelectedResourceId(store.getState())).toBe('/b');
  });

  it('click on criticality progress bar goes to highly critical resource', async () => {
    const { store } = await renderComponent(
      <ProgressBar selectedProgressBar={'criticality'} />,
    );
    // check that the text is right when hovering over the progress bar
    await hoverOverCriticalityProgressBar();
    expect(
      await screen.findByText(/containing highly critical signals: 1/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/containing medium critical signals: 1/),
    ).toBeInTheDocument();

    // check that the clicks work
    expect(getSelectedResourceId(store.getState())).toBe('/');
    await clickOnCriticalityProgressBar();
    expect(getSelectedResourceId(store.getState())).toBe('/a');
    await clickOnCriticalityProgressBar();
    expect(getSelectedResourceId(store.getState())).toBe('/a');
  });

  it('click on classification progress bar goes to highest classified resource', async () => {
    const { store } = await renderComponent(
      <ProgressBar selectedProgressBar={'classification'} />,
      {
        actions: [
          setConfig({
            classifications: {
              1: { description: 'Low', color: '#aaffaa' },
              2: { description: 'High', color: '#ffaaaa' },
            },
          }),
        ],
      },
    );
    // check that the text is right when hovering over the progress bar
    await hoverOverClassificationProgressBar();
    expect(
      await screen.findByText(/containing classification "high": 1/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/containing classification "low": 1/),
    ).toBeInTheDocument();

    // check that the clicks work
    expect(getSelectedResourceId(store.getState())).toBe('/');
    await clickOnClassificationProgressBar();
    expect(getSelectedResourceId(store.getState())).toBe('/b');
    await clickOnClassificationProgressBar();
    expect(getSelectedResourceId(store.getState())).toBe('/b');
  });
});
