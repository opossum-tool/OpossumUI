// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { DisplayPackageInfosWithCountAndResourceId } from '../types/types';
import { getContainedManualDisplayPackageInfosWithCount } from '../Components/AggregatedAttributionsPanel/accordion-panel-helpers';

self.onmessage = ({
  data: { selectedResourceId, manualData, panelTitle },
}): void => {
  const [sortedPackageCardIds, displayPackageInfosWithCount] =
    getContainedManualDisplayPackageInfosWithCount({
      selectedResourceId,
      manualData,
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
};
