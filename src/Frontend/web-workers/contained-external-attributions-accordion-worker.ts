// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { PanelAttributionData } from '../util/get-contained-packages';
import { DisplayAttributionsWithCountAndResourceId } from '../types/types';
import { getDisplayContainedExternalPackagesWithCount } from '../Components/AggregatedAttributionsPanel/accordion-panel-helpers';
import { AttributionsToHashes } from '../../shared/shared-types';

let cachedExternalData: PanelAttributionData | null = null;
let cachedAttributionsToHashes: AttributionsToHashes | null = null;

self.onmessage = ({
  data: {
    selectedResourceId,
    externalData,
    resolvedExternalAttributions,
    attributionsToHashes,
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
      const displayAttributionIdsWithCount =
        getDisplayContainedExternalPackagesWithCount({
          selectedResourceId,
          externalData: cachedExternalData,
          resolvedExternalAttributions,
          attributionsToHashes: cachedAttributionsToHashes,
        });
      const output: DisplayAttributionsWithCountAndResourceId = {
        resourceId: selectedResourceId,
        displayAttributionsWithCount: displayAttributionIdsWithCount,
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
