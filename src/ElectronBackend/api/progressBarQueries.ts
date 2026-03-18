// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { type ExpressionBuilder, sql } from 'kysely';
import type { DB } from 'kysely-codegen';

import type {
  ClassificationStatistics,
  FileWithAttributionsCounts,
  ResourceCriticalityCounts,
} from '../../Frontend/types/types';
import {
  type ClassificationsConfig,
  Criticality,
} from '../../shared/shared-types';
import { getDb } from '../db/db';
import {
  getClassificationResourceQuery,
  getCount,
  getCriticalResourceQuery,
  getManualFilesQuery,
  getNonPreSelectedManualFilesQuery,
  getOnlyExternalFilesQuery,
  getOnlyPreSelectedManualFilesQuery,
} from './progressBarUtils';
import { GET_LEGACY_RESOURCE_PATH, getResourceOrThrow } from './utils';

export async function getAttributionProgressBarData(): Promise<{
  result: FileWithAttributionsCounts;
}> {
  const result = await getDb()
    .transaction()
    .execute(async (trx) => {
      const { file_count } = await trx
        .selectFrom('resource')
        .select((eb) => eb.fn.countAll<number>().as('file_count'))
        .where('is_file', '=', 1)
        .executeTakeFirstOrThrow();

      const manual_count = await getCount(trx, getManualFilesQuery);

      const manual_non_pre_selected_count = await getCount(
        trx,
        getNonPreSelectedManualFilesQuery,
      );

      const only_external_count = await getCount(
        trx,
        getOnlyExternalFilesQuery,
      );

      return {
        fileCount: file_count,
        manualNonPreSelectedFileCount: manual_non_pre_selected_count,
        manualPreSelectedFileCount:
          manual_count - manual_non_pre_selected_count,
        onlyExternalFileCount: only_external_count,
      };
    });
  return { result };
}

export async function getCriticalityProgressBarData(): Promise<{
  result: ResourceCriticalityCounts;
}> {
  const result = await getDb()
    .transaction()
    .execute(async (trx) => {
      const highly_critical_count = await getCount(trx, (eb) =>
        getCriticalResourceQuery(eb, Criticality.High),
      );
      const medium_critical_count = await getCount(trx, (eb) =>
        getCriticalResourceQuery(eb, Criticality.Medium),
      );
      const non_critical_count = await getCount(trx, (eb) =>
        getCriticalResourceQuery(eb, Criticality.None),
      );
      return {
        highlyCriticalResourceCount: highly_critical_count,
        mediumCriticalResourceCount: medium_critical_count,
        nonCriticalResourceCount: non_critical_count,
      };
    });
  return { result };
}

export async function getClassificationProgressBarData(props: {
  classifications: ClassificationsConfig;
}): Promise<{
  result: ClassificationStatistics;
}> {
  const result = await getDb()
    .transaction()
    .execute(async (trx) => {
      const classificationStatistics: ClassificationStatistics = {};
      for (const [key, classification] of Object.entries(
        props.classifications,
      )) {
        const classification_count = await getCount(trx, (eb) =>
          getClassificationResourceQuery(eb, Number(key)),
        );
        classificationStatistics[Number(key)] = {
          description: classification.description,
          color: classification.color,
          resourceCount: classification_count,
        };
      }
      return classificationStatistics;
    });
  return { result };
}

export async function getNextFileToReviewForAttribution(props: {
  selectedResourcePath: string;
}): Promise<{ result: string | null }> {
  return getDb()
    .transaction()
    .execute(async (trx) => {
      const selectedResourceId = await getResourceOrThrow(
        trx,
        props.selectedResourcePath,
      );
      for (const option of [
        getOnlyExternalFilesQuery,
        getOnlyPreSelectedManualFilesQuery,
        (eb: ExpressionBuilder<DB, never>) =>
          eb
            .selectFrom('cwa')
            .select('resource_id')
            .where('is_file', '=', 1)
            .where('manual', 'is', null)
            .where('external', 'is', null),
      ]) {
        const resource = await trx
          .selectFrom((eb) => option(eb).as('filtered'))
          .innerJoin('resource', 'resource_id', 'resource.id')
          .select(['resource_id', GET_LEGACY_RESOURCE_PATH, 'sort_key'])
          .orderBy(sql`sort_key <= ${selectedResourceId.sort_key}`)
          .orderBy('sort_key')
          .limit(1)
          .executeTakeFirst();

        if (resource) {
          return { result: resource.path };
        }
      }
      return { result: null };
    });
}

export async function getNextFileToReviewForCriticality(props: {
  selectedResourcePath: string;
}): Promise<{ result: string | null }> {
  return getDb()
    .transaction()
    .execute(async (trx) => {
      const selectedResourceId = await getResourceOrThrow(
        trx,
        props.selectedResourcePath,
      );
      for (const criticality of [
        Criticality.High,
        Criticality.Medium,
        Criticality.None,
      ]) {
        const resource = await trx
          .selectFrom((eb) =>
            getCriticalResourceQuery(eb, criticality).as('cwa'),
          )
          .innerJoin('resource', 'resource_id', 'resource.id')
          .select(['resource_id', GET_LEGACY_RESOURCE_PATH, 'sort_key'])
          .orderBy(sql`sort_key <= ${selectedResourceId.sort_key}`)
          .orderBy('sort_key')
          .limit(1)
          .executeTakeFirst();

        if (resource) {
          return { result: resource.path };
        }
      }
      return { result: null };
    });
}

export async function getNextFileToReviewForClassification(props: {
  selectedResourcePath: string;
  classifications: ClassificationsConfig;
}): Promise<{ result: string | null }> {
  return getDb()
    .transaction()
    .execute(async (trx) => {
      const selectedResourceId = await getResourceOrThrow(
        trx,
        props.selectedResourcePath,
      );
      const classifications = Object.keys(props.classifications)
        .toSorted()
        .reverse();
      for (const classification of classifications) {
        const resource = await trx
          .selectFrom((eb) =>
            getClassificationResourceQuery(eb, Number(classification)).as(
              'cwa',
            ),
          )
          .innerJoin('resource', 'resource_id', 'resource.id')
          .select(['resource_id', GET_LEGACY_RESOURCE_PATH, 'sort_key'])
          .orderBy(sql`sort_key <= ${selectedResourceId.sort_key}`)
          .orderBy('sort_key')
          .limit(1)
          .executeTakeFirst();

        if (resource) {
          return { result: resource.path };
        }
      }
      return { result: null };
    });
}
