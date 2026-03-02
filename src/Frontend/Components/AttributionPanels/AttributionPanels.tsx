// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useCallback } from 'react';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { DEFAULT_PANEL_SIZES } from '../../../shared/shared-constants';
import { text } from '../../../shared/text';
import {
  useExternalAttributionFilters,
  useManualAttributionFilters,
} from '../../state/variables/use-filters';
import { usePanelSizes } from '../../state/variables/use-panel-sizes';
import { ResizePanels } from '../ResizePanels/ResizePanels';
import { Container } from './AttributionPanels.style';
import { AttributionsPanel } from './AttributionsPanel/AttributionsPanel';
import { SignalsPanel } from './SignalsPanel/SignalsPanel';

export function AttributionPanels() {
  const [{ search: attributionSearch }, setFilteredAttributions] =
    useManualAttributionFilters();
  const [{ search: signalSearch }, setFilteredSignals] =
    useExternalAttributionFilters();
  const { panelSizes, setPanelSizes } = usePanelSizes();

  const setWidth = useCallback(
    (width: number) => setPanelSizes({ packageListsWidth: width }),
    [setPanelSizes],
  );

  const setHeight = useCallback(
    (height: number) => {
      setPanelSizes({ signalsPanelHeight: height });
    },
    [setPanelSizes],
  );

  return (
    <Container square elevation={5}>
      <ResizePanels
        minWidth={DEFAULT_PANEL_SIZES.packageListsWidth}
        main={'lower'}
        width={panelSizes.packageListsWidth}
        height={panelSizes.signalsPanelHeight}
        setWidth={setWidth}
        setHeight={setHeight}
        upperPanel={{
          component: <AttributionsPanel />,
          search: {
            value: attributionSearch,
            setValue: (search) =>
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
            setValue: (search) =>
              setFilteredSignals((prev) => ({ ...prev, search })),
            channel: AllowedFrontendChannels.SearchSignals,
          },
          title: text.packageLists.signalsPanelTitle,
          headerTestId: 'signals-panel-header',
        }}
      />
    </Container>
  );
}
