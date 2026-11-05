// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expressionBuilder } from 'kysely';

import type { LicenseConditions } from '../../../shared/attribution-filters';
import { normalizeLicenseSearch } from '../../../shared/text-search';
import { getDb, resetDb } from '../../db/db';
import type { DB } from '../../db/generated/databaseTypes';
import { getLicenseFilterExpression } from '../filters';
import { hasActiveFilters } from '../resourceTreeFilters';
import { toCanonicalLicenseName } from '../utils';

describe('license search agreement with SQLite', () => {
  beforeAll(resetDb);

  it.each<[string | null, string, boolean]>([
    ['Apache-2.0', 'pAcHe', true],
    ['Apache-2.0', 'apache2.0', true],
    ['Ä-License', 'ä', false],
    ['ä-License', 'ä', true],
    ['Ä-License', 'Ä-lIcEnSe', true],
    ['', 'MIT', false],
    [null, 'MIT', false],
  ])('matches %j against %j as %s', async (value, query, expected) => {
    const eb = expressionBuilder<DB, 'attribution'>();
    const expression = getLicenseFilterExpression(
      eb,
      toCanonicalLicenseName(eb.val(value)),
      { licenseSearches: [query] },
    );
    const result = await getDb()
      .selectNoFrom(eb.parens(expression ?? eb.val(false)).as('matches'))
      .executeTakeFirstOrThrow();
    expect(Boolean(result.matches)).toBe(expected);
    expect(
      value !== null &&
        normalizeLicenseSearch(value).includes(normalizeLicenseSearch(query)),
    ).toBe(expected);
  });
});

describe('license filter activation', () => {
  it.each<{ conditions?: LicenseConditions; active: boolean }>([
    { active: false },
    { conditions: {}, active: false },
    { conditions: { licenseIds: [], licenseSearches: [] }, active: false },
    { conditions: { licenseIds: ['mit'] }, active: true },
    { conditions: { licenseSearches: ['MIT'] }, active: true },
    { conditions: { licenseSearches: ['---'] }, active: false },
  ])(
    'keeps expression and tree activation aligned for $conditions',
    ({ conditions, active }) => {
      const eb = expressionBuilder<DB, 'attribution'>();
      const expression = getLicenseFilterExpression(
        eb,
        eb.ref('canonical_license_name'),
        conditions ?? {},
      );
      expect(Boolean(expression)).toBe(active);
      expect(
        hasActiveFilters({
          licenseFilter: conditions
            ? {
                ...conditions,
                licenseIds: conditions.licenseIds ?? [],
                external: true,
              }
            : undefined,
        }),
      ).toBe(active);
    },
  );
});
