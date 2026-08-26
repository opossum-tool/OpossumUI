// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { Attributions } from '../../shared/shared-types';
import { getDb } from '../db/db';
import { hydrateAttributionsByUuid } from './listAttributionsPage';

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
  return {
    result: Object.fromEntries(
      props.attributionUuids.flatMap((uuid) =>
        result[uuid] ? [[uuid, result[uuid]]] : [],
      ),
    ),
  };
}
