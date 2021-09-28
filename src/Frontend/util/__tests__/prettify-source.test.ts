// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { prettifySource } from '../prettify-source';
import each from 'jest-each';
import { ATTRIBUTION_SOURCES } from '../../../shared/shared-constants';

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
      expect(prettifySource(src, ATTRIBUTION_SOURCES)).toBe(expectedResult);
    }
  );
});
