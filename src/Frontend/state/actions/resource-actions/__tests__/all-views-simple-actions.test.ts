// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  Criticality,
  type PackageInfo,
} from '../../../../../shared/shared-types';
import { faker } from '../../../../../testing/Faker';
import { createAppStore } from '../../../configure-store';
import { initialResourceState } from '../../../reducers/resource-reducer';
import { getTemporaryDisplayPackageInfo } from '../../../selectors/resource-selectors';
import {
  resetResourceState,
  setTemporaryDisplayPackageInfo,
} from '../all-views-simple-actions';
import { setSelectedResourceId } from '../audit-view-simple-actions';

const testManualAttributionUuid_1 = '4d9f0b16-fbff-11ea-adc1-0242ac120002';

describe('The load and navigation simple actions', () => {
  it('resets the state', () => {
    const testStore = createAppStore();
    const testTemporaryDisplayPackageInfo: PackageInfo = {
      packageVersion: '1.1',
      packageName: 'test Package',
      licenseText: ' test License text',
      criticality: Criticality.None,
      id: testManualAttributionUuid_1,
    };
    testStore.dispatch(setSelectedResourceId('/root/src/something.js'));
    testStore.dispatch(
      setTemporaryDisplayPackageInfo(testTemporaryDisplayPackageInfo),
    );

    testStore.dispatch(resetResourceState());

    expect(testStore.getState().resourceState).toMatchObject(
      initialResourceState,
    );
  });

  it('sets and gets temporaryDisplayPackageInfo', () => {
    const testDisplayPackageInfo: PackageInfo = {
      packageName: 'test',
      packageVersion: '1.0',
      licenseText: 'License Text',
      criticality: Criticality.None,
      id: faker.string.uuid(),
    };
    const testStore = createAppStore();
    testStore.dispatch(setTemporaryDisplayPackageInfo(testDisplayPackageInfo));
    expect(getTemporaryDisplayPackageInfo(testStore.getState())).toMatchObject(
      testDisplayPackageInfo,
    );
  });
});
