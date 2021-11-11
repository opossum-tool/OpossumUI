// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { screen } from '@testing-library/react';
import React from 'react';
import {
  AttributionIdWithCount,
  Attributions,
} from '../../../../shared/shared-types';
import { PackagePanelTitle } from '../../../enums/enums';
import {
  createTestAppStore,
  renderComponentWithStore,
} from '../../../test-helpers/render-component-with-store';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { AggregatedAttributionsPanel } from '../AggregatedAttributionsPanel';
import { PanelData } from '../../ResourceDetailsTabs/resource-details-tabs-helpers';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { expectPackageInPackagePanel } from '../../../test-helpers/package-panel-helpers';

describe('The AggregatedAttributionsPanel', () => {
  test('renders', () => {
    const testManualAttributions: Attributions = {
      uuid1: {
        packageName: 'React',
        packageVersion: '16.5.0',
      },
      uuid2: {
        packageName: 'JQuery',
      },
      uuid3: {
        packageVersion: '16',
      },
    };
    const testManualAttributionIds: Array<AttributionIdWithCount> = [
      { attributionId: 'uuid1' },
      { attributionId: 'uuid2' },
      { attributionId: 'uuid3' },
    ];
    const testExternalAttributions: Attributions = {
      uuid1: {
        packageName: 'React',
        packageVersion: '17.0.0',
      },
    };
    const testExternalAttributionIds: Array<AttributionIdWithCount> = [
      { attributionId: 'uuid1' },
    ];
    const testPanelPackages: Array<PanelData> = [
      {
        title: PackagePanelTitle.ContainedManualPackages,
        attributionIdsWithCount: testManualAttributionIds,
        attributions: testManualAttributions,
      },
      {
        title: PackagePanelTitle.ContainedExternalPackages,
        attributionIdsWithCount: testExternalAttributionIds,
        attributions: testExternalAttributions,
      },
    ];
    const testStore = createTestAppStore();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          manualAttributions: testManualAttributions,
          externalAttributions: testExternalAttributions,
        })
      )
    );
    renderComponentWithStore(
      <AggregatedAttributionsPanel
        panelData={testPanelPackages}
        isAddToPackageEnabled={true}
      />,
      { store: testStore }
    );

    expectPackageInPackagePanel(
      screen,
      'React, 16.5.0',
      'Attributions in Folder Content'
    );
    expectPackageInPackagePanel(
      screen,
      'JQuery',
      'Attributions in Folder Content'
    );
    expectPackageInPackagePanel(
      screen,
      'React, 17.0.0',
      'Signals in Folder Content'
    );
  });
});
