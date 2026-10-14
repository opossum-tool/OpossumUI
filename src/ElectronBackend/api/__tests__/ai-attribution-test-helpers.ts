// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  type Attributions,
  Criticality,
  type PackageInfo,
  type ParsedFileContent,
} from '../../../shared/shared-types';
import {
  initializeDbWithTestData,
  pathsToResources,
} from '../../../testing/global-test-helpers';
import { getDb } from '../../db/db';

type AttributionFields = Partial<Omit<PackageInfo, 'id' | 'criticality'>> & {
  aiAttributions?: Record<string, unknown>;
};

type ResourceLinks = Record<string, Array<string>>;

interface AiAttributionFixture {
  resourcePaths: Array<string>;
  attributions?: Attributions;
  resourceLinks?: ResourceLinks;
  externalAttributions?: Attributions;
  externalResourceLinks?: ResourceLinks;
  readonlyRules?: ParsedFileContent['readonlyRules'];
}

export function attributionFixture(
  id: string,
  overrides: AttributionFields = {},
): PackageInfo & { aiAttributions?: Record<string, unknown> } {
  return {
    id,
    criticality: Criticality.None,
    ...overrides,
  };
}

export function initializeAiAttributionFixture({
  resourcePaths,
  attributions = {},
  resourceLinks = {},
  externalAttributions = {},
  externalResourceLinks = {},
  readonlyRules = [],
}: AiAttributionFixture) {
  return initializeDbWithTestData({
    resources: pathsToResources(resourcePaths),
    manualAttributions: {
      attributions,
      resourcesToAttributions: resourceLinks,
      attributionsToResources: {},
    },
    externalAttributions: {
      attributions: externalAttributions,
      resourcesToAttributions: externalResourceLinks,
      attributionsToResources: {},
    },
    readonlyRules,
  });
}

export async function attributionContent(uuid: string) {
  return getDb()
    .selectFrom('attribution')
    .select([
      'package_name',
      'package_version',
      'package_namespace',
      'package_type',
      'package_purl_appendix',
      'url',
      'copyright',
      'license_name',
      'license_text',
      'comment',
      'first_party',
      'needs_review',
      'follow_up',
      'attribution_confidence',
      'pre_selected',
    ])
    .where('uuid', '=', uuid)
    .executeTakeFirstOrThrow();
}

export function readAiMetadata(
  attributionUuid: string,
  selectedField: 'human_modified',
): Promise<{ human_modified: number | null }>;
export function readAiMetadata(attributionUuid: string): Promise<{
  additional_data: string;
  human_modified: number | null;
}>;
export function readAiMetadata(
  attributionUuid: string,
  selectedField?: 'human_modified',
) {
  const query = getDb()
    .selectFrom('attribution_ai')
    .where('attribution_uuid', '=', attributionUuid);

  return selectedField === 'human_modified'
    ? query.select('human_modified').executeTakeFirstOrThrow()
    : query
        .select(['additional_data', 'human_modified'])
        .executeTakeFirstOrThrow();
}

export async function linkedAttributionIds(path: string) {
  return (
    await getDb()
      .selectFrom('resource_to_attribution as rta')
      .innerJoin('resource', 'resource.id', 'rta.resource_id')
      .select('attribution_uuid')
      .where('resource.path', '=', path)
      .execute()
  ).map(({ attribution_uuid }) => attribution_uuid);
}

export async function resourceAccessOf(attributionUuid: string) {
  return (
    await getDb()
      .selectFrom('attribution')
      .select('resource_access')
      .where('uuid', '=', attributionUuid)
      .executeTakeFirstOrThrow()
  ).resource_access;
}
