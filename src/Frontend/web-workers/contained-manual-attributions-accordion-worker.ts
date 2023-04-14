// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { DisplayAttributionsWithCountAndResourceId } from '../types/types';
import { getDisplayContainedManualPackagesWithCount } from '../Components/AggregatedAttributionsPanel/accordion-panel-helpers';

self.onmessage = ({ data: { selectedResourceId, manualData } }): void => {
  const attributionIdsWithCount = getDisplayContainedManualPackagesWithCount({
    selectedResourceId,
    manualData,
  });
  const output: DisplayAttributionsWithCountAndResourceId = {
    resourceId: selectedResourceId,
    displayAttributionsWithCount: attributionIdsWithCount,
  };

  self.postMessage({
    output,
  });
};
