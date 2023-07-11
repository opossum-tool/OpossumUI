// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { DisplayPackageInfo, PackageInfo } from '../../../shared/shared-types';
import { getPackageInfoKeys } from '../../../shared/shared-util';
import {
  convertDisplayPackageInfoToPackageInfo,
  convertPackageInfoToDisplayPackageInfo,
} from '../convert-package-info';
import { getDisplayPackageInfoKeys } from '../get-display-package-info-keys';

describe('convertPackageInfoToDisplayPackageInfo', () => {
  it('yields correct results', () => {
    const testAttributionId = 'uuid_1';
    const testPackageInfo: PackageInfo = {
      packageName: 'React',
      comment: 'React comment',
    };
    const expectedDisplayPackageInfo: DisplayPackageInfo = {
      packageName: 'React',
      comments: ['React comment'],
      attributionIds: [testAttributionId],
    };
    const testDisplayPackageInfo = convertPackageInfoToDisplayPackageInfo(
      testPackageInfo,
      [testAttributionId],
    );
    expect(testDisplayPackageInfo).toEqual(expectedDisplayPackageInfo);
  });

  // This test ensures that newly added PackageInfo keys are considered when converting
  it('does not allow excess keys', () => {
    const testKeysOfPackageInfo = getPackageInfoKeys();
    const expectedKeysOfPackageInfo = [
      'attributionConfidence',
      'comment',
      'packageName',
      'packageVersion',
      'packageNamespace',
      'packageType',
      'packagePURLAppendix',
      'url',
      'copyright',
      'licenseName',
      'licenseText',
      'source',
      'firstParty',
      'followUp',
      'originIds',
      'preSelected',
      'excludeFromNotice',
      'criticality',
      'needsReview',
    ];
    expect(testKeysOfPackageInfo).toEqual(expectedKeysOfPackageInfo);
  });
});

describe('convertDisplayPackageInfoToPackageInfo', () => {
  it('adopts single comment', () => {
    const testAttributionId = 'uuid_1';
    const testDisplayPackageInfo: DisplayPackageInfo = {
      packageName: 'React',
      comments: ['React comment'],
      attributionIds: [testAttributionId],
    };
    const expectedPackageInfo: PackageInfo = {
      packageName: 'React',
      comment: 'React comment',
    };
    const testPackageInfo = convertDisplayPackageInfoToPackageInfo(
      testDisplayPackageInfo,
    );
    expect(testPackageInfo).toEqual(expectedPackageInfo);
  });

  it('ignores multiple comments', () => {
    const testAttributionId1 = 'uuid_1';
    const testAttributionId2 = 'uuid_2';
    const testDisplayPackageInfo: DisplayPackageInfo = {
      packageName: 'React',
      comments: ['React comment 1', 'React comment 2'],
      attributionIds: [testAttributionId1, testAttributionId2],
    };
    const expectedPackageInfo: PackageInfo = {
      packageName: 'React',
    };
    const testPackageInfo = convertDisplayPackageInfoToPackageInfo(
      testDisplayPackageInfo,
    );
    expect(testPackageInfo).toEqual(expectedPackageInfo);
  });

  it('adopts first comment if no attributionIds are provided', () => {
    const testDisplayPackageInfo: DisplayPackageInfo = {
      packageName: 'React',
      comments: ['React comment 1', 'React comment 2'],
      attributionIds: [],
    };
    const expectedPackageInfo: PackageInfo = {
      packageName: 'React',
      comment: 'React comment 1',
    };
    const testPackageInfo = convertDisplayPackageInfoToPackageInfo(
      testDisplayPackageInfo,
    );
    expect(testPackageInfo).toEqual(expectedPackageInfo);
  });

  // This test ensures that newly added DisplayPackageInfo keys are considered when converting
  it('does not allow excess keys', () => {
    const testKeysOfDisplayPackageInfo = getDisplayPackageInfoKeys();
    const expectedKeysOfDisplayPackageInfo = [
      'attributionConfidence',
      'packageName',
      'packageVersion',
      'packageNamespace',
      'packageType',
      'packagePURLAppendix',
      'url',
      'copyright',
      'licenseName',
      'licenseText',
      'source',
      'firstParty',
      'followUp',
      'originIds',
      'preSelected',
      'needsReview',
      'excludeFromNotice',
      'criticality',
      'comments',
      'attributionIds',
    ];
    expect(testKeysOfDisplayPackageInfo).toEqual(
      expectedKeysOfDisplayPackageInfo,
    );
  });
});
