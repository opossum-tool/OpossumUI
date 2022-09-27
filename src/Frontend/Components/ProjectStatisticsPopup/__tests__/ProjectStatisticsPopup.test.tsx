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

describe('The ProjectStatisticsPopup', () => {
  it('displays license names and source names', () => {
    const store = createTestAppStore();
    const testExternalAttributions: Attributions = {
      uuid_1: {
        source: {
          name: 'scancode',
          documentConfidence: 10,
        },
        licenseName: 'test-license-name',
      },
      uuid_2: {
        source: {
          name: 'reuser',
          documentConfidence: 90,
        },
        licenseName: 'test-license-name_1',
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
    expect(screen.getByText('test-license-name')).toBeInTheDocument();
    expect(screen.getByText('test-license-name_1')).toBeInTheDocument();
    expect(screen.getByText('scancode'.toUpperCase())).toBeInTheDocument();
    expect(screen.getByText('reuser'.toUpperCase())).toBeInTheDocument();
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
    expect(screen.getAllByText('LICENSE')).toHaveLength(2);
    expect(screen.getAllByText('TOTAL')).toHaveLength(2);
    expect(screen.getByText('Follow up')).toBeInTheDocument();
    expect(screen.getByText('First party')).toBeInTheDocument();
  });
});
