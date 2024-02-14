// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useCallback } from 'react';

import { text } from '../../../shared/text';
import {
  useFilteredAttributions,
  useFilteredSignals,
} from '../../state/variables/use-filtered-data';
import {
  DEFAULT_PANEL_SIZES,
  usePanelSizes,
} from '../../state/variables/use-panel-sizes';
import { ResizePanels } from '../ResizePanels/ResizePanels';
import { Container } from './AttributionPanels.style';
import { AttributionsPanel } from './AttributionsPanel/AttributionsPanel';
import { SignalsPanel } from './SignalsPanel/SignalsPanel';

export function AttributionPanels() {
  const [{ search: attributionSearch }, setFilteredAttributions] =
    useFilteredAttributions();
  const [{ search: signalSearch }, setFilteredSignals] = useFilteredSignals();
  const [{ packageListsWidth, signalsPanelHeight }, setPanelSizes] =
    usePanelSizes();

  const setWidth = useCallback(
    (width: number) =>
      setPanelSizes((prev) => ({ ...prev, packageListsWidth: width })),
    [setPanelSizes],
  );

  const setHeight = useCallback(
    (height: number) => {
      setPanelSizes((prev) => ({ ...prev, signalsPanelHeight: height }));
    },
    [setPanelSizes],
  );

  return (
    <Container square elevation={5}>
      <ResizePanels
        minWidth={DEFAULT_PANEL_SIZES.packageListsWidth}
        main={'lower'}
        width={packageListsWidth}
        height={signalsPanelHeight}
        setWidth={setWidth}
        setHeight={setHeight}
        upperPanel={{
          component: <AttributionsPanel />,
          search: attributionSearch,
          setSearch: (search) =>
            setFilteredAttributions((prev) => ({ ...prev, search })),
          title: text.packageLists.attributionsPanelTitle,
          headerTestId: 'attributions-panel-header',
        }}
        lowerPanel={{
          component: <SignalsPanel />,
          search: signalSearch,
          setSearch: (search) =>
            setFilteredSignals((prev) => ({ ...prev, search })),
          title: text.packageLists.signalsPanelTitle,
          headerTestId: 'signals-panel-header',
        }}
      />
    </Container>
  );
}
