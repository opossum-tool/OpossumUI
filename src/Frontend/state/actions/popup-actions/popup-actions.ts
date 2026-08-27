// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import type {
  ExportType,
  FileFormatInfo,
  MergeOpossumFilesResult,
  PackageInfo,
  SplitFileResult,
} from '../../../../shared/shared-types';
import type { View } from '../../../enums/enums';
import { invalidateBackendQueries } from '../../../util/backendClient';
import {
  getIsPackageInfoDirty,
  getSelectedResourceId,
  getTargetAttributionFilterChange,
} from '../../selectors/resource-selectors';
import {
  getExportFileRequest,
  getImportFileRequest,
  getMergeOpossumFilesRequest,
  getOpenFileRequest,
  getSplitFileRequest,
  getTargetView,
} from '../../selectors/view-selector';
import type { AppThunkAction } from '../../types';
import type { AttributionFilters } from '../../variables/use-filters';
import {
  initializePackageInfoEditing,
  resetResourceState,
} from '../resource-actions/all-views-simple-actions';
import {
  setAttributionFilters,
  setAttributionSelectionPending,
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
  openImportDialog,
  openMergeOpossumFilesDialog,
  openNotSavedPopup,
  openSplitDialog,
  setExportFileRequest,
  setImportFileRequest,
  setMergeOpossumFilesRequest,
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
      dispatch(openNotSavedPopup());
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
    executeImmediately: (dispatch, getState) => {
      if (getSelectedResourceId(getState()) !== resourceId) {
        dispatch(setAttributionSelectionPending(resourceId));
      }
      dispatch(setSelectedResourceId(resourceId));
    },
    requestContinuation: (dispatch) =>
      dispatch(setTargetSelectedResourceId(resourceId)),
  });
}

export function showImportDialogOrOpenUnsavedPopup(
  fileFormat: FileFormatInfo,
  canImportIntoCurrentProject = false,
): AppThunkAction {
  return withUnsavedCheck({
    executeImmediately: (dispatch) =>
      dispatch(openImportDialog(fileFormat, canImportIntoCurrentProject)),
    requestContinuation: (dispatch) =>
      dispatch(
        setImportFileRequest({ fileFormat, canImportIntoCurrentProject }),
      ),
  });
}

export function showMergeOpossumFilesDialogOrOpenUnsavedPopup(
  canMergeIntoCurrentFile: boolean,
  currentFilePath?: string,
): AppThunkAction {
  return withUnsavedCheck({
    executeImmediately: (dispatch) =>
      dispatch(
        openMergeOpossumFilesDialog(canMergeIntoCurrentFile, currentFilePath),
      ),
    requestContinuation: (dispatch) =>
      dispatch(
        setMergeOpossumFilesRequest({
          canMergeIntoCurrentFile,
          currentFilePath,
        }),
      ),
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
  resourcePath?: string,
): AppThunkAction {
  return withUnsavedCheck({
    executeImmediately: (dispatch) => dispatch(openSplitDialog(resourcePath)),
    requestContinuation: (dispatch) =>
      dispatch(setSplitFileRequest({ resourcePath })),
  });
}

export function createSplit(
  selectedResourcePaths: Array<string>,
  destinationPath: string,
): AppThunkAction<Promise<SplitFileResult>> {
  return async () => {
    const result = await window.electronAPI.splitFile(
      selectedResourcePaths,
      destinationPath,
    );
    if (result.status === 'success') {
      await invalidateBackendQueries();
    }
    return result;
  };
}

export function mergeOpossumFilesIntoCurrentFile(
  partitionPaths: Array<string>,
  ignoreReadonlyResourceOutputConflicts: boolean,
): AppThunkAction<Promise<MergeOpossumFilesResult>> {
  return async (dispatch) => {
    const result = await window.electronAPI.mergeOpossumFiles(
      partitionPaths,
      ignoreReadonlyResourceOutputConflicts,
    );
    if (result.status === 'error') {
      return result;
    }
    dispatch(resetResourceState());
    await invalidateBackendQueries();
    return result;
  };
}

export function proceedFromUnsavedPopup(): AppThunkAction {
  return (dispatch, getState) => {
    const targetView = getTargetView(getState());
    const openFileRequest = getOpenFileRequest(getState());
    const importFileRequest = getImportFileRequest(getState());
    const mergeOpossumFilesRequest = getMergeOpossumFilesRequest(getState());
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
      dispatch(
        openImportDialog(
          importFileRequest.fileFormat,
          importFileRequest.canImportIntoCurrentProject,
        ),
      );
      dispatch(setImportFileRequest(null));
    }

    if (mergeOpossumFilesRequest) {
      dispatch(
        openMergeOpossumFilesDialog(
          mergeOpossumFilesRequest.canMergeIntoCurrentFile,
          mergeOpossumFilesRequest.currentFilePath,
        ),
      );
      dispatch(setMergeOpossumFilesRequest(null));
    }

    if (exportFileRequest) {
      dispatch(() => void window.electronAPI.exportFile(exportFileRequest));
      dispatch(setExportFileRequest(null));
    }

    if (splitFileRequest) {
      dispatch(openSplitDialog(splitFileRequest.resourcePath));
      dispatch(setSplitFileRequest(null));
    }

    if (targetAttributionFilterChange) {
      setAttributionFilters(
        dispatch,
        targetAttributionFilterChange.external,
        targetAttributionFilterChange.filters,
      );
      dispatch(
        initializePackageInfoEditing(
          targetAttributionFilterChange.discardedPackageInfo,
        ),
      );
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
    dispatch(setMergeOpossumFilesRequest(null));
    dispatch(setExportFileRequest(null));
    dispatch(setSplitFileRequest(null));
    window.electronAPI.stopLoading();
  };
}
