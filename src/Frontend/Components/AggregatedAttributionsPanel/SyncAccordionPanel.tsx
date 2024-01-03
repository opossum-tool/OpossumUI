// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ReactElement } from 'react';

import {
  Attributions,
  AttributionsToHashes,
} from '../../../shared/shared-types';
import { AuditViewSortingType, PackagePanelTitle } from '../../enums/enums';
import { AttributionIdWithCount } from '../../types/types';
import { useVariable } from '../../util/use-variable';
import { getExternalDisplayPackageInfosWithCount } from './accordion-panel-helpers';
import { AccordionPanel } from './AccordionPanel';

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
  const [activeSorting] = useVariable(
    'active-sorting-audit-view',
    AuditViewSortingType.ByOccurrence,
  );

  const [sortedPackageCardIds, displayPackageInfosWithCount] =
    getExternalDisplayPackageInfosWithCount(
      props.getAttributionIdsWithCount(),
      props.attributions,
      props.attributionsToHashes,
      props.title,
      activeSorting === AuditViewSortingType.ByCriticality,
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
