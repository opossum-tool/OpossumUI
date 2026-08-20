// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { Selectable } from 'kysely';

import type { PackageInfo, Source } from '../../shared/shared-types';
import type { Attribution } from './generated/databaseTypes';

type AttributionRow = Selectable<Attribution>;

const knownKeys = new Set([
  'id',
  'source',
  'originalAttributionSource',
  'resourceAccess',
  'resources',
  'count',
  'relation',
  'suffix',
  'synthetic',
  'preSelected',
  'criticality',
  'classification',
  'firstParty',
  'excludeFromNotice',
  'wasPreferred',
  'copyright',
  'licenseName',
  'licenseText',
  'url',
  'packageName',
  'packageNamespace',
  'packageVersion',
  'packageType',
  'packagePURLAppendix',
  'attributionConfidence',
  'followUp',
  'needsReview',
  'preferred',
  'originalAttributionId',
  'originalAttributionWasPreferred',
  'originIds',
  'preferredOverOriginIds',
  'comment',
] satisfies Array<keyof PackageInfo>);

export function getAttributionExtensionData(attribution: PackageInfo) {
  return Object.fromEntries(
    Object.entries(attribution).filter(
      ([key]) => !knownKeys.has(key as keyof PackageInfo),
    ),
  );
}

function optionalBoolean(value: boolean | undefined): number {
  return Number(value ?? false);
}

function optionalValue<T>(value: T | undefined): T | null {
  return value ?? null;
}

function optionalString(value: string | undefined): string | null {
  return value || null;
}

function optionalStringArray(value: Array<string> | undefined): string | null {
  return value === undefined ? null : JSON.stringify(value);
}

function stringArrayFromColumn(
  value: string | null,
  name: string,
): Array<string> | undefined {
  if (value === null) {
    return undefined;
  }
  const parsed: unknown = JSON.parse(value);
  if (
    !Array.isArray(parsed) ||
    parsed.some((item) => typeof item !== 'string')
  ) {
    throw new TypeError(`${name} must contain an array of strings`);
  }
  return parsed as Array<string>;
}

function removeUndefinedProperties<T extends object>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, property]) => property !== undefined),
  ) as T;
}

export function getAttributionPersistenceValues(attribution: PackageInfo) {
  const source = sourceColumnValues(attribution.source);
  const originalAttributionSource = sourceColumnValues(
    attribution.originalAttributionSource,
  );

  return {
    additional_data: JSON.stringify(getAttributionExtensionData(attribution)),
    pre_selected: optionalBoolean(attribution.preSelected),
    criticality: attribution.criticality,
    classification: optionalValue(attribution.classification),
    first_party: optionalBoolean(attribution.firstParty),
    exclude_from_notice: optionalBoolean(attribution.excludeFromNotice),
    was_preferred: optionalBoolean(attribution.wasPreferred),
    copyright: optionalString(attribution.copyright),
    license_name: optionalString(attribution.licenseName),
    license_text: optionalString(attribution.licenseText),
    url: optionalString(attribution.url),
    package_name: optionalString(attribution.packageName),
    package_namespace: optionalString(attribution.packageNamespace),
    package_version: optionalString(attribution.packageVersion),
    package_type: optionalString(attribution.packageType),
    package_purl_appendix: optionalString(attribution.packagePURLAppendix),
    attribution_confidence: optionalValue(attribution.attributionConfidence),
    follow_up: optionalBoolean(attribution.followUp),
    needs_review: optionalBoolean(attribution.needsReview),
    preferred: optionalBoolean(attribution.preferred),
    original_attribution_id: optionalString(attribution.originalAttributionId),
    original_attribution_was_preferred: optionalBoolean(
      attribution.originalAttributionWasPreferred,
    ),
    origin_ids: optionalStringArray(attribution.originIds),
    preferred_over_origin_ids: optionalStringArray(
      attribution.preferredOverOriginIds,
    ),
    comment: optionalString(attribution.comment),
    source_name: source.name,
    source_document_confidence: source.documentConfidence,
    source_additional_name: source.additionalName,
    original_attribution_source_name: originalAttributionSource.name,
    original_attribution_source_document_confidence:
      originalAttributionSource.documentConfidence,
    original_attribution_source_additional_name:
      originalAttributionSource.additionalName,
  };
}

function sourceFromColumns(
  name: string | null,
  documentConfidence: number | null,
  additionalName: string | null,
): Source | undefined {
  return name !== null && name !== undefined
    ? removeUndefinedProperties({
        name,
        documentConfidence: documentConfidence ?? undefined,
        additionalName: additionalName ?? undefined,
      })
    : undefined;
}

function sourceFromRow(row: AttributionRow): Source | undefined {
  return sourceFromColumns(
    row.source_name,
    row.source_document_confidence,
    row.source_additional_name,
  );
}

function sourceColumnValues(source: Source | undefined): {
  name: string | null;
  documentConfidence: number | null;
  additionalName: string | null;
} {
  if (source === undefined) {
    return { name: null, documentConfidence: null, additionalName: null };
  }
  return {
    name: source.name,
    documentConfidence: optionalValue(source.documentConfidence),
    additionalName: optionalValue(source.additionalName),
  };
}

export function packageInfoFromAttributionRow(
  row: AttributionRow,
): PackageInfo {
  const additionalData = JSON.parse(row.additional_data) as Record<
    string,
    unknown
  >;
  return removeUndefinedProperties({
    ...additionalData,
    id: row.uuid,
    preSelected: Boolean(row.pre_selected),
    criticality: row.criticality,
    classification: row.classification ?? undefined,
    firstParty: Boolean(row.first_party),
    excludeFromNotice: Boolean(row.exclude_from_notice),
    wasPreferred: Boolean(row.was_preferred),
    copyright: row.copyright ?? undefined,
    licenseName: row.license_name ?? undefined,
    licenseText: row.license_text ?? undefined,
    url: row.url ?? undefined,
    packageName: row.package_name ?? undefined,
    packageNamespace: row.package_namespace ?? undefined,
    packageVersion: row.package_version ?? undefined,
    packageType: row.package_type ?? undefined,
    packagePURLAppendix: row.package_purl_appendix ?? undefined,
    attributionConfidence: row.attribution_confidence ?? undefined,
    followUp: Boolean(row.follow_up),
    needsReview: Boolean(row.needs_review),
    preferred: Boolean(row.preferred),
    originalAttributionId: row.original_attribution_id ?? undefined,
    originalAttributionWasPreferred: Boolean(
      row.original_attribution_was_preferred,
    ),
    originIds: stringArrayFromColumn(row.origin_ids, 'origin_ids'),
    preferredOverOriginIds: stringArrayFromColumn(
      row.preferred_over_origin_ids,
      'preferred_over_origin_ids',
    ),
    originalAttributionSource: sourceFromColumns(
      row.original_attribution_source_name,
      row.original_attribution_source_document_confidence,
      row.original_attribution_source_additional_name,
    ),
    comment: row.comment ?? undefined,
    source: sourceFromRow(row),
  });
}
