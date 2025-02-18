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
  getMergeRequest,
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
  setMergeRequest,
  setOpenFileRequest,
  setTargetView,
} from '../view-actions/view-actions';

function withUnsavedCheck({
  executeImmediately,
  requestContinuation,
}: {
  executeImmediately: AppThunkAction;
  requestContinuation: AppThunkAction;
}): AppThunkAction {
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
  return withUnsavedCheck({
    executeImmediately: (dispatch) =>
      dispatch(openResourceInResourceBrowser(resourcePath)),
    requestContinuation: (dispatch) =>
      dispatch(setTargetSelectedResourceId(resourcePath)),
  });
}

export function changeSelectedAttributionOrOpenUnsavedPopup(
  packageInfo: PackageInfo | null,
): AppThunkAction {
  return withUnsavedCheck({
    executeImmediately: (dispatch) => {
      dispatch(setSelectedAttributionId(packageInfo?.id ?? ''));
      dispatch(
        setTemporaryDisplayPackageInfo(
          packageInfo || EMPTY_DISPLAY_PACKAGE_INFO,
        ),
      );
    },
    requestContinuation: (dispatch) =>
      dispatch(setTargetSelectedAttributionId(packageInfo?.id || '')),
  });
}

export function setViewOrOpenUnsavedPopup(selectedView: View): AppThunkAction {
  return withUnsavedCheck({
    executeImmediately: (dispatch) => dispatch(navigateToView(selectedView)),
    requestContinuation: (dispatch, getState) => {
      dispatch(setTargetView(selectedView));
      dispatch(setTargetSelectedResourceId(getSelectedResourceId(getState())));
    },
  });
}

export function setSelectedResourceIdOrOpenUnsavedPopup(
  resourceId: string,
): AppThunkAction {
  return withUnsavedCheck({
    executeImmediately: (dispatch) =>
      dispatch(setSelectedResourceId(resourceId)),
    requestContinuation: (dispatch) =>
      dispatch(setTargetSelectedResourceId(resourceId)),
  });
}

export function showImportDialogOrOpenUnsavedPopup(
  fileFormat: FileFormatInfo,
): AppThunkAction {
  return withUnsavedCheck({
    executeImmediately: (dispatch) =>
      dispatch(openPopup(PopupType.ImportDialog, undefined, fileFormat)),
    requestContinuation: (dispatch) =>
      dispatch(setImportFileRequest(fileFormat)),
  });
}

export function showMergeDialogOrOpenUnsavedPopup(
  fileFormat: FileFormatInfo,
): AppThunkAction {
  return withUnsavedCheck({
    executeImmediately: (dispatch) =>
      dispatch(openPopup(PopupType.MergeDialog, undefined, fileFormat)),
    requestContinuation: (dispatch) => dispatch(setMergeRequest(fileFormat)),
  });
}

export function openFileOrOpenUnsavedPopup(): AppThunkAction {
  return withUnsavedCheck({
    executeImmediately: () => void window.electronAPI.openFile(),
    requestContinuation: (dispatch) => dispatch(setOpenFileRequest(true)),
  });
}

export function exportFileOrOpenUnsavedPopup(
  exportType: ExportType,
): AppThunkAction {
  return withUnsavedCheck({
    executeImmediately: (dispatch) => dispatch(exportFile(exportType)),
    requestContinuation: (dispatch) =>
      dispatch(setExportFileRequest(exportType)),
  });
}

export function proceedFromUnsavedPopup(): AppThunkAction {
  return (dispatch, getState) => {
    const targetView = getTargetView(getState());
    const openFileRequest = getOpenFileRequest(getState());
    const importFileRequest = getImportFileRequest(getState());
    const mergeRequest = getMergeRequest(getState());
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

    if (mergeRequest) {
      dispatch(openPopup(PopupType.MergeDialog, undefined, mergeRequest));
      dispatch(setMergeRequest(null));
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
    window.electronAPI.stopLoading();
  };
}
