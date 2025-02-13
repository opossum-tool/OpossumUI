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

function withUnsavedCheck(
  executeImmediately: AppThunkAction,
  requestContinuation: AppThunkAction,
): AppThunkAction {
  return (dispatch, getState) => {
    if (getIsPackageInfoModified(getState())) {
      dispatch(requestContinuation);
      dispatch(openPopup(PopupType.NotSavedPopup));
    } else {
      dispatch(executeImmediately);
    }
  };
}

export function navigateToSelectedPathOrOpenUnsavedPopup(
  resourcePath: string,
): AppThunkAction {
  return withUnsavedCheck(
    (dispatch) => dispatch(openResourceInResourceBrowser(resourcePath)),
    (dispatch) => dispatch(setTargetSelectedResourceId(resourcePath)),
  );
}

export function changeSelectedAttributionOrOpenUnsavedPopup(
  packageInfo: PackageInfo | null,
): AppThunkAction {
  return withUnsavedCheck(
    (dispatch) => {
      dispatch(setSelectedAttributionId(packageInfo?.id ?? ''));
      dispatch(
        setTemporaryDisplayPackageInfo(
          packageInfo || EMPTY_DISPLAY_PACKAGE_INFO,
        ),
      );
    },
    (dispatch) =>
      dispatch(setTargetSelectedAttributionId(packageInfo?.id || '')),
  );
}

export function setViewOrOpenUnsavedPopup(selectedView: View): AppThunkAction {
  return withUnsavedCheck(
    (dispatch) => dispatch(navigateToView(selectedView)),
    (dispatch, getState) => {
      dispatch(setTargetView(selectedView));
      dispatch(setTargetSelectedResourceId(getSelectedResourceId(getState())));
    },
  );
}

export function setSelectedResourceIdOrOpenUnsavedPopup(
  resourceId: string,
): AppThunkAction {
  return withUnsavedCheck(
    (dispatch) => dispatch(setSelectedResourceId(resourceId)),
    (dispatch) => dispatch(setTargetSelectedResourceId(resourceId)),
  );
}

export function proceedFromUnsavedPopup(): AppThunkAction {
  return (dispatch, getState) => {
    const targetView = getTargetView(getState());
    const openFileRequest = getOpenFileRequest(getState());
    const importFileRequest = getImportFileRequest(getState());
    const exportFileRequest = getExportFileRequest(getState());

    dispatch(closePopup());

    if (openFileRequest) {
      void window.electronAPI.openFile();
      dispatch(setOpenFileRequest(false));
    }

    if (importFileRequest) {
      dispatch(openPopup(PopupType.ImportDialog, undefined, importFileRequest));
      dispatch(setImportFileRequest(null));
    }

    if (exportFileRequest) {
      dispatch(exportFile(exportFileRequest));
      dispatch(setExportFileRequest(null));
    }

    dispatch(setSelectedResourceOrAttributionIdToTargetValue());
    if (targetView) {
      dispatch(navigateToView(targetView));
    }

    dispatch(
      setTemporaryDisplayPackageInfo(
        getPackageInfoOfSelectedAttribution(getState()) ||
          EMPTY_DISPLAY_PACKAGE_INFO,
      ),
    );
  };
}

export function closePopupAndUnsetTargets(): AppThunkAction {
  return (dispatch) => {
    dispatch(setTargetView(null));
    dispatch(setTargetSelectedResourceId(null));
    dispatch(setTargetSelectedAttributionId(null));
    dispatch(closePopup());
    dispatch(setOpenFileRequest(false));
    dispatch(setImportFileRequest(null));
    dispatch(setExportFileRequest(null));
  };
}

export function showImportDialogWithUnsavedCheck(
  fileFormat: FileFormatInfo,
): AppThunkAction {
  return (dispatch, _) => {
    dispatch(
      withUnsavedCheck(
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
      withUnsavedCheck(
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
      withUnsavedCheck(
        () => dispatch(exportFile(exportType)),
        () => dispatch(setExportFileRequest(exportType)),
      ),
    );
  };
}
