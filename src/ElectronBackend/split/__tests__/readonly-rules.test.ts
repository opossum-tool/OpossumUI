// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  createSplitRules,
  getReadonlyRuleMap,
  getReadonlyState,
  mergeReadonlyRules,
  MergeReadonlyRulesError,
} from '../readonly-rules';

describe('getReadonlyState', () => {
  it('uses the closest matching rule and defaults to editable', () => {
    const rulesByPath = getReadonlyRuleMap([
      { path: '/', readonly: true },
      { path: '/frontend', readonly: false },
      { path: '/frontend/generated', readonly: true },
    ]);

    expect(getReadonlyState('/docs', rulesByPath)).toBe(true);
    expect(getReadonlyState('/frontend/App.tsx', rulesByPath)).toBe(false);
    expect(getReadonlyState('/frontend/generated/file.ts', rulesByPath)).toBe(
      true,
    );
    expect(getReadonlyState('/unknown', getReadonlyRuleMap([]))).toBe(false);
  });
});

describe('mergeReadonlyRules', () => {
  it('merges complementary partitions into an editable result', () => {
    expect(
      mergeReadonlyRules([
        getReadonlyRuleMap([{ path: '/docs', readonly: true }]),
        getReadonlyRuleMap([
          { path: '/', readonly: true },
          { path: '/docs', readonly: false },
        ]),
      ]),
    ).toEqual([]);
  });

  it('retains readonly paths that are not editable in any partition', () => {
    expect(
      mergeReadonlyRules([
        getReadonlyRuleMap([
          { path: '/', readonly: true },
          { path: '/docs', readonly: false },
        ]),
        getReadonlyRuleMap([
          { path: '/', readonly: true },
          { path: '/frontend', readonly: false },
        ]),
      ]),
    ).toEqual([
      { path: '/', readonly: true },
      { path: '/docs', readonly: false },
      { path: '/frontend', readonly: false },
    ]);
  });

  it('keeps only necessary nested overrides', () => {
    expect(
      mergeReadonlyRules([
        getReadonlyRuleMap([
          { path: '/', readonly: true },
          { path: '/frontend', readonly: false },
          { path: '/frontend/components', readonly: true },
        ]),
        getReadonlyRuleMap([
          { path: '/', readonly: true },
          { path: '/frontend/components', readonly: false },
        ]),
      ]),
    ).toEqual([
      { path: '/', readonly: true },
      { path: '/frontend', readonly: false },
    ]);
  });

  it('retains a readonly nested override below an editable path', () => {
    expect(
      mergeReadonlyRules([
        getReadonlyRuleMap([
          { path: '/', readonly: true },
          { path: '/src', readonly: false },
          { path: '/src/generated', readonly: true },
        ]),
        getReadonlyRuleMap([{ path: '/', readonly: true }]),
      ]),
    ).toEqual([
      { path: '/', readonly: true },
      { path: '/src', readonly: false },
      { path: '/src/generated', readonly: true },
    ]);
  });

  it('keeps a fully readonly result', () => {
    expect(
      mergeReadonlyRules([
        getReadonlyRuleMap([{ path: '/', readonly: true }]),
        getReadonlyRuleMap([{ path: '/', readonly: true }]),
      ]),
    ).toEqual([{ path: '/', readonly: true }]);
  });

  it('returns rules in canonical path order', () => {
    expect(
      mergeReadonlyRules([
        getReadonlyRuleMap([
          { path: '/docs/nested', readonly: true },
          { path: '/', readonly: true },
          { path: '/docs', readonly: false },
        ]),
        getReadonlyRuleMap([
          { path: '/frontend', readonly: false },
          { path: '/', readonly: true },
        ]),
      ]),
    ).toEqual([
      { path: '/', readonly: true },
      { path: '/docs', readonly: false },
      { path: '/docs/nested', readonly: true },
      { path: '/frontend', readonly: false },
    ]);
  });

  it('merges several source partitions in any order', () => {
    const firstSplit = createSplitRules([], ['/docs']);
    const secondSplit = createSplitRules(firstSplit.sourceReadonlyRules, [
      '/frontend',
    ]);

    expectMergesInAnyOrder(
      [
        secondSplit.sourceReadonlyRules,
        firstSplit.splitReadonlyRules,
        secondSplit.splitReadonlyRules,
      ].map(getReadonlyRuleMap),
    );
  });

  it('merges nested partitions in any order', () => {
    const firstSplit = createSplitRules([], ['/frontend']);
    const secondSplit = createSplitRules(firstSplit.splitReadonlyRules, [
      '/frontend/components',
    ]);

    expectMergesInAnyOrder(
      [
        firstSplit.sourceReadonlyRules,
        secondSplit.sourceReadonlyRules,
        secondSplit.splitReadonlyRules,
      ].map(getReadonlyRuleMap),
    );
  });

  it('rejects an empty list of archives', () => {
    expect(() => mergeReadonlyRules([])).toThrow(MergeReadonlyRulesError);
    expect(() => mergeReadonlyRules([])).toThrow(
      'At least one archive is required',
    );
  });

  it('rejects an archive without readonly rules', () => {
    expect(() =>
      mergeReadonlyRules([
        getReadonlyRuleMap([{ path: '/', readonly: true }]),
        new Map(),
      ]),
    ).toThrow(MergeReadonlyRulesError);
    expect(() =>
      mergeReadonlyRules([
        getReadonlyRuleMap([{ path: '/', readonly: true }]),
        new Map(),
      ]),
    ).toThrow('All archives must contain readonly rules');
  });

  it.each([
    {
      readonlyRuleMaps: [
        getReadonlyRuleMap([{ path: '/', readonly: false }]),
        getReadonlyRuleMap([{ path: '/', readonly: false }]),
      ],
      overlappingPath: '/',
    },
    {
      readonlyRuleMaps: [
        getReadonlyRuleMap([
          { path: '/', readonly: true },
          { path: '/docs', readonly: false },
        ]),
        getReadonlyRuleMap([
          { path: '/', readonly: true },
          { path: '/docs', readonly: false },
        ]),
      ],
      overlappingPath: '/docs',
    },
    {
      readonlyRuleMaps: [
        getReadonlyRuleMap([
          { path: '/', readonly: true },
          { path: '/docs', readonly: false },
        ]),
        getReadonlyRuleMap([
          { path: '/', readonly: true },
          { path: '/docs/nested', readonly: false },
        ]),
      ],
      overlappingPath: '/docs/nested',
    },
  ])(
    'rejects invalid rule sets at $overlappingPath',
    ({ readonlyRuleMaps, overlappingPath }) => {
      expect(() => mergeReadonlyRules(readonlyRuleMaps)).toThrow(
        MergeReadonlyRulesError,
      );
      expect(() => mergeReadonlyRules(readonlyRuleMaps)).toThrow(
        `'${overlappingPath}'`,
      );
    },
  );
});

