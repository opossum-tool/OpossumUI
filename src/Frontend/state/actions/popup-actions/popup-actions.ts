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
import { text } from '../../../../shared/text';
import { queryClient } from '../../../Components/AppContainer/queryClient';
import { toast } from '../../../Components/Toaster';
import { PopupType, type View } from '../../../enums/enums';
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
  getOpenPopup,
  getQuitAppRequested,
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
import type { AttributionSelectionPolicy } from '../resource-actions/types';
import {
  closePopup,
  navigateToView,
  openImportDialog,
  openMergeOpossumFilesDialog,
  openNotSavedPopup,
  openSplitDialog,
  setExportFileRequest,
  setImportFileRequest,
  setIsSavingBeforeQuit,
  setMergeOpossumFilesRequest,
  setOpenFileRequest,
  setQuitAppRequest,
  setSplitFileRequest,
  setTargetView,
} from '../view-actions/view-actions';

/**
 * Resolves once no TanStack Query mutation is pending anymore. Mutations are
 * executed in the DB process via the renderer's own connection, which the
 * main process cannot observe; waiting here ensures the DB process state is
 * settled before the app quits.
 */
async function waitForMutationsToSettle(): Promise<void> {
  if (queryClient.isMutating() === 0) {
    return;
  }
  await new Promise<void>((resolve) => {
    const unsubscribe = queryClient.getMutationCache().subscribe(() => {
      if (queryClient.isMutating() === 0) {
        unsubscribe();
        resolve();
      }
    });
  });
}

/**
 * Confirms the quit in the main process once no TanStack Query mutation is
 * pending anymore. Mutations are executed in the DB process via the
 * renderer's own connection, which the main process cannot observe; waiting
 * here ensures the DB process state is settled before the app quits. The
 * saving indicator is shown from here on, covering the final save performed
 * by the main process.
 */
function confirmQuitAfterMutationsSettle(): AppThunkAction<Promise<void>> {
  return async (dispatch) => {
    await waitForMutationsToSettle();
    dispatch(setIsSavingBeforeQuit(true));
    void window.electronAPI.confirmQuit();
  };
}

function withUnsavedCheck({
  executeImmediately,
  requestContinuation,
  continuation,
}: {
  executeImmediately: AppThunkAction;
  requestContinuation?: AppThunkAction;
  continuation?: 'restart-and-update';
}): AppThunkAction {
  return (dispatch, getState) => {
    if (getIsPackageInfoDirty(getState())) {
      if (requestContinuation) {
        dispatch(requestContinuation);
      }
      dispatch(openNotSavedPopup(undefined, continuation));
    } else {
      dispatch(executeImmediately);
    }
  };
}

export function restartAndUpdateOrOpenUnsavedPopup(): AppThunkAction {
  return withUnsavedCheck({
    executeImmediately: restartAndUpdate,
    continuation: 'restart-and-update',
  });
}

function restartAndUpdate(): void {
  void window.electronAPI.restartAndUpdate().catch((error: unknown) => {
    toast.error(
      error instanceof Error ? error.message : text.updateApp.restartFailed,
    );
  });
}

export function navigateToSelectedPathOrOpenUnsavedPopup(
  resourcePath: string,
  attributionSelectionPolicy: AttributionSelectionPolicy,
): AppThunkAction {
  return withUnsavedCheck({
    executeImmediately: (dispatch) =>
      dispatch(
        openResourceInResourceBrowser(resourcePath, attributionSelectionPolicy),
      ),
    requestContinuation: (dispatch) =>
      dispatch(
        setTargetSelectedResourceId(resourcePath, attributionSelectionPolicy),
      ),
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
    executeImmediately: (dispatch, getState) => {
      dispatch(
        setSelectedResourceId(getSelectedResourceId(getState()), 'auto'),
      );
      setAttributionFilters(dispatch, external, filters);
    },
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
  attributionSelectionPolicy: AttributionSelectionPolicy,
): AppThunkAction {
  return withUnsavedCheck({
    executeImmediately: (dispatch) =>
      dispatch(setSelectedResourceId(resourceId, attributionSelectionPolicy)),
    requestContinuation: (dispatch) =>
      dispatch(
        setTargetSelectedResourceId(resourceId, attributionSelectionPolicy),
      ),
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

export function quitAppOrOpenUnsavedPopup(): AppThunkAction {
  return withUnsavedCheck({
    executeImmediately: (dispatch) =>
      void dispatch(confirmQuitAfterMutationsSettle()),
    requestContinuation: (dispatch) => dispatch(setQuitAppRequest(true)),
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

export function proceedFromUnsavedPopup(): AppThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    dispatch(
      initializePackageInfoEditing(
        getState().resourceState.originalDisplayPackageInfo,
      ),
    );
    const popup = getOpenPopup(getState());
    const targetView = getTargetView(getState());
    const openFileRequest = getOpenFileRequest(getState());
    const importFileRequest = getImportFileRequest(getState());
    const mergeOpossumFilesRequest = getMergeOpossumFilesRequest(getState());
    const exportFileRequest = getExportFileRequest(getState());
    const splitFileRequest = getSplitFileRequest(getState());
    const targetAttributionFilterChange =
      getTargetAttributionFilterChange(getState());
    const quitAppRequested = getQuitAppRequested(getState());

    if (quitAppRequested) {
      // Quitting discards the changes and any pending action targets. The
      // popup stays open (with a spinning button) until pending mutations
      // have settled, so that the final quit cannot silently lose writes.
      await waitForMutationsToSettle();
      dispatch(closePopup());
      dispatch(setTargetView(null));
      dispatch(setTargetSelectedResourceId(null));
      dispatch(setTargetSelectedAttributionId(null));
      dispatch(setTargetAttributionFilterChange(null));
      dispatch(setOpenFileRequest(null));
      dispatch(setImportFileRequest(null));
      dispatch(setMergeOpossumFilesRequest(null));
      dispatch(setExportFileRequest(null));
      dispatch(setSplitFileRequest(null));
      dispatch(setQuitAppRequest(false));
      void dispatch(confirmQuitAfterMutationsSettle());
      return;
    }

    dispatch(closePopup());

    if (
      popup?.popup === PopupType.NotSavedPopup &&
      popup.continuation === 'restart-and-update'
    ) {
      restartAndUpdate();
      return;
    }

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
      dispatch(
        setSelectedResourceId(getSelectedResourceId(getState()), 'auto'),
      );
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
    dispatch(setQuitAppRequest(false));
    window.electronAPI.stopLoading();
  };
}
