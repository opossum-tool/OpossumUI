// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import React from 'react';
import { ResourceDetailsTabs } from '../ResourceDetailsTabs';
import {
  Attributions,
  Resources,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import {
  clickOnTab,
  getParsedInputFileEnrichedWithTestData,
} from '../../../test-helpers/test-helpers';
import { act, screen } from '@testing-library/react';
import { setSelectedResourceId } from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';

describe('The ResourceDetailsTabs', () => {
  test('switches between tabs', () => {
    const testResources: Resources = {
      fileWithoutAttribution: 1,
    };
    const manualAttributions: Attributions = {
      uuid_1: { packageName: 'jQuery' },
    };

    const { store } = renderComponentWithStore(
      <ResourceDetailsTabs
        isAllAttributionsTabEnabled={true}
        isAddToPackageEnabled={true}
      />
    );
    store.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: manualAttributions,
        })
      )
    );

    act(() => {
      store.dispatch(setSelectedResourceId('/fileWithoutAttribution'));
    });
    expect(screen.getByText('Signals'));

    clickOnTab(screen, 'All Attributions Tab');
    expect(screen.queryByText('Signals')).toBeFalsy();

    clickOnTab(screen, 'Signals & Content Tab');
    expect(screen.getByText('Signals'));
  });

  test('has All Attributions Tab disabled when no addable attribution is present', () => {
    const testResources: Resources = {
      fileWithAttribution: 1,
    };
    const manualAttributions: Attributions = {
      uuid_1: { packageName: 'jQuery', packageVersion: '16.2.0' },
    };
    const resourcesToManualAttributions: ResourcesToAttributions = {
      '/fileWithAttribution': ['uuid_1'],
    };

    const { store } = renderComponentWithStore(
      <ResourceDetailsTabs
        isAllAttributionsTabEnabled={true}
        isAddToPackageEnabled={true}
      />
    );
    store.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: manualAttributions,
          resourcesToManualAttributions: resourcesToManualAttributions,
        })
      )
    );

    act(() => {
      store.dispatch(setSelectedResourceId('/fileWithAttribution'));
    });
    expect(screen.getByText('Signals'));

    clickOnTab(screen, 'All Attributions Tab');
    expect(screen.getByText('Signals'));
  });
});
