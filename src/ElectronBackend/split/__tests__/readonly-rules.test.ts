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
        [{ path: '/docs', readonly: true }],
        [
          { path: '/', readonly: true },
          { path: '/docs', readonly: false },
        ],
      ]),
    ).toEqual([]);
  });

  it('retains readonly paths that are not editable in any partition', () => {
    expect(
      mergeReadonlyRules([
        [
          { path: '/', readonly: true },
          { path: '/docs', readonly: false },
        ],
        [
          { path: '/', readonly: true },
          { path: '/frontend', readonly: false },
        ],
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
        [
          { path: '/', readonly: true },
          { path: '/frontend', readonly: false },
          { path: '/frontend/components', readonly: true },
        ],
        [
          { path: '/', readonly: true },
          { path: '/frontend/components', readonly: false },
        ],
      ]),
    ).toEqual([
      { path: '/', readonly: true },
      { path: '/frontend', readonly: false },
    ]);
  });

  it('retains a readonly nested override below an editable path', () => {
    expect(
      mergeReadonlyRules([
        [
          { path: '/', readonly: true },
          { path: '/src', readonly: false },
          { path: '/src/generated', readonly: true },
        ],
        [{ path: '/', readonly: true }],
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
        [{ path: '/', readonly: true }],
        [{ path: '/', readonly: true }],
      ]),
    ).toEqual([{ path: '/', readonly: true }]);
  });

  it('returns rules in canonical path order', () => {
    expect(
      mergeReadonlyRules([
        [
          { path: '/docs/nested', readonly: true },
          { path: '/', readonly: true },
          { path: '/docs', readonly: false },
        ],
        [
          { path: '/frontend', readonly: false },
          { path: '/', readonly: true },
        ],
      ]),
    ).toEqual([
      { path: '/', readonly: true },
      { path: '/docs', readonly: false },
      { path: '/frontend', readonly: false },
      { path: '/docs/nested', readonly: true },
    ]);
  });

  it('merges several source partitions in any order', () => {
    const firstSplit = createSplitRules([], ['/docs']);
    const secondSplit = createSplitRules(firstSplit.sourceReadonlyRules, [
      '/frontend',
    ]);

    expectMergesInAnyOrder([
      secondSplit.sourceReadonlyRules,
      firstSplit.splitReadonlyRules,
      secondSplit.splitReadonlyRules,
    ]);
  });

  it('merges nested partitions in any order', () => {
    const firstSplit = createSplitRules([], ['/frontend']);
    const secondSplit = createSplitRules(firstSplit.splitReadonlyRules, [
      '/frontend/components',
    ]);

    expectMergesInAnyOrder([
      firstSplit.sourceReadonlyRules,
      secondSplit.sourceReadonlyRules,
      secondSplit.splitReadonlyRules,
    ]);
  });

  it('rejects an empty list of archives', () => {
    expect(() => mergeReadonlyRules([])).toThrow(MergeReadonlyRulesError);
    expect(() => mergeReadonlyRules([])).toThrow(
      'At least one archive is required',
    );
  });

  it('rejects an archive without readonly rules', () => {
    expect(() =>
      mergeReadonlyRules([[{ path: '/', readonly: true }], []]),
    ).toThrow(MergeReadonlyRulesError);
    expect(() =>
      mergeReadonlyRules([[{ path: '/', readonly: true }], []]),
    ).toThrow('All archives must contain readonly rules');
  });

  it.each([
    {
      readonlyRulesByPartition: [
        [{ path: '/', readonly: false }],
        [{ path: '/', readonly: false }],
      ],
      overlappingPath: '/',
    },
    {
      readonlyRulesByPartition: [
        [
          { path: '/', readonly: true },
          { path: '/docs', readonly: false },
        ],
        [
          { path: '/', readonly: true },
          { path: '/docs', readonly: false },
        ],
      ],
      overlappingPath: '/docs',
    },
    {
      readonlyRulesByPartition: [
        [
          { path: '/', readonly: true },
          { path: '/docs', readonly: false },
        ],
        [
          { path: '/', readonly: true },
          { path: '/docs/nested', readonly: false },
        ],
      ],
      overlappingPath: '/docs/nested',
    },
  ])(
    'rejects invalid rule sets at $overlappingPath',
    ({ readonlyRulesByPartition, overlappingPath }) => {
      expect(() => mergeReadonlyRules(readonlyRulesByPartition)).toThrow(
        MergeReadonlyRulesError,
      );
      expect(() => mergeReadonlyRules(readonlyRulesByPartition)).toThrow(
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
      mergeReadonlyRules([sourceReadonlyRules, splitReadonlyRules]),
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
        mergeReadonlyRules([sourceReadonlyRules, splitReadonlyRules]),
      ).toEqual(currentReadonlyRules);
    },
  );
});

function expectMergesInAnyOrder(
  readonlyRulesByPartition: Array<Array<{ path: string; readonly: boolean }>>,
): void {
  for (const permutation of getPermutations(readonlyRulesByPartition)) {
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
