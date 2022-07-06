// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { aggregateLicensesAndSourcesFromSignals } from '../project-statistics-popup-helpers';
import { PackageInfo } from '../../../../shared/shared-types';

describe('The ProjectStatisticsPopup helper', () => {
  test('counts licenses and sources', () => {
    const testExternalAttributions: PackageInfo[] = [
      {
        source: {
          name: 'SC',
          documentConfidence: 10,
        },
        licenseName: 'test-license-name',
      },
      {
        source: {
          name: 'reuser',
          documentConfidence: 90,
        },
        licenseName: 'test-license-name',
      },
      {
        source: {
          name: 'reuser',
          documentConfidence: 90,
        },
        licenseName: 'test-license-name_1',
      },
    ];

    const externalAttributions = {
      SC: {
        name: 'ScanCode',
        priority: 2,
      },
    };

    const signalCountPerSourcePerLicense =
      aggregateLicensesAndSourcesFromSignals(
        testExternalAttributions,
        externalAttributions
      )[0];

    expect(signalCountPerSourcePerLicense).toEqual({
      'test-license-name': { Total: 2, reuser: 1, ScanCode: 1 },
      'test-license-name_1': { Total: 1, reuser: 1 },
      Total: { Total: 3, reuser: 2, ScanCode: 1 },
    });
  });
});
