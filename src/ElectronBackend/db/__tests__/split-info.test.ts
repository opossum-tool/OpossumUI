// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { initializeDbWithTestData } from '../../../testing/global-test-helpers';
import { getDb } from '../db';
import { createSplitInfo, deleteSplitInfo, getSplitInfo } from '../split-info';

const splitInfo = {
  splitId: 'split-id',
  inputSha256: 'a'.repeat(64),
  readonlyRules: [{ path: '/folder', readonly: true }],
};

describe('split info database state', () => {
  beforeEach(async () => {
    await initializeDbWithTestData();
  });

  it('enforces a single split identity', async () => {
    await createSplitInfo(splitInfo);

    await expect(
      createSplitInfo({ ...splitInfo, splitId: 'another-split-id' }),
    ).rejects.toThrow();
    expect(await getSplitInfo()).toEqual(splitInfo);
  });

  it('deletes the split identity and its readonly rules', async () => {
    await createSplitInfo(splitInfo);

    await deleteSplitInfo();

    expect(await getSplitInfo()).toBeNull();
    expect(
      await getDb().selectFrom('readonly_rule').selectAll().execute(),
    ).toEqual([]);
  });
});
