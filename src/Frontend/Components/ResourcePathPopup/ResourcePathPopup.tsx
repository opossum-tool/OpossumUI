// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { makeStyles } from '@material-ui/core/styles';
import React, { ReactElement } from 'react';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { ResourcesList } from '../ResourcesList/ResourcesList';
import {
  getExternalAttributionsToResources,
  getManualAttributionsToResources,
} from '../../state/selectors/all-views-resource-selectors';
import { useWindowHeight } from '../../util/use-window-height';
import { getSelectedResourceId } from '../../state/selectors/audit-view-resource-selectors';
import { splitResourceIdsToCurrentAndOtherFolder } from './resource-path-popup-helpers';
import { ResourcesListBatch } from '../../types/types';
import { useAppSelector } from '../../state/hooks';
import { ButtonText } from '../../enums/enums';

const heightOffset = 300;

const useStyles = makeStyles({
  header: {
    whiteSpace: 'nowrap',
  },
  resourceListContainer: {
    overflowY: 'hidden',
  },
});

interface ResourcePathPopupProps {
  isOpen: boolean;
  closePopup(): void;
  attributionId: string;
  isExternalAttribution: boolean;
  displayedAttributionName: string;
}

export function ResourcePathPopup(props: ResourcePathPopupProps): ReactElement {
  const classes = useStyles();
  const folderPath = useAppSelector(getSelectedResourceId);

  const externalAttributionsToResources = useAppSelector(
    getExternalAttributionsToResources
  );
  const manualAttributionsToResources = useAppSelector(
    getManualAttributionsToResources
  );
  const allResourceIds = props.isExternalAttribution
    ? externalAttributionsToResources[props.attributionId]
    : manualAttributionsToResources[props.attributionId];

  const header = `Resources for selected ${
    props.isExternalAttribution ? 'signal' : 'attribution'
  }`;

  function getResourcesListBatches(): Array<ResourcesListBatch> {
    const resourcesListBatches: Array<ResourcesListBatch> = [];

    const { currentFolderResourceIds, otherFolderResourceIds } =
      splitResourceIdsToCurrentAndOtherFolder(allResourceIds, folderPath);

    resourcesListBatches.push({ resourceIds: currentFolderResourceIds });
    if (otherFolderResourceIds.length > 0) {
      resourcesListBatches.push({
        header: 'Resources in Other Folders',
        resourceIds: otherFolderResourceIds,
      });
    }
    return resourcesListBatches;
  }

  const resourcesListBatches = getResourcesListBatches();

  return (
    <NotificationPopup
      header={header}
      headerClassname={classes.header}
      rightButtonText={ButtonText.Close}
      onRightButtonClick={props.closePopup}
      onBackdropClick={props.closePopup}
      onEscapeKeyDown={props.closePopup}
      content={
        <div className={classes.resourceListContainer}>
          <ResourcesList
            resourcesListBatches={resourcesListBatches}
            maxHeight={useWindowHeight() - heightOffset}
          />
        </div>
      }
      isOpen={props.isOpen}
      fullWidth={true}
    />
  );
}
