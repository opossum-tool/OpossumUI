// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { FORM_ATTRIBUTES } from '../../../shared/attribution-comparison';
import type { PackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import type { PackagePatch } from '../AttributionForm/attribution-form.types';
import {
  AUDITING_PROPERTY_NAMES,
  type AuditingProperty,
} from '../AttributionForm/AuditingOptions/AuditingOptions.types';
import {
  PACKAGE_FIELD_KEYS,
  PACKAGE_FIELD_METADATA,
} from '../AttributionForm/PackageAutocomplete/PackageAutocomplete';

export type Side = 'left' | 'right';
export type FormAttribute = (typeof FORM_ATTRIBUTES)[number];
type EditableKey = FormAttribute | AuditingProperty;

const OPTIONAL_BOOLEAN_PROPERTIES: Array<EditableKey> = [
  'firstParty',
  'followUp',
  'needsReview',
  'excludeFromNotice',
  'preferred',
];

export const EDITABLE_KEYS: Array<EditableKey> = [
  ...FORM_ATTRIBUTES,
  ...AUDITING_PROPERTY_NAMES,
];

export interface ComparisonItem {
  packageInfo: PackageInfo;
  originalPackageInfo?: PackageInfo;
  isExternal: boolean;
  label: string;
  editable?: boolean;
}

export interface FieldDefinition {
  key: FormAttribute;
  label: string;
  multiline?: boolean;
  rows?: number;
}

const MULTILINE_DEFAULT_ROWS = 5;

export const COORDINATE_FIELDS: Array<FieldDefinition> = PACKAGE_FIELD_KEYS.map(
  (key) => ({ key, label: PACKAGE_FIELD_METADATA[key].label }),
);

export const ATTRIBUTION_TYPE_FIELD: FieldDefinition = {
  key: 'firstParty',
  label: text.diffPopup.attributionType,
};

export const LEGAL_FIELDS: Array<FieldDefinition> = [
  {
    key: 'copyright',
    label: text.diffPopup.copyright,
    multiline: true,
    rows: MULTILINE_DEFAULT_ROWS,
  },
  {
    key: 'licenseName',
    label: text.attributionColumn.licenseExpression,
  },
  {
    key: 'licenseText',
    label: text.attributionColumn.licenseText,
    multiline: true,
    rows: MULTILINE_DEFAULT_ROWS,
  },
];

export const NOTE_FIELDS: Array<FieldDefinition> = [
  {
    key: 'comment',
    label: text.diffPopup.comment,
    multiline: true,
    rows: MULTILINE_DEFAULT_ROWS,
  },
];

export type UpdateField = (side: Side, patch: PackagePatch) => void;

export function isEditable(item: ComparisonItem): boolean {
  return (
    !item.isExternal &&
    item.packageInfo.resourceAccess !== 'readonly' &&
    (item.editable ?? true)
  );
}

export function hasPackageInfoChanges(
  packageInfo: PackageInfo,
  baseline: PackageInfo,
  editable: boolean,
  keys: ReadonlyArray<EditableKey>,
): boolean {
  return (
    editable &&
    keys.some(
      (key) =>
        valueForComparison(key, packageInfo[key]) !==
        valueForComparison(key, baseline[key]),
    )
  );
}

export function valueForComparison(
  property: EditableKey,
  value: PackageInfo[EditableKey],
): string | number | boolean {
  if (OPTIONAL_BOOLEAN_PROPERTIES.includes(property)) {
    return value === true;
  }
  return value ?? '';
}

function isLegalField(key: FormAttribute) {
  return key === 'copyright' || key === 'licenseName' || key === 'licenseText';
}

export function isLegalFieldDisabled(key: FormAttribute, draft: PackageInfo) {
  return isLegalField(key) && draft.firstParty === true;
}

export function isFieldVisible(key: FormAttribute, draft: PackageInfo) {
  return !isLegalFieldDisabled(key, draft);
}

function isTransferAllowed(
  key: FormAttribute,
  drafts: Record<Side, PackageInfo>,
) {
  return (
    key !== 'comment' ||
    (drafts.left.firstParty === true) === (drafts.right.firstParty === true)
  );
}

export function canTransfer(
  source: Side,
  destination: Side,
  key: FormAttribute,
  drafts: Record<Side, PackageInfo>,
  items: Record<Side, ComparisonItem>,
  isBusy: boolean,
) {
  const sourceDraft = drafts[source];
  const destinationDraft = drafts[destination];
  return (
    !isBusy &&
    key !== 'firstParty' &&
    isEditable(items[destination]) &&
    isFieldVisible(key, sourceDraft) &&
    isFieldVisible(key, destinationDraft) &&
    !isLegalFieldDisabled(key, destinationDraft) &&
    isTransferAllowed(key, drafts) &&
    valueForComparison(key, sourceDraft[key]) !==
      valueForComparison(key, destinationDraft[key])
  );
}
