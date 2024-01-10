// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ReactElement } from 'react';

import {
  Attributions,
  AttributionsToHashes,
} from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { PackagePanelTitle } from '../../enums/enums';
import { AttributionIdWithCount } from '../../types/types';
import { useActiveSortingInAuditView } from '../../util/use-active-sorting';
import { AccordionPanel } from './AccordionPanel';
import { getExternalDisplayPackageInfosWithCount } from './AccordionPanel.util';

interface SyncAccordionPanelProps {
  title: PackagePanelTitle;
  getAttributionIdsWithCount(): Array<AttributionIdWithCount>;
  attributionsToHashes: AttributionsToHashes;
  attributions: Attributions;
  isAddToPackageEnabled: boolean;
  ['aria-label']?: string;
}

export function SyncAccordionPanel(
  props: SyncAccordionPanelProps,
): ReactElement {
  const [activeSorting] = useActiveSortingInAuditView();

  const [sortedPackageCardIds, displayPackageInfosWithCount] =
    getExternalDisplayPackageInfosWithCount(
      props.getAttributionIdsWithCount(),
      props.attributions,
      props.attributionsToHashes,
      props.title,
      activeSorting === text.auditViewSorting.byCriticality,
    );

  return (
    <AccordionPanel
      panelData={{
        sortedPackageCardIds,
        displayPackageInfosWithCount,
      }}
      title={props.title}
      isAddToPackageEnabled={props.isAddToPackageEnabled}
      aria-label={props['aria-label']}
    />
  );
}
