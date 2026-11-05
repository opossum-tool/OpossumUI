// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { LicenseOption } from '../../../shared/shared-types';
import { normalizeLicenseSearch } from '../../../shared/text-search';

export interface LicenseSelection {
  licenses: Array<LicenseOption>;
  licenseSearches: Array<string>;
}

export type LicenseView = 'all' | 'selected';

export type LicenseEditorRow = { id: string; label: string } & (
  | { kind: 'exact'; option: LicenseOption }
  | { kind: 'search' }
  | { kind: 'suggestion'; disabled: boolean }
);

export function buildLicenseEditorRows({
  licenses,
  selection,
  search,
  view,
}: {
  licenses: Array<LicenseOption>;
  selection: LicenseSelection;
  search: string;
  view: LicenseView;
}) {
  const trimmedSearch = search.trim();
  const normalizedSearch = normalizeLicenseSearch(trimmedSearch);
  const duplicate = selection.licenseSearches.some(
    (value) => normalizeLicenseSearch(value.trim()) === normalizedSearch,
  );
  const selectedIds = new Set(selection.licenses.map((option) => option.id));
  const byId = new Map(selection.licenses.map((option) => [option.id, option]));
  licenses.forEach((option) => byId.set(option.id, option));
  const exactRows: Array<LicenseEditorRow> = [...byId.values()]
    .filter((option) => view === 'all' || selectedIds.has(option.id))
    .map((option) => ({
      id: `exact:${option.id}`,
      label: option.label,
      kind: 'exact',
      option,
    }));
  const searchRows: Array<LicenseEditorRow> =
    view === 'selected'
      ? selection.licenseSearches.map((value) => ({
          id: `search:${normalizeLicenseSearch(value)}`,
          label: value,
          kind: 'search',
        }))
      : [];
  const rows = [...exactRows, ...searchRows]
    .filter((row) =>
      normalizeLicenseSearch(
        row.kind === 'exact' ? row.option.id : row.label,
      ).includes(normalizedSearch),
    )
    .toSorted((a, b) => a.label.localeCompare(b.label));
  if (view === 'all' && normalizedSearch) {
    rows.unshift({
      id: `suggestion:${normalizedSearch}`,
      label: trimmedSearch,
      kind: 'suggestion',
      disabled: duplicate,
    });
  }
  return { rows, trimmedSearch, duplicate };
}
