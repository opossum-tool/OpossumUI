// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker } from '../../../../testing/Faker';
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../../shared-constants';
import {
  setManualData,
  setTemporaryDisplayPackageInfo,
} from '../../actions/resource-actions/all-views-simple-actions';
import { setSelectedAttributionId } from '../../actions/resource-actions/audit-view-simple-actions';
import { createAppStore } from '../../configure-store';
import { getIsPackageInfoModified } from '../resource-selectors';

describe('wereTemporaryDisplayPackageInfoModified', () => {
  it('returns false when package info has not been modified on any relevant attributes', () => {
    const store = createAppStore();
    const packageInfo = faker.opossum.packageInfo();
    store.dispatch(
      setManualData(
        faker.opossum.attributions({ [packageInfo.id]: packageInfo }),
        {},
        {},
      ),
    );
    store.dispatch(setSelectedAttributionId(packageInfo.id));
    store.dispatch(
      setTemporaryDisplayPackageInfo({
        ...packageInfo,
        id: faker.string.uuid(),
      }),
    );

    expect(getIsPackageInfoModified(store.getState())).toBe(false);
  });

  it('returns true when package info has been modified', () => {
    const store = createAppStore();
    const packageInfo = faker.opossum.packageInfo();
    store.dispatch(
      setManualData(
        faker.opossum.attributions({ [packageInfo.id]: packageInfo }),
        {},
        {},
      ),
    );
    store.dispatch(setSelectedAttributionId(packageInfo.id));
    store.dispatch(
      setTemporaryDisplayPackageInfo({
        ...packageInfo,
        packageName: faker.string.sample(),
      }),
    );

    expect(getIsPackageInfoModified(store.getState())).toBe(true);
  });

  it('returns false when creating a new attribution and no data has been entered yet', () => {
    const testStore = createAppStore();
    testStore.dispatch(
      setTemporaryDisplayPackageInfo(EMPTY_DISPLAY_PACKAGE_INFO),
    );

    expect(getIsPackageInfoModified(testStore.getState())).toBe(false);
  });

  it('returns true when creating a new attribution and some data has been entered', () => {
    const testStore = createAppStore();
    testStore.dispatch(
      setTemporaryDisplayPackageInfo({
        ...EMPTY_DISPLAY_PACKAGE_INFO,
        packageName: faker.string.sample(),
      }),
    );

    expect(getIsPackageInfoModified(testStore.getState())).toBe(true);
  });
});
