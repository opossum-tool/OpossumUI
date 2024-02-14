// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useMemo } from 'react';

import { text } from '../../../shared/text';
import {
  useFilteredAttributions,
  useFilteredSignals,
} from '../../state/variables/use-filtered-data';
import { usePanelSizes } from '../../util/use-panel-sizes';
import { ResizePanels } from '../ResizePanels/ResizePanels';
import { AttributionList } from './AttributionList/AttributionList';
import { Container } from './PackageLists.style';
import { SignalList } from './SignalList/SignalList';

export function PackageLists() {
  const [{ attributions }] = useFilteredAttributions();
  const [{ attributions: signals }] = useFilteredSignals();
  const {
    packageListsWidth,
    setPackageListsWidth,
    signalsPanelHeight,
    setSignalsPanelHeight,
  } = usePanelSizes();

  const [numberOfAttributionsTotal, numberOfAttributionsOnResource] = useMemo(
    () => [
      Object.keys(attributions).length,
      Object.values(attributions).filter(
        ({ relation }) => relation === 'resource',
      ).length,
    ],
    [attributions],
  );
  const [numberOfSignalsTotal, numberOfSignalsOnResource] = useMemo(
    () => [
      Object.keys(signals).length,
      Object.values(signals).filter(({ relation }) => relation === 'resource')
        .length,
    ],
    [signals],
  );

  return (
    <Container square elevation={5}>
      <ResizePanels
        minWidth={380}
        main={'lower'}
        width={packageListsWidth}
        height={signalsPanelHeight}
        setWidth={setPackageListsWidth}
        setHeight={setSignalsPanelHeight}
        upperPanel={{
          component: <AttributionList />,
          title: text.packageLists.attributionsPanelTitle(
            numberOfAttributionsTotal,
            numberOfAttributionsOnResource,
          ),
        }}
        lowerPanel={{
          component: <SignalList />,
          title: text.packageLists.signalsPanelTitle(
            numberOfSignalsTotal,
            numberOfSignalsOnResource,
          ),
        }}
      />
    </Container>
  );
}
