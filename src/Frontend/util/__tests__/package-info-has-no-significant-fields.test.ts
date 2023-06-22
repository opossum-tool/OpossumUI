// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import each from 'jest-each';
import {
  Criticality,
  FollowUp,
  PackageInfo,
} from '../../../shared/shared-types';
import { packageInfoHasNoSignificantFields } from '../package-info-has-no-significant-fields';

describe('The test package', () => {
  each([
    {},
    { attributionConfidence: 30 },
    { originIds: ['some-uuid'] },
    { originIds: ['another-uuid'], attributionConfidence: 100 },
    { followUp: FollowUp },
    { excludeFromNotice: true },
    { criticality: Criticality.Medium },
    { needsReview: true },
    {
      source: {
        name: 'test name',
        documentConfidence: 1,
      },
    },
  ]).it('has no significant fields', (packageInfo: PackageInfo) => {
    expect(packageInfoHasNoSignificantFields(packageInfo)).toBe(true);
  });

  each([
    { comment: 'Not so sure about this...' },
    { attributionConfidence: 30, packageName: 'React' },
    { originIds: ['some-uuid'], url: 'https://www.test.com' },
  ]).it('has significant fields', (packageInfo: PackageInfo) => {
    expect(packageInfoHasNoSignificantFields(packageInfo)).toBe(false);
  });
});
