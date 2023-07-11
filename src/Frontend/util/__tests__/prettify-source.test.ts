// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { prettifySource } from '../prettify-source';
import each from 'jest-each';
import { ExternalAttributionSources } from '../../../shared/shared-types';

const testAttributionSources: ExternalAttributionSources = {
  MERGER: { name: 'Suggested', priority: 11 },
  HHC: { name: 'High High Compute', priority: 10 },
  MS: { name: 'Metadata Scanner', priority: 9 },
  'REUSER:HHC': { name: 'High High Compute (old scan)', priority: 8 },
  'REUSER:MS': { name: 'Metadata Scanner (old scan)', priority: 7 },
  'REUSER:SC': { name: 'ScanCode (old scan)', priority: 6 },
  'REUSER:HC': { name: 'High Compute (old scan)', priority: 5 },
  'REUSER:MERGER': { name: 'Suggested (old scan)', priority: 4 },
  SC: { name: 'ScanCode', priority: 3 },
  HC: { name: 'High Compute', priority: 2 },
  HINT: { name: 'Hint', priority: 1 },
};

describe('prettifySource', () => {
  each([
    ['HC', 'High Compute'],
    ['HHC', 'High High Compute'],
    ['SC', 'ScanCode'],
    ['REUSER:HC', 'High Compute (old scan)'],
    ['REUSER:HHC', 'High High Compute (old scan)'],
    ['REUSER:SC', 'ScanCode (old scan)'],
    ['HHHC', 'HHHC'],
    ['Crystal Ball', 'Crystal Ball'],
    ['REUSER:Crystal Ball', 'REUSER:Crystal Ball'],
    ['MS', 'Metadata Scanner'],
    ['REUSER:MS', 'Metadata Scanner (old scan)'],
  ]).it(
    'transforms known sources and only those',
    (src: string, expectedResult: string) => {
      expect(prettifySource(src, testAttributionSources)).toBe(expectedResult);
    },
  );
});
