// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { AiReviewFilter } from '../../../../shared/ai-review';
import {
  attributionFixture,
  initializeAiAttributionFixture,
} from '../../__tests__/ai-attribution-test-helpers';
import { getAiReviewCounts } from '../ai-review-counts';
import {
  allPage,
  defaultCriteria,
  locate,
} from './attribution-query-test-helpers';

const criteria = {
  ...defaultCriteria,
  aiOnly: true,
  resourcePathForRelationships: '/',
  includeReadonly: true,
};

beforeEach(async () => {
  await initializeAiAttributionFixture({
    resourcePaths: ['/file', '/other', '/readonly/file'],
    attributions: {
      clean: attributionFixture('clean', {
        packageName: 'AI clean',
        aiAttributes: {},
      }),
      deferred: attributionFixture('deferred', {
        packageName: 'AI deferred',
        aiAttributes: { deferredFields: {} },
      }),
      allStatuses: attributionFixture('allStatuses', {
        packageName: 'AI all statuses',
        followUp: true,
        aiAttributes: {
          deferredFields: { licenseName: {} },
          humanModified: true,
        },
      }),
      followUp: attributionFixture('followUp', {
        packageName: 'AI follow-up',
        followUp: true,
        aiAttributes: { humanModified: false },
      }),
      modified: attributionFixture('modified', {
        packageName: 'AI modified',
        aiAttributes: { humanModified: true },
      }),
      readonly: attributionFixture('readonly', {
        packageName: 'AI readonly',
        aiAttributes: { deferredFields: {} },
      }),
      unlinked: attributionFixture('unlinked', {
        packageName: 'AI unlinked',
        aiAttributes: {},
      }),
      manual: attributionFixture('manual', {
        packageName: 'AI manual',
        followUp: true,
      }),
    },
    resourceLinks: {
      '/file': [
        'clean',
        'deferred',
        'allStatuses',
        'followUp',
        'modified',
        'manual',
      ],
      '/other': ['deferred', 'allStatuses'],
      '/readonly/file': ['readonly'],
    },
    externalAttributions: {
      signal: attributionFixture('signal', {
        aiAttributes: { deferredFields: {} },
      }),
    },
    externalResourceLinks: { '/file': ['signal'] },
    readonlyRules: [{ path: '/readonly', readonly: true }],
  });
});

describe('AI review counts and filtering', () => {
  it.each([
    {
      aiReviewFilter: 'all',
      expectedIds: [
        'allStatuses',
        'clean',
        'deferred',
        'followUp',
        'modified',
        'readonly',
        'unlinked',
      ],
      targetId: 'allStatuses',
    },
    {
      aiReviewFilter: 'deferred',
      expectedIds: ['allStatuses', 'deferred', 'readonly'],
      targetId: 'deferred',
    },
    {
      aiReviewFilter: 'needsFollowUp',
      expectedIds: ['allStatuses', 'followUp'],
      targetId: 'followUp',
    },
    {
      aiReviewFilter: 'humanModified',
      expectedIds: ['allStatuses', 'modified'],
      targetId: 'modified',
    },
    {
      aiReviewFilter: 'fullyResolved',
      expectedIds: ['clean', 'modified', 'unlinked'],
      targetId: 'clean',
    },
  ] satisfies Array<{
    aiReviewFilter: AiReviewFilter;
    expectedIds: Array<string>;
    targetId: string;
  }>)(
    'keeps the $aiReviewFilter count, pages, and navigation consistent',
    async ({ aiReviewFilter, expectedIds, targetId }) => {
      const counts = await getAiReviewCounts(criteria);
      const page = await allPage({ ...criteria, aiReviewFilter });
      expect(counts.result[aiReviewFilter]).toBe(expectedIds.length);
      expect(Object.keys(page.result.attributions)).toEqual(expectedIds);

      const navigation = await locate({
        ...criteria,
        aiReviewFilter,
        targetAttributionUuid: targetId,
        navigationScope: 'all',
      });
      expect(navigation.result).toMatchObject({ found: true });
      expect(navigation.result).toHaveProperty('prefix', page.result);
    },
  );

  it('does not locate a deferred attribution among fully resolved results', async () => {
    const navigation = await locate({
      ...criteria,
      aiReviewFilter: 'fullyResolved',
      targetAttributionUuid: 'allStatuses',
      navigationScope: 'all',
    });
    expect(navigation.result).toEqual({ found: false });
  });

  it('applies search to every category while preserving overlapping counts', async () => {
    const counts = await getAiReviewCounts({
      ...criteria,
      search: 'AI all statuses',
    });
    expect(counts.result).toEqual({
      all: 1,
      deferred: 1,
      needsFollowUp: 1,
      humanModified: 1,
      fullyResolved: 0,
    });
    const empty = await getAiReviewCounts({
      ...criteria,
      search: 'no matches',
    });
    expect(empty.result).toEqual({
      all: 0,
      deferred: 0,
      needsFollowUp: 0,
      humanModified: 0,
      fullyResolved: 0,
    });
  });

  it('uses the same readonly eligibility as the list', async () => {
    const counts = await getAiReviewCounts({
      ...criteria,
      includeReadonly: false,
    });
    const page = await allPage({ ...criteria, includeReadonly: false });
    expect(counts.result.all).toBe(
      Object.keys(page.result.attributions).length,
    );
    expect(counts.result.deferred).toBe(2);
    expect(page.result.attributions.readonly).toBeUndefined();
  });
});
