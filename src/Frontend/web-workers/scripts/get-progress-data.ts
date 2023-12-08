// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Resources } from '../../../shared/shared-types';
import { getUpdatedProgressBarData } from '../../state/helpers/progress-bar-data-helpers';
import { ProgressBarData } from '../../types/types';
import { PanelAttributionData } from '../../util/get-contained-packages';

interface Props {
  attributionBreakpoints: Set<string>;
  externalData: PanelAttributionData;
  filesWithChildren: Set<string>;
  manualData: PanelAttributionData;
  resolvedExternalAttributions: Set<string>;
  resourceId: string;
  resources: Resources;
}

export function getProgressData({
  attributionBreakpoints,
  externalData,
  filesWithChildren,
  manualData,
  resolvedExternalAttributions,
  resourceId,
  resources,
}: Props): ProgressBarData {
  return getUpdatedProgressBarData({
    resources,
    resourceId,
    manualAttributions: manualData.attributions,
    externalAttributions: externalData.attributions,
    resourcesToManualAttributions: manualData.resourcesToAttributions,
    resourcesToExternalAttributions: externalData.resourcesToAttributions,
    resolvedExternalAttributions,
    attributionBreakpoints,
    filesWithChildren,
  });
}
