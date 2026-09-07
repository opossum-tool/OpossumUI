// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { groupBy as _groupBy } from 'lodash-es';

import type { AttributionSourceGroupCount } from '../../../../../shared/attribution-result-set';
import type {
  Attributions,
  ExternalAttributionSources,
} from '../../../../../shared/shared-types';

interface GetSignalGroupsArgs {
  activeAttributionIds: Array<string> | null;
  attributions: Attributions | null;
  sourceGroups: Array<AttributionSourceGroupCount> | undefined;
  sources: ExternalAttributionSources | undefined;
}

export interface SignalGroups {
  groupedIds: Record<string, Array<string>> | null;
}

export function getSignalGroups({
  activeAttributionIds,
  attributions,
  sourceGroups,
  sources,
}: GetSignalGroupsArgs): SignalGroups {
  if (!attributions || !activeAttributionIds) {
    return { groupedIds: null };
  }

  if (sourceGroups === undefined || sources === undefined) {
    return { groupedIds: activeAttributionIds.length === 0 ? {} : null };
  }

  const getSourceDisplayName = (attributionId: string) => {
    const source = attributions[attributionId]?.source;
    return source && (sources?.[source.name]?.name || source.name);
  };
  const loadedGroups = _groupBy(activeAttributionIds, getSourceDisplayName);

  return {
    groupedIds: Object.fromEntries(
      sourceGroups.map(({ name }) => [name, loadedGroups[name] ?? []]),
    ),
  };
}
