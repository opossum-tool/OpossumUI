// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { PanelAttributionData } from '../util/get-contained-packages';
import { DisplayPackageInfosWithCountAndResourceId } from '../types/types';
import { getContainedExternalDisplayPackageInfosWithCount } from '../Components/AggregatedAttributionsPanel/accordion-panel-helpers';
import { AttributionsToHashes } from '../../shared/shared-types';

let cachedExternalData: PanelAttributionData | null = null;
let cachedAttributionsToHashes: AttributionsToHashes | null = null;

self.onmessage = ({
  data: {
    selectedResourceId,
    externalData,
    resolvedExternalAttributions,
    attributionsToHashes,
    panelTitle,
  },
}): void => {
  // externalData = null is used to empty the cached data
  if (externalData !== undefined) {
    cachedExternalData = externalData;
  }

  if (attributionsToHashes !== undefined) {
    cachedAttributionsToHashes = attributionsToHashes;
  }

  if (selectedResourceId) {
    if (cachedExternalData && cachedAttributionsToHashes) {
      const [sortedPackageCardIds, displayAttributionIdsWithCount] =
        getContainedExternalDisplayPackageInfosWithCount({
          selectedResourceId,
          externalData: cachedExternalData,
          resolvedExternalAttributions,
          attributionsToHashes: cachedAttributionsToHashes,
          panelTitle,
        });
      const output: DisplayPackageInfosWithCountAndResourceId = {
        resourceId: selectedResourceId,
        sortedPackageCardIds,
        displayPackageInfosWithCount: displayAttributionIdsWithCount,
      };

      self.postMessage({
        output,
      });
    } else {
      self.postMessage({
        output: null,
      });
    }
  }
};

self.onerror = (): void => {
  cachedExternalData = null;
};
