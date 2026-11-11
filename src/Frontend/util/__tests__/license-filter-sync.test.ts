// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import {
  filterCompatibleLicenses,
  mergeLicenseSelections,
  sameLicenseSelection,
} from '../license-filter-sync';

const mit = { id: 'mit', label: 'MIT' };
const apache = { id: 'apache-2.0', label: 'Apache-2.0' };
const bsd = { id: 'bsd-3-clause', label: 'BSD-3-Clause' };

describe('sameLicenseSelection', () => {
  it('ignores the order of licenses and searches', () => {
    expect(
      sameLicenseSelection(
        {
          licenses: [mit, apache],
          licenseSearches: ['apache', 'mit'],
        },
        {
          licenses: [apache, mit],
          licenseSearches: ['mit', 'apache'],
        },
      ),
    ).toBe(true);
  });

  it('distinguishes different licenses and searches', () => {
    expect(
      sameLicenseSelection(
        { licenses: [mit], licenseSearches: [] },
        { licenses: [apache], licenseSearches: [] },
      ),
    ).toBe(false);
    expect(
      sameLicenseSelection(
        { licenses: [mit], licenseSearches: ['apache'] },
        { licenses: [mit], licenseSearches: ['mit'] },
      ),
    ).toBe(false);
    expect(
      sameLicenseSelection(
        { licenses: [mit], licenseSearches: [] },
        { licenses: [mit, apache], licenseSearches: [] },
      ),
    ).toBe(false);
  });
});

describe('filterCompatibleLicenses', () => {
  it('keeps only licenses offered by the target panel', () => {
    expect(
      filterCompatibleLicenses([mit, apache, bsd], new Set([mit.id, bsd.id])),
    ).toEqual([mit, bsd]);
  });
});

describe('mergeLicenseSelections', () => {
  it('unions licenses by id and searches without duplicates', () => {
    expect(
      mergeLicenseSelections(
        { licenses: [mit, apache], licenseSearches: ['mit'] },
        { licenses: [apache, bsd], licenseSearches: ['mit', 'apache'] },
      ),
    ).toEqual({
      licenses: [mit, apache, bsd],
      licenseSearches: ['mit', 'apache'],
    });
  });
});
