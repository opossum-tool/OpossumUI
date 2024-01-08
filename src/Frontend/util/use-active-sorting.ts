// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { text } from '../../shared/text';
import { useVariable } from './use-variable';

export const auditViewSorting = Object.values(text.auditViewSorting);
export const attributionViewSorting = Object.values(
  text.attributionViewSorting,
);
export type AuditViewSorting = (typeof auditViewSorting)[number];
export type AttributionViewSorting = (typeof attributionViewSorting)[number];

export function useActiveSorting(): [
  AuditViewSorting,
  (
    newValue: AuditViewSorting | ((prev: AuditViewSorting) => AuditViewSorting),
  ) => void,
] {
  const [activeSorting, setActiveSorting] = useVariable<AuditViewSorting>(
    'active-sorting-audit-view',
    text.auditViewSorting.byOccurrence,
  );

  return [activeSorting, setActiveSorting];
}

export function useActiveSortingInAttributionView(): [
  AttributionViewSorting,
  (
    newValue:
      | AttributionViewSorting
      | ((prev: AttributionViewSorting) => AttributionViewSorting),
  ) => void,
] {
  const [activeSorting, setActiveSorting] = useVariable<AttributionViewSorting>(
    'active-sorting-attribution-view',
    text.attributionViewSorting.alphabetical,
  );

  return [activeSorting, setActiveSorting];
}
