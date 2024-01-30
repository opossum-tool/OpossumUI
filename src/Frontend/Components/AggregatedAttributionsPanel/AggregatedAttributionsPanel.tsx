// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { memo, ReactElement } from 'react';

import { PackagePanelTitle } from '../../enums/enums';
import { useAppSelector } from '../../state/hooks';
import { getExternalData } from '../../state/selectors/all-views-resource-selectors';
import { getSelectedResourceId } from '../../state/selectors/audit-view-resource-selectors';
import { usePanelData } from '../../state/variables/use-panel-data';
import { AttributionIdWithCount } from '../../types/types';
import { isIdOfResourceWithChildren } from '../../util/can-resource-have-children';
import { getExternalAttributionIdsWithCount } from '../../util/get-contained-packages';
import { AccordionPanel } from './AccordionPanel';
import { SyncAccordionPanel } from './SyncAccordionPanel';

interface AggregatedAttributionsPanelProps {
  isAddToPackageEnabled: boolean;
}

export const AggregatedAttributionsPanel = memo(
  (props: AggregatedAttributionsPanelProps): ReactElement => {
    const externalData = useAppSelector(getExternalData);
    const selectedResourceId = useAppSelector(getSelectedResourceId);

    const [{ signalsInFolderContent, attributionsInFolderContent }] =
      usePanelData();

    return (
      <>
        <SyncAccordionPanel
          title={PackagePanelTitle.ExternalPackages}
          getAttributionIdsWithCount={(): Array<AttributionIdWithCount> =>
            getExternalAttributionIdsWithCount(
              externalData.resourcesToAttributions[selectedResourceId] || [],
            )
          }
          attributions={externalData.attributions}
          isAddToPackageEnabled={props.isAddToPackageEnabled}
          aria-label={'signals panel'}
        />
        {isIdOfResourceWithChildren(selectedResourceId) ? (
          <>
            <AccordionPanel
              title={PackagePanelTitle.ContainedExternalPackages}
              panelData={signalsInFolderContent}
              isAddToPackageEnabled={props.isAddToPackageEnabled}
              aria-label={'signals in folder content panel'}
            />
            <AccordionPanel
              title={PackagePanelTitle.ContainedManualPackages}
              panelData={attributionsInFolderContent}
              isAddToPackageEnabled={props.isAddToPackageEnabled}
              aria-label={'attributions in folder content panel'}
            />
          </>
        ) : null}
      </>
    );
  },
);
