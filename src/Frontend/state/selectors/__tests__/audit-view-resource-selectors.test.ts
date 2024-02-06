// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  Attributions,
  DiscreteConfidence,
  PackageInfo,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { PackagePanelTitle } from '../../../enums/enums';
import {
  ADD_NEW_ATTRIBUTION_BUTTON_ID,
  EMPTY_DISPLAY_PACKAGE_INFO,
} from '../../../shared-constants';
import {
  getAttributionsToResources,
  getParsedInputFileEnrichedWithTestData,
} from '../../../test-helpers/general-test-helpers';
import { PanelPackage } from '../../../types/types';
import { setManualData } from '../../actions/resource-actions/all-views-simple-actions';
import {
  setDisplayedPackage,
  setResolvedExternalAttributions,
  setSelectedResourceId,
} from '../../actions/resource-actions/audit-view-simple-actions';
import { loadFromFile } from '../../actions/resource-actions/load-actions';
import { createAppStore } from '../../configure-store';
import {
  getAttributionIdOfDisplayedPackageInManualPanel,
  getManualDisplayPackageInfoOfSelected,
} from '../all-views-resource-selectors';
import {
  getAttributionIdsOfSelectedResource,
  getAttributionsOfSelectedResourceOrClosestParent,
  getResolvedExternalAttributions,
} from '../audit-view-resource-selectors';

describe('The audit view resource selectors', () => {
  const testManualAttributionUuid_1 = '4d9f0b16-fbff-11ea-adc1-0242ac120002';
  const testManualAttributionUuid_2 = 'b5da73d4-f400-11ea-adc1-0242ac120002';
  const testTemporaryDisplayPackageInfo: PackageInfo = {
    attributionConfidence: DiscreteConfidence.High,
    packageVersion: '1.0',
    packageName: 'test Package',
    licenseText: ' test License text',
    id: testManualAttributionUuid_1,
  };
  const secondTestTemporaryDisplayPackageInfo: PackageInfo = {
    packageVersion: '2.0',
    packageName: 'not assigned test Package',
    licenseText: ' test not assigned License text',
    id: testManualAttributionUuid_2,
  };
  const testManualAttributions: Attributions = {
    [testManualAttributionUuid_1]: testTemporaryDisplayPackageInfo,
    [testManualAttributionUuid_2]: secondTestTemporaryDisplayPackageInfo,
  };
  const testResourcesToManualAttributions: ResourcesToAttributions = {
    '/root/src/something.js': [testManualAttributionUuid_1],
  };
  const testAttributionsToResources = getAttributionsToResources(
    testResourcesToManualAttributions,
  );

  it('sets Attributions and getsAttribution for a ResourceId', () => {
    const testStore = createAppStore();
    const expectedDisplayPackageInfo: PackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      packageVersion: '1.0',
      packageName: 'test Package',
      licenseText: ' test License text',
      id: testManualAttributionUuid_1,
    };
    expect(
      getManualDisplayPackageInfoOfSelected(testStore.getState()),
    ).toBeNull();

    testStore.dispatch(
      setManualData(
        testManualAttributions,
        testResourcesToManualAttributions,
        testAttributionsToResources,
      ),
    );
    testStore.dispatch(setSelectedResourceId('/root/src/something.js'));
    expect(getManualDisplayPackageInfoOfSelected(testStore.getState())).toEqual(
      expectedDisplayPackageInfo,
    );
  });

  it('gets attributions and attribution ids for the selected resource', () => {
    const testStore = createAppStore();
    const reactPackage: PackageInfo = { packageName: 'React', id: 'uuid1' };
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: { file: 1 },
          manualAttributions: {
            uuid1: reactPackage,
            uuid2: { packageName: 'Angular', id: 'uuid2' },
          },
          resourcesToManualAttributions: { '/file': ['uuid1'] },
        }),
      ),
    );

    testStore.dispatch(setSelectedResourceId('/file'));
    expect(getAttributionIdsOfSelectedResource(testStore.getState())).toEqual([
      'uuid1',
    ]);
    expect(
      getAttributionsOfSelectedResourceOrClosestParent(testStore.getState()),
    ).toEqual({
      uuid1: reactPackage,
    });
  });

  it('gets getAttributionIdOfDisplayedPackageInManualPanel', () => {
    const manualPackagesSelectedPackage: PanelPackage = {
      panel: PackagePanelTitle.ManualPackages,
      packageCardId: 'Attributions-0',
      displayPackageInfo: { packageName: 'React', id: 'uuid1' },
    };
    const manualPackagesDefaultSelectedPackage: PanelPackage = {
      panel: PackagePanelTitle.ManualPackages,
      packageCardId: ADD_NEW_ATTRIBUTION_BUTTON_ID,
      displayPackageInfo: EMPTY_DISPLAY_PACKAGE_INFO,
    };
    const containedSelectedPackage: PanelPackage = {
      panel: PackagePanelTitle.ContainedManualPackages,
      packageCardId: 'Signals in Folder Content-0',
      displayPackageInfo: { packageName: 'Vue', id: 'uuid2' },
    };

    const testStore = createAppStore();
    expect(
      getAttributionIdOfDisplayedPackageInManualPanel(testStore.getState()),
    ).toBeNull();

    testStore.dispatch(setDisplayedPackage(manualPackagesSelectedPackage));
    expect(
      getAttributionIdOfDisplayedPackageInManualPanel(testStore.getState()),
    ).toBe('uuid1');

    testStore.dispatch(
      setDisplayedPackage(manualPackagesDefaultSelectedPackage),
    );
    expect(
      getAttributionIdOfDisplayedPackageInManualPanel(testStore.getState()),
    ).toBeNull();

    testStore.dispatch(setDisplayedPackage(containedSelectedPackage));
    expect(
      getAttributionIdOfDisplayedPackageInManualPanel(testStore.getState()),
    ).toBeNull();
  });

  it('sets and gets resolvedExternalAttributions', () => {
    const testStore = createAppStore();
    const testResolvedExternalAttributions: Set<string> = new Set();
    testResolvedExternalAttributions
      .add('d3a753c0-5100-11eb-ae93-0242ac130002')
      .add('d3a7565e-5100-11eb-ae93-0242ac130002');

    expect(getResolvedExternalAttributions(testStore.getState())).toMatchObject(
      new Set(),
    );

    testStore.dispatch(
      setResolvedExternalAttributions(testResolvedExternalAttributions),
    );
    expect(getResolvedExternalAttributions(testStore.getState())).toMatchObject(
      testResolvedExternalAttributions,
    );
  });
});
