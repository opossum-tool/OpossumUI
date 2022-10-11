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
        })
      )
    );

    renderComponentWithStore(<ProjectStatisticsPopup />, { store });
    expect(screen.getByText('Apache License Version 2.0')).toBeInTheDocument();
    expect(screen.getByText('The MIT License (MIT)')).toBeInTheDocument();
    expect(screen.getByText('Scancode')).toBeInTheDocument();
    expect(screen.getByText('Reuser')).toBeInTheDocument();
  });

  it('renders the Most Frequent Licenses pie chart when there are attributions', () => {
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
        })
      )
    );

    renderComponentWithStore(<ProjectStatisticsPopup />, { store });
    expect(screen.getByText('Most Frequent Licenses')).toBeInTheDocument();
  });

  it('does not render the Most Frequent Licenses pie chart when there is no attribution', () => {
    const store = createTestAppStore();
    const testExternalAttributions: Attributions = {};
    store.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          externalAttributions: testExternalAttributions,
        })
      )
    );

    renderComponentWithStore(<ProjectStatisticsPopup />, { store });
    expect(
      screen.queryByText('Most Frequent Licenses')
    ).not.toBeInTheDocument();
  });

  it('renders the Critical Signals pie chart when there are attributions', () => {
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
        })
      )
    );

    renderComponentWithStore(<ProjectStatisticsPopup />, { store });
    expect(screen.getByText('Critical Signals')).toBeInTheDocument();
  });

  it('does not render the Critical Signals pie chart when there are no attributions', () => {
    const store = createTestAppStore();
    const testExternalAttributions: Attributions = {};
    store.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          externalAttributions: testExternalAttributions,
        })
      )
    );

    renderComponentWithStore(<ProjectStatisticsPopup />, { store });
    expect(screen.queryByText('Critical Signals')).not.toBeInTheDocument();
  });

  it('renders when there are no attributions', () => {
    const store = createTestAppStore();
    const testExternalAttributions: Attributions = {};
    store.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          externalAttributions: testExternalAttributions,
        })
      )
    );

    renderComponentWithStore(<ProjectStatisticsPopup />, { store });
    expect(screen.getAllByText('License name')).toHaveLength(2);
    expect(screen.getAllByText('Total')).toHaveLength(3);
    expect(screen.getByText('Follow up')).toBeInTheDocument();
    expect(screen.getByText('First party')).toBeInTheDocument();
  });
});
