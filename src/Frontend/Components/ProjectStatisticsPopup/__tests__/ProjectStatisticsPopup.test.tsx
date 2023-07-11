// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  createTestAppStore,
  renderComponentWithStore,
} from '../../../test-helpers/render-component-with-store';
import React from 'react';
import { ProjectStatisticsPopup } from '../ProjectStatisticsPopup';
import { Attributions } from '../../../../shared/shared-types';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { screen } from '@testing-library/react';
import { mockResizeObserver } from '../../../test-helpers/popup-test-helpers';

mockResizeObserver();

describe('The ProjectStatisticsPopup', () => {
  it('displays license names and source names', () => {
    const store = createTestAppStore();
    const testExternalAttributions: Attributions = {
      uuid_1: {
        source: {
          name: 'scancode',
          documentConfidence: 10,
        },
        licenseName: 'Apache License Version 2.0',
      },
      uuid_2: {
        source: {
          name: 'reuser',
          documentConfidence: 90,
        },
        licenseName: 'The MIT License (MIT)',
      },
    };
    store.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          externalAttributions: testExternalAttributions,
        }),
      ),
    );

    renderComponentWithStore(<ProjectStatisticsPopup />, { store });
    expect(screen.getByText('Apache License Version 2.0')).toBeInTheDocument();
    expect(screen.getByText('The MIT License (MIT)')).toBeInTheDocument();
    expect(screen.getByText('Scancode')).toBeInTheDocument();
    expect(screen.getByText('Reuser')).toBeInTheDocument();
  });

  it('renders pie charts when there are attributions', () => {
    const store = createTestAppStore();
    const testManualAttributions: Attributions = {
      uuid_1: {
        source: {
          name: 'scancode',
          documentConfidence: 10,
        },
        licenseName: 'Apache License Version 2.0',
      },
      uuid_2: {
        source: {
          name: 'reuser',
          documentConfidence: 90,
        },
        licenseName: 'The MIT License (MIT)',
      },
    };
    const testExternalAttributions: Attributions = {
      uuid_3: {
        source: {
          name: 'scancode',
          documentConfidence: 90,
        },
        licenseName: 'Apache License Version 3.0',
      },
      uuid_2: {
        source: {
          name: 'reuser',
          documentConfidence: 90,
        },
        licenseName: 'The MIT License (MIT)',
      },
    };

    store.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          manualAttributions: testManualAttributions,
          externalAttributions: testExternalAttributions,
        }),
      ),
    );

    renderComponentWithStore(<ProjectStatisticsPopup />, { store });
    expect(screen.getByText('Most Frequent Licenses')).toBeInTheDocument();
    expect(screen.getByText('Critical Signals')).toBeInTheDocument();
    expect(screen.getAllByText('Incomplete Attributions')).toHaveLength(2);
  });

  it('does not render pie charts when there are no attributions', () => {
    const store = createTestAppStore();
    const testExternalAttributions: Attributions = {};
    store.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          externalAttributions: testExternalAttributions,
        }),
      ),
    );

    renderComponentWithStore(<ProjectStatisticsPopup />, { store });
    expect(
      screen.queryByText('Most Frequent Licenses'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Critical Signals')).not.toBeInTheDocument();
    expect(screen.getByText('Incomplete Attributions')).toBeInTheDocument();
    expect(screen.getAllByText('Incomplete Attributions')).not.toHaveLength(2);
  });

  it('renders pie charts pie charts related to signals even if there are no attributions', () => {
    const store = createTestAppStore();
    const testManualAttributions: Attributions = {};
    const testExternalAttributions: Attributions = {
      uuid_1: {
        source: {
          name: 'scancode',
          documentConfidence: 10,
        },
        licenseName: 'Apache License Version 2.0',
      },
      uuid_2: {
        source: {
          name: 'reuser',
          documentConfidence: 90,
        },
        licenseName: 'The MIT License (MIT)',
      },
    };
    store.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          manualAttributions: testManualAttributions,
          externalAttributions: testExternalAttributions,
        }),
      ),
    );

    renderComponentWithStore(<ProjectStatisticsPopup />, { store });
    expect(screen.getByText('Most Frequent Licenses')).toBeInTheDocument();
    expect(screen.getByText('Critical Signals')).toBeInTheDocument();
    expect(screen.getByText('Incomplete Attributions')).toBeInTheDocument();
    expect(screen.getAllByText('Incomplete Attributions')).not.toHaveLength(2);
  });

  it('renders tables when there are no attributions', () => {
    const store = createTestAppStore();
    const testExternalAttributions: Attributions = {};
    store.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          externalAttributions: testExternalAttributions,
        }),
      ),
    );

    renderComponentWithStore(<ProjectStatisticsPopup />, { store });
    expect(screen.getAllByText('License name')).toHaveLength(2);
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    expect(screen.getAllByText('Total')).toHaveLength(3);
    expect(screen.getByText('Follow up')).toBeInTheDocument();
    expect(screen.getByText('First party')).toBeInTheDocument();
  });
});
