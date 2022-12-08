// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { Resources, ResourcesToAttributions } from '../../shared/shared-types';
import { getUpdatedProgressBarData } from '../state/helpers/progress-bar-data-helpers';
import { ProgressBarDataAndResourceId } from '../types/types';

let cachedResources: Resources | null = null;
let cachedResourcesToExternalAttributions: ResourcesToAttributions | null =
  null;
let cachedAttributionBreakpoints: Set<string> | null = null;
let cachedFilesWithChildren: Set<string> | null = null;

self.onmessage = ({
  data: {
    resources,
    resourceId,
    manualAttributions,
    resourcesToManualAttributions,
    resourcesToExternalAttributions,
    resolvedExternalAttributions,
    attributionBreakpoints,
    filesWithChildren,
  },
}): void => {
  if (
    cachedResources &&
    cachedResourcesToExternalAttributions &&
    cachedAttributionBreakpoints &&
    cachedFilesWithChildren
  ) {
    const progressBarData = getUpdatedProgressBarData({
      resources: cachedResources,
      resourceId,
      manualAttributions,
      resourcesToManualAttributions,
      resourcesToExternalAttributions: cachedResourcesToExternalAttributions,
      resolvedExternalAttributions,
      attributionBreakpoints: cachedAttributionBreakpoints,
      filesWithChildren: cachedFilesWithChildren,
    });

    const output: ProgressBarDataAndResourceId = {
      progressBarData,
      resourceId,
    };

    self.postMessage({
      output,
    });
  } else {
    if (resources) cachedResources = resources;
    if (resourcesToExternalAttributions)
      cachedResourcesToExternalAttributions = resourcesToExternalAttributions;
    if (attributionBreakpoints)
      cachedAttributionBreakpoints = attributionBreakpoints;
    if (filesWithChildren) cachedFilesWithChildren = filesWithChildren;
  }
};
