// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { initializeDbWithTestData } from '../../../testing/global-test-helpers';
import { getDb } from '../db';
import { getReadonlyRules, setReadonlyRules } from '../split-info';

const readonlyRules = [{ path: '/folder', readonly: true }];

describe('split info database state', () => {
  beforeEach(async () => {
    await initializeDbWithTestData();
  });

  it('returns readonly rules as split metadata', async () => {
    await setReadonlyRules(readonlyRules);

    expect(await getReadonlyRules()).toEqual(readonlyRules);
  });

  it('clears split metadata when no readonly rules remain', async () => {
    await setReadonlyRules(readonlyRules);

    await setReadonlyRules([]);

    expect(await getReadonlyRules()).toEqual([]);
    expect(
      await getDb().selectFrom('readonly_rule').selectAll().execute(),
    ).toEqual([]);
  });
});
