// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  Attributions,
  DiscreteConfidence,
  DisplayPackageInfo,
  PackageInfo,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { createTestAppStore } from '../../../test-helpers/render-component-with-store';
import { PanelPackage } from '../../../types/types';
import { getDisplayPackageInfoOfSelected } from '../all-views-resource-selectors';
import { setManualData } from '../../actions/resource-actions/all-views-simple-actions';
import {
  setDisplayedPackage,
  setResolvedExternalAttributions,
  setSelectedResourceId,
} from '../../actions/resource-actions/audit-view-simple-actions';
import { loadFromFile } from '../../actions/resource-actions/load-actions';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import {
  getAttributionIdOfDisplayedPackageInManualPanel,
  getAttributionIdsOfSelectedResource,
  getAttributionsOfSelectedResourceOrClosestParent,
  getResolvedExternalAttributions,
} from '../audit-view-resource-selectors';
import { PackagePanelTitle } from '../../../enums/enums';
import { convertDisplayPackageInfoToPackageInfo } from '../../../util/convert-package-info';

describe('The audit view resource selectors', () => {
  const testManualAttributionUuid_1 = '4d9f0b16-fbff-11ea-adc1-0242ac120002';
  const testManualAttributionUuid_2 = 'b5da73d4-f400-11ea-adc1-0242ac120002';
  const testTemporaryPackageInfo: DisplayPackageInfo = {
    attributionConfidence: DiscreteConfidence.High,
    packageVersion: '1.0',
    packageName: 'test Package',
    licenseText: ' test License text',
    attributionIds: [testManualAttributionUuid_1],
  };
  const secondTestTemporaryPackageInfo: DisplayPackageInfo = {
    packageVersion: '2.0',
    packageName: 'not assigned test Package',
    licenseText: ' test not assigned License text',
    attributionIds: [testManualAttributionUuid_2],
  };
  const testManualAttributions: Attributions = {
    [testManualAttributionUuid_1]: convertDisplayPackageInfoToPackageInfo(
      testTemporaryPackageInfo
    ),
    [testManualAttributionUuid_2]: convertDisplayPackageInfoToPackageInfo(
      secondTestTemporaryPackageInfo
    ),
  };
  const testResourcesToManualAttributions: ResourcesToAttributions = {
    '/root/src/something.js': [testManualAttributionUuid_1],
  };

  it('sets Attributions and getsAttribution for a ResourceId', () => {
    const testStore = createTestAppStore();
    const expectedDisplayPackageInfo: DisplayPackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      packageVersion: '1.0',
      packageName: 'test Package',
      licenseText: ' test License text',
      attributionIds: [testManualAttributionUuid_1],
    };
    expect(getDisplayPackageInfoOfSelected(testStore.getState())).toBeNull();

    testStore.dispatch(
      setManualData(testManualAttributions, testResourcesToManualAttributions)
    );
    testStore.dispatch(setSelectedResourceId('/root/src/something.js'));
    expect(getDisplayPackageInfoOfSelected(testStore.getState())).toEqual(
      expectedDisplayPackageInfo
    );
  });

  it('gets attributions and attribution ids for the selected resource', () => {
    const testStore = createTestAppStore();
    const reactPackage: PackageInfo = { packageName: 'React' };
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: { file: 1 },
          manualAttributions: {
            uuid1: reactPackage,
            uuid2: { packageName: 'Angular' },
          },
          resourcesToManualAttributions: { '/file': ['uuid1'] },
        })
      )
    );

    testStore.dispatch(setSelectedResourceId('/file'));
    expect(getAttributionIdsOfSelectedResource(testStore.getState())).toEqual([
      'uuid1',
    ]);
    expect(
      getAttributionsOfSelectedResourceOrClosestParent(testStore.getState())
    ).toEqual({
      uuid1: reactPackage,
    });
  });

  it('gets getSelectedPackageAttributionIdIfManualPackagePanel', () => {
    const manualPackagesSelectedPackage: PanelPackage = {
      panel: PackagePanelTitle.ManualPackages,
      attributionId: 'uuid1',
    };
    const manualPackagesDefaultSelectedPackage: PanelPackage = {
      panel: PackagePanelTitle.ManualPackages,
      attributionId: '',
    };
    const containedSelectedPackage: PanelPackage = {
      panel: PackagePanelTitle.ContainedManualPackages,
      attributionId: '',
    };

    const testStore = createTestAppStore();
    expect(
      getAttributionIdOfDisplayedPackageInManualPanel(testStore.getState())
    ).toBeNull();

    testStore.dispatch(setDisplayedPackage(manualPackagesSelectedPackage));
    expect(
      getAttributionIdOfDisplayedPackageInManualPanel(testStore.getState())
    ).toBe('uuid1');

    testStore.dispatch(
      setDisplayedPackage(manualPackagesDefaultSelectedPackage)
    );
    expect(
      getAttributionIdOfDisplayedPackageInManualPanel(testStore.getState())
    ).toBe('');

    testStore.dispatch(setDisplayedPackage(containedSelectedPackage));
    expect(
      getAttributionIdOfDisplayedPackageInManualPanel(testStore.getState())
    ).toBeNull();
  });

  it('sets and gets resolvedExternalAttributions', () => {
    const testStore = createTestAppStore();
    const testResolvedExternalAttributions: Set<string> = new Set();
    testResolvedExternalAttributions
      .add('d3a753c0-5100-11eb-ae93-0242ac130002')
      .add('d3a7565e-5100-11eb-ae93-0242ac130002');

    expect(getResolvedExternalAttributions(testStore.getState())).toMatchObject(
      new Set()
    );

    testStore.dispatch(
      setResolvedExternalAttributions(testResolvedExternalAttributions)
    );
    expect(getResolvedExternalAttributions(testStore.getState())).toMatchObject(
      testResolvedExternalAttributions
    );
  });
});
