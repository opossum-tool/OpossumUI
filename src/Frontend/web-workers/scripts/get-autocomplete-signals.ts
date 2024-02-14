// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { compact, orderBy } from 'lodash';

import {
  AttributionData,
  ExternalAttributionSources,
  PackageInfo,
} from '../../../shared/shared-types';
import { getContainedAttributionCount } from '../../util/get-contained-attribution-count';
import { generatePurl } from '../../util/handle-purl';

export interface Props {
  externalData: AttributionData;
  manualData: AttributionData;
  resolvedExternalAttributions: Set<string>;
  resourceId: string;
  sources: ExternalAttributionSources;
}

export function getAutocompleteSignals({
  externalData: {
    attributions,
    resourcesToAttributions,
    resourcesWithAttributedChildren,
  },
  manualData,
  resolvedExternalAttributions,
  resourceId,
  sources,
}: Props) {
  const signalsOnResource = (resourcesToAttributions[resourceId] || []).map(
    (id) => attributions[id],
  );
  const signalsOnChildren = Object.keys(
    getContainedAttributionCount({
      resourceId,
      resourcesWithAttributedChildren,
      resourcesToAttributions,
      resolvedExternalAttributions,
    }),
  ).map((id) => attributions[id]);

  const getUniqueKey = (packageInfo: PackageInfo) =>
    compact([
      packageInfo.source && sources[packageInfo.source.name]?.name,
      packageInfo.copyright,
      packageInfo.licenseName,
      generatePurl(packageInfo),
    ]).join();

  const signals = [
    ...signalsOnResource,
    ...signalsOnChildren,
    ...Object.values(manualData.attributions),
  ].reduce<Array<PackageInfo>>((acc, signal) => {
    if (
      !generatePurl(signal) ||
      signal.preferred ||
      resolvedExternalAttributions.has(signal.id)
    ) {
      return acc;
    }

    const key = getUniqueKey(signal);
    const dupeIndex = acc.findIndex((item) => getUniqueKey(item) === key);

    if (dupeIndex === -1) {
      acc.push({ ...signal, count: 1 });
    } else {
      acc[dupeIndex] = {
        ...acc[dupeIndex],
        count: (acc[dupeIndex].count ?? 0) + 1,
        wasPreferred: acc[dupeIndex].wasPreferred || signal.wasPreferred,
      };
    }

    return acc;
  }, []);

  return orderBy(
    signals,
    [
      ({ source }) => (source && sources[source.name])?.priority ?? 0,
      ({ wasPreferred }) => (wasPreferred ? 1 : 0),
      ({ count }) => count ?? 0,
    ],
    ['desc', 'desc', 'desc'],
  );
}
