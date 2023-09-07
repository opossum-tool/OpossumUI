// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { DisplayPackageInfosWithCountAndResourceId } from '../types/types';
import { getContainedManualDisplayPackageInfosWithCount } from '../Components/AggregatedAttributionsPanel/accordion-panel-helpers';
import { PanelAttributionData } from '../util/get-contained-packages';

let cachedManualData: PanelAttributionData | null = null;

self.onmessage = ({
  data: { selectedResourceId, manualData, panelTitle },
}): void => {
  if (manualData !== undefined) {
    cachedManualData = manualData;
  }

  if (selectedResourceId) {
    if (cachedManualData) {
      const [sortedPackageCardIds, displayPackageInfosWithCount] =
        getContainedManualDisplayPackageInfosWithCount({
          selectedResourceId,
          manualData: cachedManualData,
          panelTitle,
        });
      const output: DisplayPackageInfosWithCountAndResourceId = {
        resourceId: selectedResourceId,
        sortedPackageCardIds,
        displayPackageInfosWithCount,
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
