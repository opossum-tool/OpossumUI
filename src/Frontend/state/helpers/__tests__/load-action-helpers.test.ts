// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { Attributions } from '../../../../shared/shared-types';
import { createExternalAttributionsToHashes } from '../load-action-helpers';

describe('createExternalAttributionsToHashes', () => {
  it('yields correct results', () => {
    const testExternalAttributions: Attributions = {
      uuid1: {
        attributionConfidence: 1,
        comment: 'comment1',
        packageName: 'name',
        originIds: ['abc'],
        preSelected: true,
      },
      uuid2: {
        attributionConfidence: 2,
        comment: 'comment2',
        packageName: 'name',
        originIds: ['def'],
        preSelected: false,
      },
      uuid3: {
        packageName: 'name',
      },
      uuid4: {
        licenseName: '',
        firstParty: true,
      },
      uuid5: {
        firstParty: true,
      },
      uuid6: {
        packageName: '',
      },
      uuid7: {
        firstParty: false,
      },
    };

    const testExternalAttributionsToHashes = createExternalAttributionsToHashes(
      testExternalAttributions
    );

    expect(testExternalAttributionsToHashes.uuid1).toBeDefined();
    expect(testExternalAttributionsToHashes.uuid2).toBeDefined();
    expect(testExternalAttributionsToHashes.uuid3).toBeDefined();
    expect(testExternalAttributionsToHashes.uuid4).toBeDefined();
    expect(testExternalAttributionsToHashes.uuid5).toBeDefined();
    expect(testExternalAttributionsToHashes.uuid6).toBeUndefined();
    expect(testExternalAttributionsToHashes.uuid7).toBeUndefined();

    expect(testExternalAttributionsToHashes.uuid1).toEqual(
      testExternalAttributionsToHashes.uuid2
    );
    expect(testExternalAttributionsToHashes.uuid1).toEqual(
      testExternalAttributionsToHashes.uuid3
    );
    expect(testExternalAttributionsToHashes.uuid1).not.toEqual(
      testExternalAttributionsToHashes.uuid4
    );
    expect(testExternalAttributionsToHashes.uuid4).toEqual(
      testExternalAttributionsToHashes.uuid5
    );
  });
});
