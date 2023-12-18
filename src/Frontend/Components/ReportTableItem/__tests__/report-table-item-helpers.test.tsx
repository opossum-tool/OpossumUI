// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { AttributionInfo, FollowUp } from '../../../../shared/shared-types';
import { isImportantAttributionInformationMissing } from '../../../util/is-important-attribution-information-missing';
import { TableConfig } from '../../Table/TableConfig';
import { getFormattedCellData } from '../report-table-item-helpers';

describe('The table helpers', () => {
  const testPathOfFileWithChildren = '/test/path/';
  const testIsFileWithChildren = (path: string): boolean =>
    path === testPathOfFileWithChildren;

  it('getFormattedCellData replaces undefined by empty string', () => {
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
        testIsFileWithChildren,
      ),
    ).toBe('');
  });

  it('getFormattedCellData formats resources', () => {
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
        testIsFileWithChildren,
      ),
    ).toBe(`${testPathOfFileWithChildren.slice(0, -1)}\nb`);
  });

  it('getFormattedCellData handles first-party boolean', () => {
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
        testIsFileWithChildren,
      ),
    ).toBe('Yes');
    expect(
      getFormattedCellData(
        testTableConfig,
        testAttributionInfo2,
        testIsFileWithChildren,
      ),
    ).toBe('No');
    expect(
      getFormattedCellData(
        testTableConfig,
        testAttributionInfo3,
        testIsFileWithChildren,
      ),
    ).toBe('No');
  });

  it.each`
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
        followUp,
        resources: ['1'],
      };

      expect(
        getFormattedCellData(
          testTableConfig,
          testAttributionInfo,
          testIsFileWithChildren,
        ),
      ).toEqual(expected);
    },
  );

  it.each`
    property
    ${'copyright'}
    ${'licenseName'}
    ${'packageName'}
    ${'url'}
    ${'packageVersion'}
  `(
    'isImportantAttributionInformationMissing handles $property correctly',
    ({ property }) => {
      const testTableConfig: TableConfig = {
        attributionProperty: property,
        displayName: 'Follow-up',
      };

      let testAttributionInfo: AttributionInfo = {
        [property]: '',
        resources: ['1'],
      };

      expect(
        isImportantAttributionInformationMissing(
          testTableConfig.attributionProperty,
          testAttributionInfo,
        ),
      ).toBe(true);

      testAttributionInfo = {
        resources: ['1'],
      };

      expect(
        isImportantAttributionInformationMissing(
          testTableConfig.attributionProperty,
          testAttributionInfo,
        ),
      ).toBe(true);

      testAttributionInfo = {
        [property]: 'test',
        resources: ['1'],
      };

      expect(
        isImportantAttributionInformationMissing(
          testTableConfig.attributionProperty,
          testAttributionInfo,
        ),
      ).toBe(false);
    },
  );

  it('isImportantAttributionInformationMissing does not mark first party or excluded attributions', () => {
    const testTableConfig: TableConfig = {
      attributionProperty: 'licenseName',
      displayName: 'Unimportant',
    };

    let testAttributionInfo: AttributionInfo = {
      resources: ['1'],
    };
    expect(
      isImportantAttributionInformationMissing(
        testTableConfig.attributionProperty,
        testAttributionInfo,
      ),
    ).toBe(true);

    testAttributionInfo = {
      resources: ['1'],
      firstParty: true,
    };
    expect(
      isImportantAttributionInformationMissing(
        testTableConfig.attributionProperty,
        testAttributionInfo,
      ),
    ).toBe(false);

    testAttributionInfo = {
      resources: ['1'],
      excludeFromNotice: true,
    };
    expect(
      isImportantAttributionInformationMissing(
        testTableConfig.attributionProperty,
        testAttributionInfo,
      ),
    ).toBe(false);

    testAttributionInfo = {
      resources: ['1'],
      firstParty: false,
      excludeFromNotice: false,
    };
    expect(
      isImportantAttributionInformationMissing(
        testTableConfig.attributionProperty,
        testAttributionInfo,
      ),
    ).toBe(true);
  });
});