describe('split and merge', () => {
  it('retains nested readonly overrides in the selected partition', () => {
    const currentReadonlyRules = [
      { path: '/', readonly: true },
      { path: '/frontend', readonly: false },
      { path: '/frontend/components', readonly: true },
      { path: '/frontend/components/vendor', readonly: false },
    ];

    const { sourceReadonlyRules, splitReadonlyRules } = createSplitRules(
      currentReadonlyRules,
      ['/frontend'],
    );

    expect(splitReadonlyRules).toEqual(currentReadonlyRules);
    expect(
      mergeReadonlyRules(
        [sourceReadonlyRules, splitReadonlyRules].map(getReadonlyRuleMap),
      ),
    ).toEqual(currentReadonlyRules);
  });

  it.each([
    {
      currentReadonlyRules: [],
      selectedPaths: ['/docs'],
    },
    {
      currentReadonlyRules: [
        { path: '/', readonly: true },
        { path: '/frontend', readonly: false },
      ],
      selectedPaths: ['/frontend/components'],
    },
    {
      currentReadonlyRules: [
        { path: '/', readonly: true },
        { path: '/frontend', readonly: false },
        { path: '/frontend/components', readonly: true },
      ],
      selectedPaths: ['/frontend'],
    },
    {
      currentReadonlyRules: [
        { path: '/', readonly: true },
        { path: '/docs', readonly: false },
        { path: '/frontend', readonly: false },
      ],
      selectedPaths: ['/docs', '/frontend/components'],
    },
  ])(
    'restores the original rules after splitting $selectedPaths',
    ({ currentReadonlyRules, selectedPaths }) => {
      const { sourceReadonlyRules, splitReadonlyRules } = createSplitRules(
        currentReadonlyRules,
        selectedPaths,
      );

      expect(
        mergeReadonlyRules(
          [sourceReadonlyRules, splitReadonlyRules].map(getReadonlyRuleMap),
        ),
      ).toEqual(currentReadonlyRules);
    },
  );
});

function expectMergesInAnyOrder(
  readonlyRuleMaps: Array<Map<string, boolean>>,
): void {
  for (const permutation of getPermutations(readonlyRuleMaps)) {
    expect(mergeReadonlyRules(permutation)).toEqual([]);
  }
}

function getPermutations<T>(values: Array<T>): Array<Array<T>> {
  if (values.length === 0) {
    return [[]];
  }
  return values.flatMap((value, index) =>
    getPermutations(values.filter((_, otherIndex) => otherIndex !== index)).map(
      (permutation) => [value, ...permutation],
    ),
  );
}
