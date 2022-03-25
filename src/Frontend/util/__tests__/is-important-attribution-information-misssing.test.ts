// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { AttributionInfo } from '../../../shared/shared-types';
import { isImportantAttributionInformationMissing } from '../is-important-attribution-information-missing';

describe('isImportantAttributionInformationMissing', () => {
  test('returns true for a github purl without namespace', () => {
    const testAttributionInfo: AttributionInfo = {
      packageType: 'github',
      resources: ['1'],
    };
    expect(
      isImportantAttributionInformationMissing(
        'packageNamespace',
        testAttributionInfo
      )
    ).toEqual(true);
  });

  test('returns false if exclude from notice', () => {
    const testAttributionInfo: AttributionInfo = {
      excludeFromNotice: true,
      resources: ['1'],
    };
    expect(
      isImportantAttributionInformationMissing(
        'excludeFromNotice',
        testAttributionInfo
      )
    ).toEqual(false);
  });

  test('returns true if package name is missing', () => {
    const testAttributionInfo: AttributionInfo = {
      resources: ['1'],
    };
    expect(
      isImportantAttributionInformationMissing(
        'packageName',
        testAttributionInfo
      )
    ).toEqual(true);
  });

  test('returns false if copyright is not missing', () => {
    const testAttributionInfo: AttributionInfo = {
      copyright: 'test',
      resources: ['1'],
    };
    expect(
      isImportantAttributionInformationMissing('copyright', testAttributionInfo)
    ).toEqual(false);
  });
});
