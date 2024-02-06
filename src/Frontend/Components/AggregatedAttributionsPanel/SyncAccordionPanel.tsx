// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useMemo } from 'react';

import { Attributions, PackageInfo } from '../../../shared/shared-types';
import { PackagePanelTitle } from '../../enums/enums';
import { useSignalSorting } from '../../state/variables/use-active-sorting';
import { AttributionIdWithCount } from '../../types/types';
import { sortAttributions } from '../../util/sort-attributions';
import { AccordionPanel } from './AccordionPanel';

interface SyncAccordionPanelProps {
  title: PackagePanelTitle;
  getAttributionIdsWithCount(): Array<AttributionIdWithCount>;
  attributions: Attributions;
  isAddToPackageEnabled: boolean;
  ['aria-label']?: string;
}

export function SyncAccordionPanel(props: SyncAccordionPanelProps) {
  const { signalSorting } = useSignalSorting();

  const attributions = useMemo(
    () =>
      sortAttributions({
        sorting: signalSorting,
        attributions: props
          .getAttributionIdsWithCount()
          .map<PackageInfo>(({ attributionId, count }) => ({
            ...props.attributions[attributionId],
            count,
          })),
      }),
    [props, signalSorting],
  );

  return (
    <AccordionPanel
      attributions={attributions}
      title={props.title}
      isAddToPackageEnabled={props.isAddToPackageEnabled}
      aria-label={props['aria-label']}
    />
  );
}
