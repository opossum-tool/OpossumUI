// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { combineExternalAttributionSources } from '../externalAttributionSources';
import { ExternalAttributionSources } from '../../../shared/shared-types';
import { ATTRIBUTION_SOURCES } from '../../../shared/shared-constants';

describe('combineExternalAttributionSources', () => {
  test('handles empty list', () => {
    expect(combineExternalAttributionSources([])).toStrictEqual({});
  });

  test('handles only hardcoded list of sources', () => {
    expect(
      combineExternalAttributionSources([ATTRIBUTION_SOURCES])
    ).toStrictEqual(ATTRIBUTION_SOURCES);
  });

  test('gives priority to already seen keys', () => {
    const testAttributionSources: ExternalAttributionSources = {
      SC: { name: 'Custom Scancode', priority: 100 },
    };

    expect(
      combineExternalAttributionSources([
        ATTRIBUTION_SOURCES,
        testAttributionSources,
      ])
    ).toStrictEqual(ATTRIBUTION_SOURCES);
  });

  test('add keys, which were not yet seen', () => {
    const testAttributionSources: ExternalAttributionSources = {
      CUSTOMSOURCE: { name: 'Crystal ball', priority: 100 },
    };

    expect(
      combineExternalAttributionSources([
        ATTRIBUTION_SOURCES,
        testAttributionSources,
      ])
    ).toStrictEqual({ ...ATTRIBUTION_SOURCES, ...testAttributionSources });
  });

  test('handles empty object', () => {
    const testAttributionSources: ExternalAttributionSources = {};

    expect(
      combineExternalAttributionSources([
        ATTRIBUTION_SOURCES,
        testAttributionSources,
      ])
    ).toStrictEqual(ATTRIBUTION_SOURCES);
  });
});
