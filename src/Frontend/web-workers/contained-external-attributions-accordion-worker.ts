// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { AttributionData } from '../../shared/shared-types';
import { getContainedExternalPackages } from '../util/get-contained-packages';

let cachedExternalData: AttributionData | null = null;

self.onmessage = ({
  data: { selectedResourceId, externalData, resolvedExternalAttributions },
}): void => {
  if (externalData) {
    cachedExternalData = externalData;
  }

  if (selectedResourceId) {
    if (cachedExternalData) {
      const output = getContainedExternalPackages({
        selectedResourceId,
        externalData: cachedExternalData,
        resolvedExternalAttributions,
      });

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
