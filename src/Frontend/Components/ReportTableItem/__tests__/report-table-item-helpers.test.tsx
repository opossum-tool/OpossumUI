// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { AttributionInfo, TableConfig } from '../../Table/Table';
import {
  getFormattedCellData,
  isMarkedTableCell,
} from '../report-table-item-helpers';
import { FollowUp } from '../../../../shared/shared-types';

describe('The table helpers', () => {
  const testPathOfFileWithChildren = '/test/path/';
  const testIsFileWithChildren = (path: string): boolean =>
    path === testPathOfFileWithChildren;

  test('getFormattedCellData replaces undefined by empty string', () => {
    const testTableConfig: TableConfig = {
      attributionProperty: 'attributionConfidence',
      displayName: 'confidence',
    };
    const testAttributionInfo: AttributionInfo = {
      resources: ['a', 'b'],
    };
    expect(
      getFormattedCellData(
        testTableConfig,
        testAttributionInfo,
        testIsFileWithChildren
      )
    ).toEqual('');
  });

  test('getFormattedCellData formats resources', () => {
    const testTableConfig: TableConfig = {
      attributionProperty: 'resources',
      displayName: 'resources',
    };
    const testAttributionInfo: AttributionInfo = {
      resources: [testPathOfFileWithChildren, 'b'],
    };
    expect(
      getFormattedCellData(
        testTableConfig,
        testAttributionInfo,
        testIsFileWithChildren
      )
    ).toEqual(testPathOfFileWithChildren.slice(0, -1) + '\nb');
  });

  test('getFormattedCellData handles first-party boolean', () => {
    const testTableConfig: TableConfig = {
      attributionProperty: 'firstParty',
      displayName: 'First Party',
    };
    const testAttributionInfo1: AttributionInfo = {
      firstParty: true,
      resources: ['1'],
    };
    const testAttributionInfo2: AttributionInfo = {
      firstParty: false,
      resources: ['1'],
    };
    const testAttributionInfo3: AttributionInfo = {
      resources: ['1'],
    };
    expect(
      getFormattedCellData(
        testTableConfig,
        testAttributionInfo1,
        testIsFileWithChildren
      )
    ).toEqual('Yes');
    expect(
      getFormattedCellData(
        testTableConfig,
        testAttributionInfo2,
        testIsFileWithChildren
      )
    ).toEqual('No');
    expect(
      getFormattedCellData(
        testTableConfig,
        testAttributionInfo3,
        testIsFileWithChildren
      )
    ).toEqual('No');
  });

  test.each`
    followUp     | expected
    ${undefined} | ${'No'}
    ${FollowUp}  | ${'Yes'}
  `(
    'getFormattedCellData handles follow-up value $followUp',
    ({ followUp, expected }) => {
      const testTableConfig: TableConfig = {
        attributionProperty: 'followUp',
        displayName: 'Follow-up',
      };

      const testAttributionInfo: AttributionInfo = {
        followUp: followUp,
        resources: ['1'],
      };

      expect(
        getFormattedCellData(
          testTableConfig,
          testAttributionInfo,
          testIsFileWithChildren
        )
      ).toEqual(expected);
    }
  );

  test.each`
    property
    ${'copyright'}
    ${'licenseName'}
    ${'packageName'}
    ${'url'}
    ${'packageVersion'}
  `('isMarkedTableCell handles $property correctly', ({ property }) => {
    const testTableConfig: TableConfig = {
      attributionProperty: property,
      displayName: 'Follow-up',
    };

    let testAttributionInfo: AttributionInfo = {
      [property]: '',
      resources: ['1'],
    };

    expect(isMarkedTableCell(testTableConfig, testAttributionInfo)).toEqual(
      true
    );

    testAttributionInfo = {
      resources: ['1'],
    };

    expect(isMarkedTableCell(testTableConfig, testAttributionInfo)).toEqual(
      true
    );

    testAttributionInfo = {
      [property]: 'test',
      resources: ['1'],
    };

    expect(isMarkedTableCell(testTableConfig, testAttributionInfo)).toEqual(
      false
    );
  });

  test('isMarkedTableCell handles attributionConfidence correctly', () => {
    const testTableConfig: TableConfig = {
      attributionProperty: 'attributionConfidence',
      displayName: 'Follow-up',
    };

    let testAttributionInfo: AttributionInfo = {
      attributionConfidence: 49,
      resources: ['1'],
    };

    expect(isMarkedTableCell(testTableConfig, testAttributionInfo)).toEqual(
      true
    );

    testAttributionInfo = {
      resources: ['1'],
    };

    expect(isMarkedTableCell(testTableConfig, testAttributionInfo)).toEqual(
      true
    );

    testAttributionInfo = {
      attributionConfidence: 50,
      resources: ['1'],
    };

    expect(isMarkedTableCell(testTableConfig, testAttributionInfo)).toEqual(
      false
    );
  });

  test('isMarkedTableCell does not mark first party or excluded attributions', () => {
    const testTableConfig: TableConfig = {
      attributionProperty: 'licenseName',
      displayName: 'Unimportant',
    };

    let testAttributionInfo: AttributionInfo = {
      resources: ['1'],
    };
    expect(isMarkedTableCell(testTableConfig, testAttributionInfo)).toEqual(
      true
    );

    testAttributionInfo = {
      resources: ['1'],
      firstParty: true,
    };
    expect(isMarkedTableCell(testTableConfig, testAttributionInfo)).toEqual(
      false
    );

    testAttributionInfo = {
      resources: ['1'],
      excludeFromNotice: true,
    };
    expect(isMarkedTableCell(testTableConfig, testAttributionInfo)).toEqual(
      false
    );

    testAttributionInfo = {
      resources: ['1'],
      firstParty: false,
      excludeFromNotice: false,
    };
    expect(isMarkedTableCell(testTableConfig, testAttributionInfo)).toEqual(
      true
    );
  });
});
