// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ExternalAttributionSources } from '../../shared/shared-types';

export const ATTRIBUTION_SOURCES: ExternalAttributionSources = {
  MERGER: { name: 'Suggested', priority: 1 },
  HHC: { name: 'High High Compute', priority: 2 },
  MS: { name: 'Metadata Scanner', priority: 3 },
  'REUSER:HHC': { name: 'High High Compute (old scan)', priority: 4 },
  'REUSER:MS': { name: 'Metadata Scanner (old scan)', priority: 5 },
  'REUSER:SC': { name: 'ScanCode', priority: 6 },
  'REUSER:HC': { name: 'High Compute (old scan)', priority: 7 },
  SC: { name: 'ScanCode', priority: 8 },
  HC: { name: 'High Compute', priority: 9 },
  HINT: { name: 'Hint', priority: 10 },
};

export function combineExternalAttributionSources(
  sources: Array<ExternalAttributionSources>
): ExternalAttributionSources {
  if (sources.length == 0) {
    return {};
  }

  return sources.reduce((mergedAttributionSources, attributionSource) => {
    Object.keys(attributionSource).forEach((source) => {
      if (!mergedAttributionSources.hasOwnProperty(source)) {
        mergedAttributionSources[source] = attributionSource[source];
      }
    });
    return mergedAttributionSources;
  });
}
