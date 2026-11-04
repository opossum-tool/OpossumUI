// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { Attributions } from '../../../shared/shared-types';
import { getDb } from '../../db/db';
import {
  type AttributionPreviewData,
  hydrateAttributionsByUuid,
  withWritableLinkedResourceCounts,
} from './listAttributionsPage';

export type GetAttributionsProps = {
  attributionUuids: Array<string>;
  resourcePathForRelationships?: string;
};

export async function getAttributions(
  props: GetAttributionsProps,
): Promise<{ result: Attributions }> {
  if (props.attributionUuids.length === 0) {
    return { result: {} };
  }

  const result = await getDb()
    .transaction()
    .execute((trx) =>
      hydrateAttributionsByUuid(
        trx,
        props.attributionUuids,
        props.resourcePathForRelationships,
      ),
    );
  return { result };
}

export async function getAttributionPreview(
  props: GetAttributionsProps,
): Promise<{ result: AttributionPreviewData }> {
  const result = await getDb()
    .transaction()
    .execute(async (trx) => {
      const attributions = await hydrateAttributionsByUuid(
        trx,
        props.attributionUuids,
        props.resourcePathForRelationships,
      );
      return withWritableLinkedResourceCounts(trx, attributions);
    });
  return { result };
}
