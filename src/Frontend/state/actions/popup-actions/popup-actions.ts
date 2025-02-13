// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  ExportType,
  FileFormatInfo,
  PackageInfo,
} from '../../../../shared/shared-types';
import { PopupType, View } from '../../../enums/enums';
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../../shared-constants';
import {
  getIsPackageInfoModified,
  getPackageInfoOfSelectedAttribution,
  getSelectedResourceId,
} from '../../selectors/resource-selectors';
import {
  getExportFileRequest,
  getImportFileRequest,
  getOpenFileRequest,
  getTargetView,
} from '../../selectors/view-selector';
import { AppThunkAction } from '../../types';
import { setTemporaryDisplayPackageInfo } from '../resource-actions/all-views-simple-actions';
import {
  setSelectedAttributionId,
  setSelectedResourceId,
  setTargetSelectedAttributionId,
  setTargetSelectedResourceId,
} from '../resource-actions/audit-view-simple-actions';
import { exportFile } from '../resource-actions/export-actions';
import {
  openResourceInResourceBrowser,
  setSelectedResourceOrAttributionIdToTargetValue,
} from '../resource-actions/navigation-actions';
import {
  closePopup,
  navigateToView,
  openPopup,
  setExportFileRequest,
  setImportFileRequest,
  setOpenFileRequest,
  setTargetView,
} from '../view-actions/view-actions';

export function navigateToSelectedPathOrOpenUnsavedPopup(
  resourcePath: string,
): AppThunkAction {
  return (dispatch, getState) => {
    if (getIsPackageInfoModified(getState())) {
      dispatch(setTargetSelectedResourceId(resourcePath));
      dispatch(openPopup(PopupType.NotSavedPopup));
    } else {
      dispatch(openResourceInResourceBrowser(resourcePath));
    }
  };
}

export function changeSelectedAttributionOrOpenUnsavedPopup(
  packageInfo: PackageInfo | null,
): AppThunkAction {
  return (dispatch, getState) => {
    if (getIsPackageInfoModified(getState())) {
      dispatch(setTargetSelectedAttributionId(packageInfo?.id || ''));
      dispatch(openPopup(PopupType.NotSavedPopup));
    } else {
      dispatch(setSelectedAttributionId(packageInfo?.id ?? ''));
      dispatch(
        setTemporaryDisplayPackageInfo(
          packageInfo || EMPTY_DISPLAY_PACKAGE_INFO,
        ),
      );
    }
  };
}

export function setViewOrOpenUnsavedPopup(selectedView: View): AppThunkAction {
  return (dispatch, getState) => {
    if (getIsPackageInfoModified(getState())) {
      dispatch(setTargetView(selectedView));
      dispatch(setTargetSelectedResourceId(getSelectedResourceId(getState())));
      dispatch(openPopup(PopupType.NotSavedPopup));
    } else {
      dispatch(navigateToView(selectedView));
    }
  };
}

export function setSelectedResourceIdOrOpenUnsavedPopup(
  resourceId: string,
): AppThunkAction {
  return (dispatch, getState) => {
    if (getIsPackageInfoModified(getState())) {
      dispatch(setTargetSelectedResourceId(resourceId));
      dispatch(openPopup(PopupType.NotSavedPopup));
    } else {
      dispatch(setSelectedResourceId(resourceId));
    }
  };
}

export function proceedFromUnsavedPopup(): AppThunkAction {
  return (dispatch, getState) => {
    // discard changes
    dispatch(
      setTemporaryDisplayPackageInfo(
        getPackageInfoOfSelectedAttribution(getState()) ||
          EMPTY_DISPLAY_PACKAGE_INFO,
      ),
    );

    const targetView = getTargetView(getState());
    const openFileRequest = getOpenFileRequest(getState());
    const importFileRequest = getImportFileRequest(getState());
    const exportFileRequest = getExportFileRequest(getState());

    dispatch(closePopup());

    if (openFileRequest) {
      void window.electronAPI.openFile();
      dispatch(setOpenFileRequest(false));
      return;
    }

    if (importFileRequest) {
      dispatch(openPopup(PopupType.ImportDialog, undefined, importFileRequest));
      dispatch(setImportFileRequest(null));
      return;
    }

    if (exportFileRequest) {
      dispatch(exportFile(exportFileRequest));
      dispatch(setExportFileRequest(null));
      return;
    }

    dispatch(setSelectedResourceOrAttributionIdToTargetValue());
    if (targetView) {
      dispatch(navigateToView(targetView));
    }
  };
}

export function closePopupAndUnsetTargets(): AppThunkAction {
  return (dispatch) => {
    dispatch(setTargetView(null));
    dispatch(setTargetSelectedResourceId(''));
    dispatch(setTargetSelectedAttributionId(''));
    dispatch(closePopup());
    dispatch(setOpenFileRequest(false));
    dispatch(setImportFileRequest(null));
    dispatch(setExportFileRequest(null));
  };
}

function actionWithUnsavedCheck(
  executeAction: () => void,
  requestAction: () => void,
): AppThunkAction {
  return (dispatch, getState) => {
    if (getIsPackageInfoModified(getState())) {
      requestAction();
      dispatch(openPopup(PopupType.NotSavedPopup));
    } else {
      executeAction();
    }
  };
}

export function showImportDialogWithUnsavedCheck(
  fileFormat: FileFormatInfo,
): AppThunkAction {
  return (dispatch, _) => {
    dispatch(
      actionWithUnsavedCheck(
        () =>
          dispatch(openPopup(PopupType.ImportDialog, undefined, fileFormat)),
        () => dispatch(setImportFileRequest(fileFormat)),
      ),
    );
  };
}

export function openFileWithUnsavedCheck(): AppThunkAction {
  return (dispatch, _) => {
    dispatch(
      actionWithUnsavedCheck(
        () => void window.electronAPI.openFile(),
        () => dispatch(setOpenFileRequest(true)),
      ),
    );
  };
}

export function exportFileWithUnsavedCheck(
  exportType: ExportType,
): AppThunkAction {
  return (dispatch, _) => {
    dispatch(
      actionWithUnsavedCheck(
        () => dispatch(exportFile(exportType)),
        () => dispatch(setExportFileRequest(exportType)),
      ),
    );
  };
}
