// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import {
  Attributions,
  AttributionsToHashes,
} from '../../../shared/shared-types';
import { AccordionPanel } from './AccordionPanel';
import { PackagePanelTitle } from '../../enums/enums';
import { AttributionIdWithCount, PanelData } from '../../types/types';
import { getMergedAttributionsWithCount } from './accordion-panel-helpers';

interface SyncAccordionPanelProps {
  title: PackagePanelTitle;
  getAttributionIdsWithCount(): Array<AttributionIdWithCount>;
  attributionsToHashes: AttributionsToHashes;
  attributions: Attributions;
  isAddToPackageEnabled: boolean;
}

export function SyncAccordionPanel(
  props: SyncAccordionPanelProps
): ReactElement {
  const mergedAttributionIdsWithCount = getMergedAttributionsWithCount(
    props.getAttributionIdsWithCount(),
    props.attributions,
    props.attributionsToHashes
  );
  const panelData: PanelData = {
    title: props.title,
    attributionIdsWithCount: mergedAttributionIdsWithCount,
    attributions: props.attributions,
  };

  return (
    <AccordionPanel
      panelData={panelData}
      isAddToPackageEnabled={props.isAddToPackageEnabled}
    />
  );
}
