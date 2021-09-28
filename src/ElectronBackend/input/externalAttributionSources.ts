// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ExternalAttributionSources } from '../../shared/shared-types';

export function combineExternalAttributionSources(
  sources: Array<ExternalAttributionSources>
): ExternalAttributionSources {
  if (sources.length === 0) {
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
