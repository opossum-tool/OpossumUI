// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiPaper from '@mui/material/Paper';
import { useCallback } from 'react';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { text } from '../../../shared/text';
import {
  useExternalAttributionFilters,
  useManualAttributionFilters,
} from '../../state/variables/use-filters';
import { usePanelSizes } from '../../state/variables/use-panel-sizes';
import { ResizePanels } from '../ResizePanels/ResizePanels';
import { WorkspaceSidePanel } from '../workspace-layout/workspace-side-panel';
import { attributionPanelsStyle } from './AttributionPanels.style';
import { AttributionsPanel } from './AttributionsPanel/AttributionsPanel';
import { SignalsPanel } from './SignalsPanel/SignalsPanel';

export function AttributionPanels() {
  const [{ search: attributionSearch }, setFilteredAttributions] =
    useManualAttributionFilters();
  const [{ search: signalSearch }, setFilteredSignals] =
    useExternalAttributionFilters();
  const { panelSizes, setPanelSizes } = usePanelSizes();

  const setHeight = useCallback(
    (height: number) => {
      setPanelSizes({ signalsPanelHeight: height });
    },
    [setPanelSizes],
  );

  return (
    <MuiPaper
      component={WorkspaceSidePanel}
      square
      elevation={5}
      sx={attributionPanelsStyle}
      widthSetting="packageListsWidth"
      resizeFrom="right"
    >
      <ResizePanels
        main={'lower'}
        height={panelSizes.signalsPanelHeight}
        setHeight={setHeight}
        upperPanel={{
          component: <AttributionsPanel />,
          search: {
            value: attributionSearch,
            setValue: (search: string) =>
              setFilteredAttributions((prev) => ({ ...prev, search })),
            channel: AllowedFrontendChannels.SearchAttributions,
          },
          title: text.packageLists.attributionsPanelTitle,
          headerTestId: 'attributions-panel-header',
        }}
        lowerPanel={{
          component: <SignalsPanel />,
          search: {
            value: signalSearch,
            setValue: (search: string) =>
              setFilteredSignals((prev) => ({ ...prev, search })),
            channel: AllowedFrontendChannels.SearchSignals,
          },
          title: text.packageLists.signalsPanelTitle,
          headerTestId: 'signals-panel-header',
        }}
      />
    </MuiPaper>
  );
}
