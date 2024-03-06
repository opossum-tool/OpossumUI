// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Attributions, PackageInfo } from '../../../../../shared/shared-types';
import { faker } from '../../../../../testing/Faker';
import { View } from '../../../../enums/enums';
import { getParsedInputFileEnrichedWithTestData } from '../../../../test-helpers/general-test-helpers';
import { createAppStore } from '../../../configure-store';
import {
  getExpandedIds,
  getSelectedAttributionId,
  getSelectedResourceId,
  getTargetSelectedAttributionId,
  getTargetSelectedResourceId,
  getTemporaryDisplayPackageInfo,
} from '../../../selectors/resource-selectors';
import { getSelectedView } from '../../../selectors/view-selector';
import { navigateToView, setTargetView } from '../../view-actions/view-actions';
import { setTemporaryDisplayPackageInfo } from '../all-views-simple-actions';
import {
  setSelectedAttributionId,
  setSelectedResourceId,
  setTargetSelectedAttributionId,
  setTargetSelectedResourceId,
} from '../audit-view-simple-actions';
import { loadFromFile } from '../load-actions';
import {
  openResourceInResourceBrowser,
  resetTemporaryDisplayPackageInfo,
  setSelectedResourceOrAttributionIdToTargetValue,
} from '../navigation-actions';

describe('resetTemporaryDisplayPackageInfo', () => {
  it('works correctly', () => {
    const testReact: PackageInfo = {
      packageName: 'React',
      id: 'uuid1',
    };
    const testManualAttributions: Attributions = {
      uuid1: testReact,
    };
    const initialTemporaryDisplayPackageInfo: PackageInfo = {
      packageName: 'Vue',
      id: faker.string.uuid(),
    };

    const testStore = createAppStore();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          manualAttributions: testManualAttributions,
        }),
      ),
    );
    testStore.dispatch(navigateToView(View.Audit));
    testStore.dispatch(setSelectedAttributionId('uuid1'));
    testStore.dispatch(
      setTemporaryDisplayPackageInfo(initialTemporaryDisplayPackageInfo),
    );
    expect(getTemporaryDisplayPackageInfo(testStore.getState())).toEqual(
      initialTemporaryDisplayPackageInfo,
    );

    testStore.dispatch(resetTemporaryDisplayPackageInfo());
    expect(getTemporaryDisplayPackageInfo(testStore.getState())).toEqual(
      testReact,
    );
  });
});

describe('setSelectedResourceOrAttributionIdToTargetValue', () => {
  it('sets target selected resource ID', () => {
    const testStore = createAppStore();
    testStore.dispatch(navigateToView(View.Audit));
    testStore.dispatch(setTargetView(View.Report));
    testStore.dispatch(setSelectedResourceId('previousResourceId'));
    testStore.dispatch(setTargetSelectedResourceId('newResourceId'));

    testStore.dispatch(setSelectedResourceOrAttributionIdToTargetValue());

    const state = testStore.getState();
    expect(getSelectedView(state)).toBe(View.Audit);
    expect(getSelectedResourceId(state)).toBe('newResourceId');
    expect(getTargetSelectedResourceId(state)).toBeNull();
  });

  it('sets target selected attribution ID', () => {
    const testStore = createAppStore();
    testStore.dispatch(navigateToView(View.Audit));
    testStore.dispatch(setTargetView(View.Audit));
    testStore.dispatch(setSelectedAttributionId('previousAttributionId'));
    testStore.dispatch(setTargetSelectedAttributionId('newAttributionId'));

    testStore.dispatch(setSelectedResourceOrAttributionIdToTargetValue());

    const state = testStore.getState();
    expect(getSelectedView(state)).toBe(View.Audit);
    expect(getSelectedAttributionId(state)).toBe('newAttributionId');
    expect(getTargetSelectedAttributionId(state)).toBeNull();
  });
});

describe('setSelectedResourceIdAndExpand', () => {
  it('sets the selectedResourceId', () => {
    const testStore = createAppStore();
    testStore.dispatch(openResourceInResourceBrowser('/folder1/folder2/test'));
    const state = testStore.getState();
    expect(getSelectedResourceId(state)).toBe('/folder1/folder2/test');
  });

  it('sets the expandedIds', () => {
    const testStore = createAppStore();
    testStore.dispatch(openResourceInResourceBrowser('/folder1/folder2/test'));
    const state = testStore.getState();
    expect(getExpandedIds(state)).toMatchObject([
      '/',
      '/folder1/',
      '/folder1/folder2/',
      '/folder1/folder2/test',
    ]);
  });
});
