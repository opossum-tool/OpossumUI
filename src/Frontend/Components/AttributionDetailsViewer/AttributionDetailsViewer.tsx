// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { makeStyles } from '@material-ui/core/styles';
import MuiTypography from '@material-ui/core/Typography';
import React, { ReactElement, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PackageInfo } from '../../../shared/shared-types';
import { getTemporaryPackageInfo } from '../../state/selectors/all-views-resource-selectors';
import { AttributionColumn } from '../AttributionColumn/AttributionColumn';
import { ResourcesList } from '../ResourcesList/ResourcesList';
import { setUpdateTemporaryPackageInfoForCreator } from '../ResourceDetailsAttributionColumn/resource-details-attribution-column-helpers';
import { isEqual } from 'lodash';
import {
  deleteAttributionForAllAndSave,
  savePackageInfo,
  savePackageInfoIfSavingIsNotDisabled,
} from '../../state/actions/resource-actions/save-actions';
import { setTemporaryPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import {
  getAttributionIdMarkedForReplacement,
  getResourceIdsOfSelectedAttribution,
  getSelectedAttributionId,
} from '../../state/selectors/attribution-view-resource-selectors';
import { OpossumColors } from '../../shared-styles';
import { useWindowHeight } from '../../util/use-window-height';

const useStyles = makeStyles({
  root: {
    background: OpossumColors.lightestBlue,
    flex: 1,
    display: 'flex',
    padding: 8,
    height: '100%',
  },
  resourceColumn: {
    display: 'flex',
    flexDirection: 'column',
    width: '30%',
    height: '100%',
    paddingRight: 8,
    overflowY: 'auto',
    minWidth: 240,
  },
  typography: {
    marginTop: 8,
  },
});

export function AttributionDetailsViewer(): ReactElement | null {
  const classes = useStyles();

  const selectedAttributionId = useSelector(getSelectedAttributionId);
  const temporaryPackageInfo = useSelector(getTemporaryPackageInfo);
  const resourceIdsOfSelectedAttributionId: Array<string> = useSelector(
    getResourceIdsOfSelectedAttribution,
    isEqual
  );
  const attributionIdMarkedForReplacement: string = useSelector(
    getAttributionIdMarkedForReplacement
  );

  const resourceListMaxHeight = useWindowHeight() - 86;

  const dispatch = useDispatch();

  const saveFileRequestListener = useCallback(() => {
    dispatch(
      savePackageInfoIfSavingIsNotDisabled(
        null,
        selectedAttributionId,
        temporaryPackageInfo
      )
    );
  }, [dispatch, selectedAttributionId, temporaryPackageInfo]);

  const dispatchSavePackageInfo = useCallback(() => {
    dispatch(
      savePackageInfo(null, selectedAttributionId, temporaryPackageInfo)
    );
  }, [dispatch, selectedAttributionId, temporaryPackageInfo]);

  const setUpdateTemporaryPackageInfoFor =
    setUpdateTemporaryPackageInfoForCreator(dispatch, temporaryPackageInfo);

  function deleteAttributionForAll(): void {
    dispatch(deleteAttributionForAllAndSave(selectedAttributionId));
  }

  return selectedAttributionId ? (
    <div className={classes.root}>
      <div className={classes.resourceColumn}>
        <MuiTypography className={classes.typography} variant={'subtitle1'}>
          Linked Resources
        </MuiTypography>
        <ResourcesList
          resourceIds={resourceIdsOfSelectedAttributionId}
          maxHeight={resourceListMaxHeight}
        />
      </div>
      <AttributionColumn
        isEditable={true}
        showManualAttributionData={true}
        areButtonsHidden={false}
        displayPackageInfo={temporaryPackageInfo}
        setUpdateTemporaryPackageInfoFor={setUpdateTemporaryPackageInfoFor}
        onSaveButtonClick={dispatchSavePackageInfo}
        onSaveForAllButtonClick={(): void => {}}
        onDeleteButtonClick={deleteAttributionForAll}
        onDeleteForAllButtonClick={(): void => {}}
        setTemporaryPackageInfo={(packageInfo: PackageInfo): void => {
          dispatch(setTemporaryPackageInfo(packageInfo));
        }}
        saveFileRequestListener={saveFileRequestListener}
        selectedAttributionIsMarkedForReplacement={
          selectedAttributionId === attributionIdMarkedForReplacement
        }
      />
    </div>
  ) : null;
}
