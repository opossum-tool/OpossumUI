// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { PackageInfo } from '../../../../shared/shared-types';
import { faker } from '../../../../testing/Faker';
import { isImportantAttributionInformationMissing } from '../../../util/is-important-attribution-information-missing';
import { TableConfig } from '../../ReportView/TableConfig';
import { getFormattedCellData } from '../ReportTableItem.util';

describe('The table helpers', () => {
  it('getFormattedCellData replaces undefined by empty string', () => {
    const testTableConfig: TableConfig = {
      attributionProperty: 'attributionConfidence',
      displayName: 'confidence',
      width: '100px',
    };
    const testAttributionInfo: PackageInfo = {
      resources: ['a', 'b'],
      id: faker.string.uuid(),
    };
    expect(getFormattedCellData(testTableConfig, testAttributionInfo)).toBe('');
  });

  it('getFormattedCellData handles first-party boolean', () => {
    const testTableConfig: TableConfig = {
      attributionProperty: 'firstParty',
      displayName: 'First Party',
      width: '100px',
    };
    const testAttributionInfo1: PackageInfo = {
      firstParty: true,
      resources: ['1'],
      id: faker.string.uuid(),
    };
    const testAttributionInfo2: PackageInfo = {
      firstParty: false,
      resources: ['1'],
      id: faker.string.uuid(),
    };
    const testAttributionInfo3: PackageInfo = {
      resources: ['1'],
      id: faker.string.uuid(),
    };
    expect(getFormattedCellData(testTableConfig, testAttributionInfo1)).toBe(
      'Yes',
    );
    expect(getFormattedCellData(testTableConfig, testAttributionInfo2)).toBe(
      'No',
    );
    expect(getFormattedCellData(testTableConfig, testAttributionInfo3)).toBe(
      'No',
    );
  });

  it.each`
    followUp     | expected
    ${undefined} | ${'No'}
    ${true}      | ${'Yes'}
  `(
    'getFormattedCellData handles follow-up value $followUp',
    ({ followUp, expected }) => {
      const testTableConfig: TableConfig = {
        attributionProperty: 'followUp',
        displayName: 'Follow-up',
        width: '100px',
      };

      const testAttributionInfo: PackageInfo = {
        followUp,
        resources: ['1'],
        id: faker.string.uuid(),
      };

      expect(
        getFormattedCellData(testTableConfig, testAttributionInfo),
      ).toEqual(expected);
    },
  );

  it.each`
    property
    ${'copyright'}
    ${'licenseName'}
    ${'packageName'}
    ${'url'}
  `(
    'isImportantAttributionInformationMissing handles $property correctly',
    ({ property }) => {
      const testTableConfig: TableConfig = {
        attributionProperty: property,
        displayName: 'Follow-up',
        width: '100px',
      };

      let testAttributionInfo: PackageInfo = {
        [property]: '',
        resources: ['1'],
        id: faker.string.uuid(),
      };

      expect(
        isImportantAttributionInformationMissing(
          testTableConfig.attributionProperty,
          testAttributionInfo,
        ),
      ).toBe(true);

      testAttributionInfo = {
        resources: ['1'],
        id: faker.string.uuid(),
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
        id: faker.string.uuid(),
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
      width: '100px',
    };

    let testAttributionInfo: PackageInfo = {
      resources: ['1'],
      id: faker.string.uuid(),
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
      id: faker.string.uuid(),
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
      id: faker.string.uuid(),
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
      id: faker.string.uuid(),
    };
    expect(
      isImportantAttributionInformationMissing(
        testTableConfig.attributionProperty,
        testAttributionInfo,
      ),
    ).toBe(true);
  });
});
