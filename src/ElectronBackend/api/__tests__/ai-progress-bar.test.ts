// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  initializeDbWithTestData,
  pathsToResources,
} from '../../../testing/global-test-helpers';
import {
  getAiProgressBarData,
  getNextAttributionToReviewForAi,
  hasAiAttributions,
} from '../ai-progress-bar';

async function initializeAiData() {
  await initializeDbWithTestData({
    resources: pathsToResources([
      '/folder/file.ts',
      '/other.ts',
      '/readonly.ts',
    ]),
    readonlyRules: [{ path: '/readonly.ts', readonly: true }],
    manualAttributions: {
      attributions: {
        a: { id: 'a', criticality: 0, aiAttributions: { deferredFields: {} } },
        b: {
          id: 'b',
          criticality: 0,
          aiAttributions: { deferredFields: {}, humanModified: false },
        },
        c: {
          id: 'c',
          criticality: 0,
          aiAttributions: { deferredFields: {}, humanModified: true },
        },
        d: { id: 'd', criticality: 0, aiAttributions: {} },
        e: { id: 'e', criticality: 0, aiAttributions: { humanModified: true } },
        f: { id: 'f', criticality: 0, aiAttributions: { deferredFields: {} } },
        readonly: {
          id: 'readonly',
          criticality: 0,
          aiAttributions: { deferredFields: {} },
        },
        ordinary: { id: 'ordinary', criticality: 0 },
      },
      resourcesToAttributions: {
        '/folder': ['a', 'b', 'c', 'd', 'e', 'ordinary'],
        '/other.ts': ['a', 'f'],
        '/readonly.ts': ['a', 'readonly'],
      },
      attributionsToResources: {
        a: ['/folder', '/other.ts', '/readonly.ts'],
        b: ['/folder'],
        c: ['/folder'],
        d: ['/folder'],
        e: ['/folder'],
        f: ['/other.ts'],
        ordinary: ['/folder'],
        readonly: ['/readonly.ts'],
      },
    },
    externalAttributions: {
      attributions: {
        signal: {
          id: 'signal',
          criticality: 0,
          aiAttributions: { deferredFields: {} },
        },
      },
      resourcesToAttributions: { '/other.ts': ['signal'] },
      attributionsToResources: { signal: ['/other.ts'] },
    },
  });
}

test('counts distinct writable manual AI attributions in all four states', async () => {
  await initializeAiData();
  expect((await getAiProgressBarData()).result).toEqual({
    nonDeferredUnmodified: 1,
    nonDeferredModified: 1,
    deferredModified: 1,
    deferredUnmodified: 3,
  });
});

test('cycles through pending attributions on folders and files and wraps around', async () => {
  await initializeAiData();
  expect(
    (
      await getNextAttributionToReviewForAi({
        selectedResourcePath: '/',
        selectedAttributionUuid: '',
      })
    ).result,
  ).toEqual({ attributionUuid: 'a', resourcePath: '/folder/' });
  expect(
    (
      await getNextAttributionToReviewForAi({
        selectedResourcePath: '/folder/',
        selectedAttributionUuid: 'a',
      })
    ).result,
  ).toEqual({ attributionUuid: 'b', resourcePath: '/folder/' });
  expect(
    (
      await getNextAttributionToReviewForAi({
        selectedResourcePath: '/folder/',
        selectedAttributionUuid: 'b',
      })
    ).result,
  ).toEqual({ attributionUuid: 'f', resourcePath: '/other.ts' });
  expect(
    (
      await getNextAttributionToReviewForAi({
        selectedResourcePath: '/other.ts',
        selectedAttributionUuid: 'f',
      })
    ).result,
  ).toEqual({ attributionUuid: 'a', resourcePath: '/folder/' });
});

test('keeps AI availability without pending or writable manual AI attributions', async () => {
  await initializeDbWithTestData({
    resources: pathsToResources(['/file.ts']),
    readonlyRules: [{ path: '/', readonly: true }],
    manualAttributions: {
      attributions: { ai: { id: 'ai', criticality: 0, aiAttributions: {} } },
      resourcesToAttributions: { '/file.ts': ['ai'] },
      attributionsToResources: { ai: ['/file.ts'] },
    },
  });
  expect((await hasAiAttributions()).result).toBe(true);
  expect((await getAiProgressBarData()).result).toEqual({
    nonDeferredUnmodified: 0,
    nonDeferredModified: 0,
    deferredModified: 0,
    deferredUnmodified: 0,
  });
  expect(
    (
      await getNextAttributionToReviewForAi({
        selectedResourcePath: '/',
        selectedAttributionUuid: '',
      })
    ).result,
  ).toBeNull();
});

test('reports no AI availability for a project without AI metadata', async () => {
  await initializeDbWithTestData();
  expect((await hasAiAttributions()).result).toBe(false);
});

test('finds the first writable link of a widely linked pending attribution and skips unlinked or readonly-only candidates', async () => {
  const writablePaths = Array.from(
    { length: 2048 },
    (_, index) => `/folder/file-${String(index).padStart(4, '0')}.ts`,
  );
  const readonlyPath = '/a-readonly.ts';
  const links = [readonlyPath, ...writablePaths];
  await initializeDbWithTestData({
    resources: pathsToResources(links),
    readonlyRules: [{ path: readonlyPath, readonly: true }],
    manualAttributions: {
      attributions: {
        unlinked: {
          id: 'unlinked',
          criticality: 0,
          aiAttributions: { deferredFields: {} },
        },
        readonly: {
          id: 'readonly',
          criticality: 0,
          aiAttributions: { deferredFields: {} },
        },
        pending: {
          id: 'pending',
          criticality: 0,
          aiAttributions: { deferredFields: {} },
        },
        modified: {
          id: 'modified',
          criticality: 0,
          aiAttributions: { deferredFields: {}, humanModified: true },
        },
        nonDeferred: { id: 'nonDeferred', criticality: 0, aiAttributions: {} },
      },
      resourcesToAttributions: {
        ...Object.fromEntries(
          writablePaths.map((path) => [
            path,
            ['pending', 'modified', 'nonDeferred'],
          ]),
        ),
        [readonlyPath]: ['readonly', 'pending'],
      },
      attributionsToResources: {
        unlinked: [],
        readonly: [readonlyPath],
        pending: links,
        modified: writablePaths,
        nonDeferred: writablePaths,
      },
    },
  });
  expect(
    (
      await getNextAttributionToReviewForAi({
        selectedResourcePath: '/',
        selectedAttributionUuid: '',
      })
    ).result,
  ).toEqual({ attributionUuid: 'pending', resourcePath: writablePaths[0] });
});
