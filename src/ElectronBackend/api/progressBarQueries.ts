// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { sql } from 'kysely';

import {
  ClassificationStatistics,
  FileWithAttributionsCounts,
  ResourceCriticalityCounts,
} from '../../Frontend/types/types';
import { ClassificationsConfig, Criticality } from '../../shared/shared-types';
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

      const manual_count = await getCount(trx, (eb) =>
        getManualFilesQuery(eb).as('cwa'),
      );

      const manual_non_pre_selected_count = await getCount(trx, (eb) =>
        getNonPreSelectedManualFilesQuery(eb).as('cwa'),
      );

      const only_external_count = await getCount(trx, (eb) =>
        getOnlyExternalFilesQuery(eb).as('cwa'),
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
        getCriticalResourceQuery(eb, Criticality.High).as('cwa'),
      );
      const medium_critical_count = await getCount(trx, (eb) =>
        getCriticalResourceQuery(eb, Criticality.Medium).as('cwa'),
      );
      const non_critical_count = await getCount(trx, (eb) =>
        getCriticalResourceQuery(eb, Criticality.None).as('cwa'),
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
          getClassificationResourceQuery(eb, Number(key)).as('cwa'),
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
  data: FileWithAttributionsCounts;
}): Promise<{ result: string | null }> {
  if (props.data.fileCount === props.data.manualNonPreSelectedFileCount) {
    return { result: null };
  }
  return getDb()
    .transaction()
    .execute(async (trx) => {
      const selectedResourceId = await getResourceOrThrow(
        trx,
        props.selectedResourcePath,
      );
      const resource = await trx
        .selectFrom((eb) => {
          if (props.data.onlyExternalFileCount > 0) {
            return getOnlyExternalFilesQuery(eb).as('filtered');
          }
          if (props.data.manualPreSelectedFileCount > 0) {
            return getOnlyPreSelectedManualFilesQuery(eb).as('filtered');
          }
          return eb
            .selectFrom('cwa')
            .select('resource_id')
            .where('is_file', '=', 1)
            .where('manual', 'is', null)
            .where('external', 'is', null)
            .as('filtered');
        })
        .innerJoin('resource', 'resource_id', 'resource.id')
        .select(['resource_id', GET_LEGACY_RESOURCE_PATH, 'sort_key'])
        .orderBy(sql`sort_key <= ${selectedResourceId.sort_key}`)
        .orderBy('sort_key')
        .limit(1)
        .executeTakeFirst();
      return { result: resource?.path ?? null };
    });
}

export async function getNextFileToReviewForCriticality(props: {
  selectedResourcePath: string;
  data: ResourceCriticalityCounts;
}): Promise<{ result: string | null }> {
  if (
    props.data.highlyCriticalResourceCount +
      props.data.mediumCriticalResourceCount +
      props.data.nonCriticalResourceCount ===
    0
  ) {
    return { result: null };
  }
  return getDb()
    .transaction()
    .execute(async (trx) => {
      const selectedResourceId = await getResourceOrThrow(
        trx,
        props.selectedResourcePath,
      );
      const resource = await trx
        .selectFrom((eb) =>
          getCriticalResourceQuery(
            eb,
            props.data.highlyCriticalResourceCount > 0
              ? Criticality.High
              : props.data.mediumCriticalResourceCount > 0
                ? Criticality.Medium
                : Criticality.None,
          ).as('cwa'),
        )
        .innerJoin('resource', 'resource_id', 'resource.id')
        .select(['resource_id', GET_LEGACY_RESOURCE_PATH, 'sort_key'])
        .orderBy(sql`sort_key <= ${selectedResourceId.sort_key}`)
        .orderBy('sort_key')
        .limit(1)
        .executeTakeFirst();
      return { result: resource?.path ?? null };
    });
}

export async function getNextFileToReviewForClassification(props: {
  selectedResourcePath: string;
  data: ClassificationStatistics;
}): Promise<{ result: string | null }> {
  const highestClassification = Math.max(
    ...Object.entries(props.data).map(([key, value]) =>
      value.resourceCount > 0 ? Number(key) : -1,
    ),
  );
  if (highestClassification === -1) {
    return { result: null };
  }
  return getDb()
    .transaction()
    .execute(async (trx) => {
      const selectedResourceId = await getResourceOrThrow(
        trx,
        props.selectedResourcePath,
      );
      const resource = await trx
        .selectFrom((eb) =>
          getClassificationResourceQuery(eb, highestClassification).as('cwa'),
        )
        .innerJoin('resource', 'resource_id', 'resource.id')
        .select(['resource_id', GET_LEGACY_RESOURCE_PATH, 'sort_key'])
        .orderBy(sql`sort_key <= ${selectedResourceId.sort_key}`)
        .orderBy('sort_key')
        .limit(1)
        .executeTakeFirst();
      return { result: resource?.path ?? null };
    });
}
