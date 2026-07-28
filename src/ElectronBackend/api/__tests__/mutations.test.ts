// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Criticality } from '../../../shared/shared-types';
import {
  initializeDbWithTestData,
  pathsToResources,
} from '../../../testing/global-test-helpers';
import { listAttributions } from '../listAttributions';
import { mutations } from '../mutations';

describe('attribution resource access', () => {
  it('makes a newly linked attribution visible without reloading the file', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/writable/file.ts']),
    });

    const { result } = await mutations.createOrMatchAttributions({
      resourcePath: '/writable/file.ts',
      attributions: {
        new: { id: 'new', criticality: Criticality.None },
      },
    });

    const { result: attributions } = await listAttributions({
      external: false,
    });

    expect(Object.values(result.inputKeysToNewUuids)).toEqual([
      expect.any(String),
    ]);
    expect(Object.keys(attributions)).toEqual(
      Object.values(result.inputKeysToNewUuids),
    );
  });

  it('hides an attribution after its last writable link is removed', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/readonly/file.ts', '/writable/file.ts']),
      manualAttributions: {
        attributions: {
          shared: { id: 'shared', criticality: Criticality.None },
        },
        resourcesToAttributions: {
          '/readonly/file.ts': ['shared'],
          '/writable/file.ts': ['shared'],
        },
        attributionsToResources: {},
      },
      readonlyRules: [{ path: '/readonly', readonly: true }],
    });

    await mutations.unlinkResourceFromAttributions({
      resourcePath: '/writable/file.ts',
      attributionUuids: ['shared'],
    });

    const { result: attributions } = await listAttributions({
      external: false,
    });

    expect(attributions).toEqual({});
  });
});
