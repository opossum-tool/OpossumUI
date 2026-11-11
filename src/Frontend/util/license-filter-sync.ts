// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { LicenseOption } from '../../shared/shared-types';

export interface LicenseFilterSelection {
  licenses: Array<LicenseOption>;
  licenseSearches: Array<string>;
}

function licenseSignature(licenses: Array<LicenseOption>): Array<string> {
  return licenses.map(({ id }) => id).toSorted();
}

function searchSignature(searches: Array<string>): Array<string> {
  return searches.map((search) => search.trim()).toSorted();
}

function sameSignature(a: Array<string>, b: Array<string>): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

/** Order-insensitive equality of a license filter selection. */
export function sameLicenseSelection(
  a: LicenseFilterSelection,
  b: LicenseFilterSelection,
): boolean {
  return (
    sameSignature(licenseSignature(a.licenses), licenseSignature(b.licenses)) &&
    sameSignature(
      searchSignature(a.licenseSearches),
      searchSignature(b.licenseSearches),
    )
  );
}

/** Keeps only licenses the target panel offers. */
export function filterCompatibleLicenses(
  licenses: Array<LicenseOption>,
  offeredIds: ReadonlySet<string>,
): Array<LicenseOption> {
  return licenses.filter(({ id }) => offeredIds.has(id));
}

/** Union of two selections; the first selection's entries win. */
export function mergeLicenseSelections(
  a: LicenseFilterSelection,
  b: LicenseFilterSelection,
): LicenseFilterSelection {
  const licensesById = new Map(a.licenses.map((option) => [option.id, option]));
  for (const option of b.licenses) {
    if (!licensesById.has(option.id)) {
      licensesById.set(option.id, option);
    }
  }
  const licenseSearches = [...a.licenseSearches];
  for (const search of b.licenseSearches) {
    if (!licenseSearches.includes(search)) {
      licenseSearches.push(search);
    }
  }
  return { licenses: [...licensesById.values()], licenseSearches };
}
