// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import objectHash from 'object-hash';
import {
  Attributions,
  AttributionsToHashes,
  PackageInfo,
} from '../../../shared/shared-types';

const FIELDS_TO_IGNORE_WHEN_HASHING_ATTRIBUTIONS = new Set<string>([
  'comment',
  'attributionConfidence',
  'originIds',
  'preSelected',
]);

export function createExternalAttributionsToHashes(
  externalAttributions: Attributions
): AttributionsToHashes {
  const hashOptions = {
    excludeKeys: (key: string): boolean =>
      FIELDS_TO_IGNORE_WHEN_HASHING_ATTRIBUTIONS.has(key),
  };

  const externalAttributionsToHashes: AttributionsToHashes = {};
  const hashesToExternalAttributions: { [hash: string]: Array<string> } = {};

  for (const [attributionId, attribution] of Object.entries(
    externalAttributions
  )) {
    if (attribution.firstParty || attribution.packageName) {
      const attributionKeys = Object.keys(attribution) as Array<
        keyof PackageInfo
      >;
      attributionKeys.forEach(
        (key) =>
          (attribution[key] === undefined || attribution[key] === '') &&
          delete attribution[key]
      );

      const hash = objectHash(attribution, hashOptions);

      hashesToExternalAttributions[hash]
        ? hashesToExternalAttributions[hash].push(attributionId)
        : (hashesToExternalAttributions[hash] = [attributionId]);
    }
  }

  Object.entries(hashesToExternalAttributions).forEach(
    ([hash, attributionIds]) => {
      if (attributionIds.length > 1) {
        attributionIds.forEach(
          (attributionId) =>
            (externalAttributionsToHashes[attributionId] = hash)
        );
      }
    }
  );

  return externalAttributionsToHashes;
}
