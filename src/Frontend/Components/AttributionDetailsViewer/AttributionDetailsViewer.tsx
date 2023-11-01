// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiTypography from '@mui/material/Typography';
import { ReactElement, useCallback } from 'react';

import { PopupType } from '../../enums/enums';
import { OpossumColors } from '../../shared-styles';
import {
  deleteAttributionGloballyAndSave,
  savePackageInfo,
  savePackageInfoIfSavingIsNotDisabled,
} from '../../state/actions/resource-actions/save-actions';
import { openPopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { getTemporaryDisplayPackageInfo } from '../../state/selectors/all-views-resource-selectors';
import {
  getResourceIdsOfSelectedAttribution,
  getSelectedAttributionIdInAttributionView,
} from '../../state/selectors/attribution-view-resource-selectors';
import { convertDisplayPackageInfoToPackageInfo } from '../../util/convert-package-info';
import { AttributionColumn } from '../AttributionColumn/AttributionColumn';
import { ResizableBox } from '../ResizableBox/ResizableBox';
import { ResourcesTree } from '../ResourcesTree/ResourcesTree';

const classes = {
  root: {
    background: OpossumColors.lightestBlue,
    flex: 1,
    display: 'flex',
    padding: '8px',
  },
  resourceColumn: {
    display: 'flex',
    flexDirection: 'column',
    paddingRight: '8px',
  },
  typography: {
    marginTop: '8px',
  },
  tree: {
    background: OpossumColors.white,
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
};

export function AttributionDetailsViewer(): ReactElement | null {
  const selectedAttributionId = useAppSelector(
    getSelectedAttributionIdInAttributionView,
  );
  const temporaryDisplayPackageInfo = useAppSelector(
    getTemporaryDisplayPackageInfo,
  );
  const resourceIdsOfSelectedAttributionId: Array<string> =
    useAppSelector(getResourceIdsOfSelectedAttribution) || [];

  const dispatch = useAppDispatch();

  const saveFileRequestListener = useCallback(() => {
    if (temporaryDisplayPackageInfo.wasPreferred) {
      dispatch(openPopup(PopupType.ModifyWasPreferredAttributionPopup));
    } else {
      dispatch(
        savePackageInfoIfSavingIsNotDisabled(
          null,
          selectedAttributionId,
          temporaryDisplayPackageInfo,
        ),
      );
    }
  }, [dispatch, selectedAttributionId, temporaryDisplayPackageInfo]);

  const dispatchSavePackageInfoOrOpenWasPreferredPopup = useCallback(() => {
    if (temporaryDisplayPackageInfo.wasPreferred) {
      dispatch(openPopup(PopupType.ModifyWasPreferredAttributionPopup));
    } else {
      dispatch(
        savePackageInfo(
          null,
          selectedAttributionId,
          convertDisplayPackageInfoToPackageInfo(temporaryDisplayPackageInfo),
        ),
      );
    }
  }, [dispatch, selectedAttributionId, temporaryDisplayPackageInfo]);

  function deleteAttribution(): void {
    if (temporaryDisplayPackageInfo.preSelected) {
      dispatch(deleteAttributionGloballyAndSave(selectedAttributionId));
    } else {
      dispatch(
        openPopup(PopupType.ConfirmDeletionPopup, selectedAttributionId),
      );
    }
  }

  return selectedAttributionId ? (
    <MuiBox sx={classes.root}>
      <ResizableBox
        sx={classes.resourceColumn}
        defaultSize={{ width: '30%', height: 'auto' }}
        minWidth={240}
      >
        <MuiTypography sx={classes.typography} variant={'subtitle1'}>
          Linked Resources
        </MuiTypography>
        <ResourcesTree
          resourcePaths={resourceIdsOfSelectedAttributionId}
          highlightSelectedResources={false}
          sx={classes.tree}
        />
      </ResizableBox>
      <AttributionColumn
        isEditable={true}
        showManualAttributionData={true}
        areButtonsHidden={false}
        onSaveButtonClick={dispatchSavePackageInfoOrOpenWasPreferredPopup}
        onDeleteButtonClick={deleteAttribution}
        saveFileRequestListener={saveFileRequestListener}
      />
    </MuiBox>
  ) : null;
}
