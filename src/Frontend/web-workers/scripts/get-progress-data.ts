// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { AttributionData, Resources } from '../../../shared/shared-types';
import { getUpdatedProgressBarData } from '../../state/helpers/progress-bar-data-helpers';
import { ProgressBarData } from '../../types/types';

interface Props {
  attributionBreakpoints: Set<string>;
  externalData: AttributionData;
  filesWithChildren: Set<string>;
  manualData: AttributionData;
  resolvedExternalAttributions: Set<string>;
  resources: Resources;
}

export function getProgressData({
  attributionBreakpoints,
  externalData,
  filesWithChildren,
  manualData,
  resolvedExternalAttributions,
  resources,
}: Props): ProgressBarData {
  return getUpdatedProgressBarData({
    resources,
    manualAttributions: manualData.attributions,
    externalAttributions: externalData.attributions,
    resourcesToManualAttributions: manualData.resourcesToAttributions,
    resourcesToExternalAttributions: externalData.resourcesToAttributions,
    resolvedExternalAttributions,
    attributionBreakpoints,
    filesWithChildren,
  });
}
