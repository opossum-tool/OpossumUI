// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useMemo, useState } from 'react';

import type { Attributions, PackageInfo } from '../../../shared/shared-types';
import { isPackageInvalid } from '../../util/input-validation';
import type { PackagePatch } from '../AttributionForm/attribution-form.types';
import {
  AUDITING_PROPERTY_NAMES,
  type AuditingProperty,
} from '../AttributionForm/AuditingOptions/AuditingOptions.types';
import {
  canTransfer,
  type ComparisonItem,
  EDITABLE_KEYS,
  type FormAttribute,
  hasPackageInfoChanges,
  isEditable,
  type Side,
} from './DiffPopup.util';

export interface ComparisonState {
  items: Record<Side, ComparisonItem>;
  drafts: Record<Side, PackageInfo>;
  dirty: Record<Side, boolean>;
  acceptedAttributions: Attributions;
  mutationCandidates: Attributions;
  canSave: boolean;
  onChange: (side: Side, patch: PackagePatch) => void;
  onCopy: (source: Side, destination: Side, key: FormAttribute) => void;
  onUndo: (side: Side, key: FormAttribute) => void;
  onUndoAuditing: (side: Side) => void;
}

export function useComparisonState(
  leftItem: ComparisonItem,
  rightItem: ComparisonItem,
  isBusy: boolean,
): ComparisonState {
  // These snapshots deliberately belong to the mounted popup session. The
  // parent supplies a key when comparison IDs change, and closes by unmounting.
  const [items] = useState<Record<Side, ComparisonItem>>(() => ({
    left: leftItem,
    right: rightItem,
  }));
  const [drafts, setDrafts] = useState<Record<Side, PackageInfo>>(() => ({
    left: { ...leftItem.packageInfo },
    right: { ...rightItem.packageInfo },
  }));
  const saveState = useMemo(() => {
    const acceptedAttributions: Attributions = {};
    const mutationCandidates: Attributions = {};
    const dirty: Record<Side, boolean> = { left: false, right: false };

    (['left', 'right'] as const).forEach((side) => {
      const item = items[side];
      const draft = drafts[side];
      const persisted = item.originalPackageInfo ?? item.packageInfo;
      const editable = isEditable(item);
      const changedSinceOpening = hasPackageInfoChanges(
        draft,
        item.packageInfo,
        editable,
        EDITABLE_KEYS,
      );
      const requiresPersistence = hasPackageInfoChanges(
        draft,
        persisted,
        editable,
        EDITABLE_KEYS,
      );
      dirty[side] = requiresPersistence;

      if (
        !editable ||
        !item.packageInfo.id ||
        (!changedSinceOpening && !requiresPersistence)
      ) {
        return;
      }
      acceptedAttributions[item.packageInfo.id] = requiresPersistence
        ? draft
        : persisted;
      if (requiresPersistence) {
        mutationCandidates[item.packageInfo.id] = draft;
      }
    });

    return { acceptedAttributions, mutationCandidates, dirty };
  }, [drafts, items]);
  const canSave =
    Object.keys(saveState.acceptedAttributions).length > 0 &&
    !Object.values(saveState.acceptedAttributions).some(isPackageInvalid);

  function onChange(side: Side, patch: PackagePatch) {
    if (!isEditable(items[side])) {
      return;
    }
    setDrafts((current) => ({
      ...current,
      [side]: { ...current[side], ...patch },
    }));
  }

  function onCopy(source: Side, destination: Side, key: FormAttribute) {
    setDrafts((current) => {
      if (!canTransfer(source, destination, key, current, items, isBusy)) {
        return current;
      }
      return {
        ...current,
        [destination]: {
          ...current[destination],
          [key]: current[source][key],
        },
      };
    });
  }

  function onUndo(side: Side, key: FormAttribute) {
    if (isBusy || !isEditable(items[side])) {
      return;
    }
    setDrafts((current) => ({
      ...current,
      [side]: { ...current[side], [key]: items[side].packageInfo[key] },
    }));
  }

  function onUndoAuditing(side: Side) {
    if (isBusy || !isEditable(items[side])) {
      return;
    }
    setDrafts((current) => ({
      ...current,
      [side]: restoreProperties(
        current[side],
        items[side].packageInfo,
        AUDITING_PROPERTY_NAMES,
      ),
    }));
  }

  return {
    ...saveState,
    drafts,
    items,
    canSave,
    onChange,
    onCopy,
    onUndo,
    onUndoAuditing,
  };
}

function restoreProperties(
  packageInfo: PackageInfo,
  baseline: PackageInfo,
  properties: ReadonlyArray<AuditingProperty>,
): PackageInfo {
  return properties.reduce(
    (restored, property) => ({
      ...restored,
      [property]: baseline[property],
    }),
    packageInfo,
  );
}
