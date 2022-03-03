// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { getContainedManualPackages } from '../util/get-contained-packages';
import { AttributionIdsWithCountAndResourceId } from '../types/types';

self.onmessage = ({ data: { selectedResourceId, manualData } }): void => {
  const attributionIdsWithCount = getContainedManualPackages({
    selectedResourceId,
    manualData,
  });
  const output: AttributionIdsWithCountAndResourceId = {
    resourceId: selectedResourceId,
    attributionIdsWithCount,
  };

  self.postMessage({
    output,
  });
};
