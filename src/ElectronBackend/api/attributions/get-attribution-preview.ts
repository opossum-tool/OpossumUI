// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { getDb } from '../../db/db';
import {
  type AttributionPreviewData,
  hydrateAttributionsByUuid,
  withWritableLinkedResourceCounts,
} from './listAttributionsPage';

type GetAttributionPreviewProps = {
  attributionUuids: Array<string>;
  resourcePathForRelationships?: string;
};

export async function getAttributionPreview(
  props: GetAttributionPreviewProps,
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
