// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import type {
  ExportType,
  FileFormatInfo,
  PackageInfo,
} from '../../../../shared/shared-types';
import { PopupType, type View } from '../../../enums/enums';
import {
  getIsPackageInfoDirty,
  getSelectedResourceId,
  getTargetAttributionFilterChange,
} from '../../selectors/resource-selectors';
import {
  getExportFileRequest,
  getImportFileRequest,
  getMergeRequest,
  getOpenFileRequest,
  getSplitFileRequest,
  getTargetView,
} from '../../selectors/view-selector';
import type { AppThunkAction } from '../../types';
import type { AttributionFilters } from '../../variables/use-filters';
import {
  setIsPackageInfoDirty,
  setTemporaryDisplayPackageInfo,
} from '../resource-actions/all-views-simple-actions';
import {
  setAttributionFilters,
  setSelectedAttributionId,
  setSelectedResourceId,
  setTargetAttributionFilterChange,
  setTargetSelectedAttributionId,
  setTargetSelectedResourceId,
} from '../resource-actions/audit-view-simple-actions';
import {
  openResourceInResourceBrowser,
  setSelectedResourceOrAttributionIdToTargetValue,
} from '../resource-actions/navigation-actions';
import {
  closePopup,
  navigateToView,
  openPopup,
  openSplitDialog,
  setExportFileRequest,
  setImportFileRequest,
  setMergeRequest,
  setOpenFileRequest,
  setSplitFileRequest,
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
    if (getIsPackageInfoDirty(getState())) {
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
    },
    requestContinuation: (dispatch) =>
      dispatch(setTargetSelectedAttributionId(packageInfo?.id || '')),
  });
}

export function changeAttributionFiltersOrOpenUnsavedPopup({
  discardedPackageInfo,
  external,
  filters,
}: {
  discardedPackageInfo: PackageInfo;
  external: boolean;
  filters: AttributionFilters;
}): AppThunkAction {
  return withUnsavedCheck({
    executeImmediately: (dispatch) =>
      setAttributionFilters(dispatch, external, filters),
    requestContinuation: (dispatch) =>
      dispatch(
        setTargetAttributionFilterChange({
          discardedPackageInfo,
          external,
          filters,
        }),
      ),
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

export function openFileOrOpenUnsavedPopup(filePath?: string): AppThunkAction {
  return withUnsavedCheck({
    executeImmediately: () => void window.electronAPI.openFile(filePath),
    requestContinuation: (dispatch) => {
      dispatch(setTargetView(null));
      dispatch(setTargetSelectedResourceId(null));
      dispatch(setTargetSelectedAttributionId(null));
      dispatch(setTargetAttributionFilterChange(null));
      dispatch(setImportFileRequest(null));
      dispatch(setMergeRequest(null));
      dispatch(setExportFileRequest(null));
      dispatch(
        setOpenFileRequest(
          filePath ? { kind: 'path', filePath } : { kind: 'dialog' },
        ),
      );
    },
  });
}

export function exportFileOrOpenUnsavedPopup(
  exportType: ExportType,
): AppThunkAction {
  return withUnsavedCheck({
    executeImmediately: (dispatch) =>
      dispatch(() => void window.electronAPI.exportFile(exportType)),
    requestContinuation: (dispatch) =>
      dispatch(setExportFileRequest(exportType)),
  });
}

export function showSplitDialogOrOpenUnsavedPopup(
  resourcePath: string,
): AppThunkAction {
  return withUnsavedCheck({
    executeImmediately: (dispatch) => dispatch(openSplitDialog(resourcePath)),
    requestContinuation: (dispatch) =>
      dispatch(setSplitFileRequest(resourcePath)),
  });
}

export function proceedFromUnsavedPopup(): AppThunkAction {
  return (dispatch, getState) => {
    const targetView = getTargetView(getState());
    const openFileRequest = getOpenFileRequest(getState());
    const importFileRequest = getImportFileRequest(getState());
    const mergeRequest = getMergeRequest(getState());
    const exportFileRequest = getExportFileRequest(getState());
    const splitFileRequest = getSplitFileRequest(getState());
    const targetAttributionFilterChange =
      getTargetAttributionFilterChange(getState());

    dispatch(closePopup());

    if (openFileRequest) {
      if (openFileRequest.kind === 'path') {
        void window.electronAPI.openFile(openFileRequest.filePath);
      } else {
        void window.electronAPI.openFile();
      }

      dispatch(setOpenFileRequest(null));
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
      dispatch(() => void window.electronAPI.exportFile(exportFileRequest));
      dispatch(setExportFileRequest(null));
    }

    if (splitFileRequest) {
      dispatch(openSplitDialog(splitFileRequest));
      dispatch(setSplitFileRequest(null));
    }

    if (targetAttributionFilterChange) {
      setAttributionFilters(
        dispatch,
        targetAttributionFilterChange.external,
        targetAttributionFilterChange.filters,
      );
      dispatch(
        setTemporaryDisplayPackageInfo(
          targetAttributionFilterChange.discardedPackageInfo,
        ),
      );
      dispatch(setIsPackageInfoDirty(false));
      dispatch(setTargetAttributionFilterChange(null));
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
    dispatch(setTargetSelectedResourceId(null));
    dispatch(setTargetSelectedAttributionId(null));
    dispatch(setTargetAttributionFilterChange(null));
    dispatch(closePopup());
    dispatch(setOpenFileRequest(null));
    dispatch(setImportFileRequest(null));
    dispatch(setExportFileRequest(null));
    dispatch(setSplitFileRequest(null));
    window.electronAPI.stopLoading();
  };
}
