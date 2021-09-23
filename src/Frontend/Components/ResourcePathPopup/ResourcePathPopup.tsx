// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { makeStyles } from '@material-ui/core/styles';
import React, { ReactElement } from 'react';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { ResourcesList } from '../ResourcesList/ResourcesList';
import { useSelector } from 'react-redux';
import {
  getExternalAttributionsToResources,
  getManualAttributionsToResources,
} from '../../state/selectors/all-views-resource-selectors';
import { useWindowHeight } from '../../util/use-window-height';
import { getSelectedResourceId } from '../../state/selectors/audit-view-resource-selectors';
import {
  insertHeaderForOtherFolderResourceIds,
  mergeCurrentAndOtherFolderResourceIds,
  splitResourceItToCurrentAndOtherFolder,
} from './resource-path-popup-helpers';

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
  const folderPath = useSelector(getSelectedResourceId);

  const externalAttributionsToResources = useSelector(
    getExternalAttributionsToResources
  );
  const manualAttributionsToResources = useSelector(
    getManualAttributionsToResources
  );

  let allResourceIds = props.isExternalAttribution
    ? externalAttributionsToResources[props.attributionId]
    : manualAttributionsToResources[props.attributionId];

  const [currentFolderResourceIds, otherFolderResourceIds] =
    splitResourceItToCurrentAndOtherFolder(allResourceIds, folderPath);

  const headerIndices = insertHeaderForOtherFolderResourceIds(
    currentFolderResourceIds,
    otherFolderResourceIds
  );
  allResourceIds = mergeCurrentAndOtherFolderResourceIds(
    currentFolderResourceIds,
    otherFolderResourceIds
  );

  const header = `Resources for selected ${
    props.isExternalAttribution ? 'signal' : 'attribution'
  }`;

  return (
    <NotificationPopup
      header={header}
      headerClassname={classes.header}
      rightButtonText={'Close'}
      onRightButtonClick={props.closePopup}
      onBackdropClick={props.closePopup}
      onEscapeKeyDown={props.closePopup}
      content={
        <div className={classes.resourceListContainer}>
          <ResourcesList
            resourceIds={allResourceIds}
            maxHeight={useWindowHeight() - heightOffset}
            headerIndices={headerIndices}
          />
        </div>
      }
      isOpen={props.isOpen}
      fullWidth={true}
    />
  );
}
