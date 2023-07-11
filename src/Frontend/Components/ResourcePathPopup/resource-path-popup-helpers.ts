// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { AttributionsToResources } from '../../../shared/shared-types';

export function getAllResourcePathsForAttributions(
  attributionIds: Array<string>,
  attributionsToResources: AttributionsToResources,
): Array<string> {
  const resourceIds = attributionIds.flatMap(
    (attributionId) => attributionsToResources[attributionId],
  );
  const deduplicatedResourceIds = Array.from(new Set(resourceIds));
  return deduplicatedResourceIds;
}
