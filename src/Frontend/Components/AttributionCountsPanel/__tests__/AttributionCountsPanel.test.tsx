// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { screen } from '@testing-library/react';
import React from 'react';
import {
  Attributions,
  FollowUp,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { View } from '../../../enums/enums';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { navigateToView } from '../../../state/actions/view-actions/view-actions';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { AttributionCountsPanel } from '../AttributionCountsPanel';
import { act } from 'react-dom/test-utils';

describe('The Attribution Counts Panel', () => {
  const testManualUuid = 'a32f2f96-f40e-11ea-adc1-0242ac120002';
  const testOtherManualUuid = 'a32f2f96-f40e-11ea-adc1-0242ac120003';
  const testManualAttributions: Attributions = {
    [testManualUuid]: {
      attributionConfidence: 0,
      comment: 'Some comment',
      packageName: 'Test package',
      packageVersion: '1.0',
      copyright: 'Copyright John Doe',
      licenseText: 'Some license text',
      firstParty: true,
    },
    [testOtherManualUuid]: {
      attributionConfidence: 0,
      comment: 'Some other comment',
      packageName: '',
      packageVersion: '2.0',
      copyright: 'other Copyright John Doe',
      licenseText: 'Some other license text',
      followUp: FollowUp,
    },
  };
  const testResourcesToManualAttributions: ResourcesToAttributions = {
    'test resource': [testManualUuid],
    'test other resource': [testOtherManualUuid],
  };

  it('renders', () => {
    const { store } = renderComponentWithStore(<AttributionCountsPanel />);
    store.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: { ['test resource']: 1 },
          manualAttributions: testManualAttributions,
          resourcesToManualAttributions: testResourcesToManualAttributions,
        })
      )
    );
    act(() => {
      store.dispatch(navigateToView(View.Attribution));
    });
    expect(
      screen.getByText(/Attributions \(2 total, 0, 1, 0, 1, 1\)/, {
        exact: true,
      })
    );
  });
});
