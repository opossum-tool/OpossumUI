// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  Criticality,
  FollowUp,
  PackageInfo,
} from '../../../shared/shared-types';
import { packageInfoHasNoSignificantFields } from '../package-info-has-no-significant-fields';

describe('The test package', () => {
  it.each([
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
  ] satisfies Array<PackageInfo>)(
    'has no significant fields',
    (packageInfo) => {
      expect(packageInfoHasNoSignificantFields(packageInfo)).toBe(true);
    },
  );

  it.each([
    { comment: 'Not so sure about this...' },
    { attributionConfidence: 30, packageName: 'React' },
    { originIds: ['some-uuid'], url: 'https://www.test.com' },
  ] satisfies Array<PackageInfo>)('has significant fields', (packageInfo) => {
    expect(packageInfoHasNoSignificantFields(packageInfo)).toBe(false);
  });
});
