// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Attributions } from '../../../shared/shared-types';
import { PackagePanelTitle } from '../../enums/enums';
import { useSignalSorting } from '../../state/variables/use-active-sorting';
import { AttributionIdWithCount } from '../../types/types';
import { AccordionPanel } from './AccordionPanel';
import { getExternalDisplayPackageInfosWithCount } from './AccordionPanel.util';

interface SyncAccordionPanelProps {
  title: PackagePanelTitle;
  getAttributionIdsWithCount(): Array<AttributionIdWithCount>;
  attributions: Attributions;
  isAddToPackageEnabled: boolean;
  ['aria-label']?: string;
}

export function SyncAccordionPanel(props: SyncAccordionPanelProps) {
  const { signalSorting } = useSignalSorting();

  const [sortedPackageCardIds, displayPackageInfosWithCount] =
    getExternalDisplayPackageInfosWithCount(
      props.getAttributionIdsWithCount(),
      props.attributions,
      props.title,
      signalSorting,
    );

  return (
    <AccordionPanel
      panelData={{
        sortedPackageCardIds,
        displayPackageInfos: displayPackageInfosWithCount,
      }}
      title={props.title}
      isAddToPackageEnabled={props.isAddToPackageEnabled}
      aria-label={props['aria-label']}
    />
  );
}
