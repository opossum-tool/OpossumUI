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
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { PackagePanel } from '../PackagePanel';
import { getByText } from '@testing-library/dom';
import { setExternalAttributionSources } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { ATTRIBUTION_SOURCES } from '../../../../shared/shared-constants';

describe('The PackagePanel', () => {
  test('renders TextBoxes with right content', () => {
    const testSource = { name: 'HC', documentConfidence: 1 };
    const testAttributionIds: Array<AttributionIdWithCount> = [
      { attributionId: 'uuid1' },
      { attributionId: 'uuid2' },
      { attributionId: 'uuid3' },
    ];
    const testAttributions: Attributions = {
      uuid1: {
        source: testSource,
        packageName: 'React',
        packageVersion: '16.5.0',
      },
      uuid2: {
        source: testSource,
        packageName: 'JQuery',
      },
      uuid3: { source: testSource },
    };
    renderComponentWithStore(
      <PackagePanel
        attributionIdsWithCount={testAttributionIds}
        attributions={testAttributions}
        title={PackagePanelTitle.ContainedExternalPackages}
        isAddToPackageEnabled={true}
      />
    );

    expect(screen.getByText('React, 16.5.0'));
    expect(screen.getByText('JQuery'));
    expect(screen.getAllByLabelText('show resources'));
  });
  test('groups by source and prettifies known sources', () => {
    const testAttributionIds: Array<AttributionIdWithCount> = [
      { attributionId: 'uuid1' },
      { attributionId: 'uuid2' },
      { attributionId: 'uuid3' },
    ];
    const testAttributions: Attributions = {
      uuid1: {
        source: { name: 'other', documentConfidence: 1 },
        packageName: 'React',
        packageVersion: '16.5.0',
      },
      uuid2: {
        source: { name: 'SC', documentConfidence: 1 },
        packageName: 'JQuery',
      },
      uuid3: {
        packageName: 'JQuery 2',
      },
    };
    const { store } = renderComponentWithStore(
      <PackagePanel
        attributionIdsWithCount={testAttributionIds}
        attributions={testAttributions}
        title={PackagePanelTitle.ContainedExternalPackages}
        isAddToPackageEnabled={true}
      />
    );
    store.dispatch(setExternalAttributionSources(ATTRIBUTION_SOURCES));

    const hhcPanel = screen.getByText('ScanCode').parentElement as HTMLElement;
    expect(getByText(hhcPanel, 'JQuery'));

    const highComputePanel = screen.getByText('other')
      .parentElement as HTMLElement;
    expect(getByText(highComputePanel, 'React, 16.5.0'));

    expect(screen.getByText('JQuery 2'));
  });
});
