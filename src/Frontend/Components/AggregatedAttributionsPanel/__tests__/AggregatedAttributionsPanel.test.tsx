// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { queryAllByText, screen } from '@testing-library/react';

import {
  Attributions,
  PackageInfo,
  Resources,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { setExternalAttributionsToHashes } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { setSelectedResourceId } from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import {
  getPackagePanel,
  getParsedInputFileEnrichedWithTestData,
} from '../../../test-helpers/general-test-helpers';
import {
  createTestAppStore,
  renderComponentWithStore,
} from '../../../test-helpers/render-component-with-store';
import { AggregatedAttributionsPanel } from '../AggregatedAttributionsPanel';

describe('The AggregatedAttributionsPanel', () => {
  it('shows merged identical signals in signals panel', () => {
    const testResources: Resources = {
      root: {},
    };
    const testExternalAttribution: PackageInfo = {
      packageName: 'jQuery',
      packageVersion: '16.0.0',
      comment: 'ManualPackage',
    };
    const testExternalAttributions: Attributions = {
      uuid_1: testExternalAttribution,
      uuid_2: testExternalAttribution,
    };
    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/root/': ['uuid_1', 'uuid_2'],
    };

    const testStore = createTestAppStore();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          externalAttributions: testExternalAttributions,
          resourcesToExternalAttributions: testResourcesToExternalAttributions,
        }),
      ),
    );
    testStore.dispatch(setSelectedResourceId('/root/'));
    testStore.dispatch(
      setExternalAttributionsToHashes({
        uuid_1: '1',
        uuid_2: '1',
      }),
    );

    renderComponentWithStore(
      <AggregatedAttributionsPanel isAddToPackageEnabled={true} />,
      { store: testStore },
    );

    const signalsPanel = getPackagePanel(screen, 'Signals');
    // eslint-disable-next-line testing-library/prefer-screen-queries
    expect(queryAllByText(signalsPanel, 'jQuery, 16.0.0')).toHaveLength(1);
  });

  it('does not merge signals without a hash in signals panel', () => {
    const testResources: Resources = {
      root: {},
    };
    const testExternalAttribution: PackageInfo = {
      packageName: 'jQuery',
      packageVersion: '16.0.0',
      comment: 'ManualPackage',
    };
    const testExternalAttributions: Attributions = {
      uuid_1: testExternalAttribution,
      uuid_2: testExternalAttribution,
    };
    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/root/': ['uuid_1', 'uuid_2'],
    };

    const testStore = createTestAppStore();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          externalAttributions: testExternalAttributions,
          resourcesToExternalAttributions: testResourcesToExternalAttributions,
        }),
      ),
    );
    testStore.dispatch(setSelectedResourceId('/root/'));
    testStore.dispatch(setExternalAttributionsToHashes({}));

    renderComponentWithStore(
      <AggregatedAttributionsPanel isAddToPackageEnabled={true} />,
      { store: testStore },
    );

    const packagesPanel = getPackagePanel(screen, 'Signals');
    // eslint-disable-next-line testing-library/prefer-screen-queries
    expect(queryAllByText(packagesPanel, 'jQuery, 16.0.0')).toHaveLength(2);
  });
});
