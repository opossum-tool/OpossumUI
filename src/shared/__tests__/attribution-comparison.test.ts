// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  ATTRIBUTION_CONTENT_ATTRIBUTES,
  COMPARE_TO_MANUAL_ATTRIBUTION_ATTRIBUTES,
  getEffectiveHumanModified,
  hasSameAttributionContent,
  isEqualToManualAttribution,
  THIRD_PARTY_KEYS,
} from '../attribution-comparison';
import { Criticality, type PackageInfo } from '../shared-types';

const BASE: PackageInfo = {
  criticality: Criticality.None,
  id: 'base-id',
  attributionConfidence: 50,
  comment: 'base-comment',
  copyright: 'base-copyright',
  excludeFromNotice: false,
  firstParty: false,
  followUp: false,
  licenseName: 'base-license',
  licenseText: 'base-license-text',
  needsReview: false,
  originIds: ['base-origin'],
  packageName: 'base-name',
  packageNamespace: 'base-ns',
  packagePURLAppendix: 'base-purl',
  packageType: 'base-type',
  packageVersion: '1.0.0',
  preferred: false,
  originalAttributionId: 'base-original-id',
  originalAttributionSource: { name: 'base-source', documentConfidence: 0 },
  originalAttributionWasPreferred: false,
  preferredOverOriginIds: ['base-pref'],
  url: 'https://base.example.com',
  wasPreferred: false,
};

const DIFFERENT_VALUE: Partial<Record<keyof PackageInfo, unknown>> = {
  attributionConfidence: 99,
  comment: 'other-comment',
  copyright: 'other-copyright',
  excludeFromNotice: true,
  firstParty: true,
  followUp: true,
  licenseName: 'other-license',
  licenseText: 'other-license-text',
  needsReview: true,
  originIds: ['other-origin'],
  packageName: 'other-name',
  packageNamespace: 'other-ns',
  packagePURLAppendix: 'other-purl',
  packageType: 'other-type',
  packageVersion: '2.0.0',
  preferred: true,
  originalAttributionId: 'other-original-id',
  originalAttributionSource: { name: 'other-source', documentConfidence: 0 },
  originalAttributionWasPreferred: true,
  preferredOverOriginIds: ['other-pref'],
  url: 'https://other.example.com',
  wasPreferred: true,
};

const NON_COMPARABLE_ATTRIBUTES = ['id', 'criticality'] as const;
const EXPECTED_CONTENT_ATTRIBUTES = [
  'packageName',
  'packageVersion',
  'packageNamespace',
  'packageType',
  'packagePURLAppendix',
  'url',
  'copyright',
  'licenseName',
  'licenseText',
  'firstParty',
  'comment',
] as const satisfies ReadonlyArray<keyof PackageInfo>;
const EXPECTED_MANUAL_ATTRIBUTES = [
  ...EXPECTED_CONTENT_ATTRIBUTES,
  'attributionConfidence',
  'excludeFromNotice',
  'followUp',
  'needsReview',
  'originIds',
  'preferred',
  'originalAttributionId',
  'originalAttributionSource',
  'originalAttributionWasPreferred',
  'preferredOverOriginIds',
  'wasPreferred',
] as const satisfies ReadonlyArray<keyof PackageInfo>;

test('keeps the public comparison field lists complete', () => {
  expect(ATTRIBUTION_CONTENT_ATTRIBUTES).toEqual(EXPECTED_CONTENT_ATTRIBUTES);
  expect(COMPARE_TO_MANUAL_ATTRIBUTION_ATTRIBUTES).toEqual(
    EXPECTED_MANUAL_ATTRIBUTES,
  );
});

describe.each([
  {
    name: 'isEqualToManualAttribution',
    isEqual: isEqualToManualAttribution,
    comparedAttributes: EXPECTED_MANUAL_ATTRIBUTES,
    ignoredAttributes: NON_COMPARABLE_ATTRIBUTES,
  },
  {
    name: 'hasSameAttributionContent',
    isEqual: hasSameAttributionContent,
    comparedAttributes: EXPECTED_CONTENT_ATTRIBUTES,
    // Manual-only attributes should be ignored by the content comparison.
    ignoredAttributes: [
      ...NON_COMPARABLE_ATTRIBUTES,
      ...EXPECTED_MANUAL_ATTRIBUTES.filter(
        (attribute) =>
          !(
            EXPECTED_CONTENT_ATTRIBUTES as ReadonlyArray<keyof PackageInfo>
          ).includes(attribute),
      ),
    ],
  },
])('$name', ({ isEqual, comparedAttributes, ignoredAttributes }) => {
  it('returns true for identical package infos', () => {
    expect(isEqual(BASE, { ...BASE })).toBe(true);
  });

  it.each(ignoredAttributes)(
    'returns true when only ignored attribute %s differs',
    (attribute) => {
      const other: PackageInfo = {
        ...BASE,
        [attribute]: DIFFERENT_VALUE[attribute] ?? 'changed-value',
      };
      expect(isEqual(BASE, other)).toBe(true);
    },
  );

  it.each(comparedAttributes)(
    'returns false when comparable attribute %s differs',
    (attribute) => {
      const other: PackageInfo = {
        ...BASE,
        [attribute]: DIFFERENT_VALUE[attribute],
      };
      expect(isEqual(BASE, other)).toBe(false);
    },
  );

  it.each([
    { aValue: '', bValue: undefined },
    { aValue: undefined, bValue: '' },
  ])(
    'treats falsy comparable values as missing ($aValue vs $bValue)',
    ({ aValue, bValue }) => {
      const a: PackageInfo = { ...BASE, copyright: aValue };
      const b: PackageInfo = { ...BASE, copyright: bValue };
      expect(isEqual(a, b)).toBe(true);
    },
  );

  it.each(THIRD_PARTY_KEYS)(
    'ignores third-party attribute %s when both are first party',
    (attribute) => {
      const a: PackageInfo = { ...BASE, firstParty: true };
      const b: PackageInfo = {
        ...BASE,
        firstParty: true,
        [attribute]: DIFFERENT_VALUE[attribute],
      };
      expect(isEqual(a, b)).toBe(true);
    },
  );

  it('returns false when only one side is first party', () => {
    const a: PackageInfo = { ...BASE, firstParty: true };
    const b: PackageInfo = { ...BASE, firstParty: false };
    expect(isEqual(a, b)).toBe(false);
  });
});

test('treats an empty PURL appendix as equivalent to a missing appendix', () => {
  expect(
    hasSameAttributionContent(
      { ...BASE, packagePURLAppendix: '' },
      { ...BASE, packagePURLAppendix: undefined },
    ),
  ).toBe(true);
});

describe.each([
  {
    name: 'omitted flag, unchanged content',
    flag: undefined,
    changed: false,
    expected: undefined,
  },
  {
    name: 'false flag, unchanged content',
    flag: false,
    changed: false,
    expected: false,
  },
  {
    name: 'true flag, unchanged content',
    flag: true,
    changed: false,
    expected: true,
  },
  {
    name: 'omitted flag, changed content',
    flag: undefined,
    changed: true,
    expected: true,
  },
  {
    name: 'false flag, changed content',
    flag: false,
    changed: true,
    expected: true,
  },
  {
    name: 'true flag, changed content',
    flag: true,
    changed: true,
    expected: true,
  },
])('getEffectiveHumanModified: $name', ({ flag, changed, expected }) => {
  it('returns the effective flag', () => {
    expect(
      getEffectiveHumanModified(
        BASE,
        changed ? { ...BASE, packageName: 'changed' } : BASE,
        flag,
      ),
    ).toBe(expected);
  });
});
