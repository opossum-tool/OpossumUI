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
  SaveResult,
  SplitFileResult,
} from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { toast } from '../../../Components/Toaster';
import { PopupType, View } from '../../../enums/enums';
import { ROOT_PATH } from '../../../shared-constants';
import { invalidateBackendQueries } from '../../../util/backendClient';
import { attemptToLeave } from '../../../util/save-recovery';
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
  getQuitAppRequested,
  getSplitFileRequest,
  getTargetView,
} from '../../selectors/view-selector';
import type { AppThunkAction } from '../../types';
import {
  AI_REVIEW_DESTINATION,
  type AiReviewDestination,
} from '../../variables/ai-review-destination';
import {
  STATISTICS_DESTINATION,
  type StatisticsDestination,
} from '../../variables/statistics-destination';
import {
  ALL_RESOURCES_SEARCH,
  type AttributionFilters,
  RESOURCE_TREE_FILTERS,
} from '../../variables/use-filters';
import {
  initializePackageInfoEditing,
  resetResourceState,
} from '../resource-actions/all-views-simple-actions';
import {
  setAttributionFilters,
  setPendingAttributionNavigation,
  setSelectedAttributionId,
  setSelectedResourceId,
  setTargetAttributionFilterChange,
  setTargetSelectedAttributionId,
  setTargetSelectedResourceId,
} from '../resource-actions/audit-view-simple-actions';
import {
  openResourceInResourceBrowser,
  resetManualAuditFiltersPreservingSort,
  setSelectedResourceOrAttributionIdToTargetValue,
} from '../resource-actions/navigation-actions';
import type { AttributionSelectionPolicy } from '../resource-actions/types';
import { setUserSetting } from '../user-settings-actions/user-settings-actions';
import { setVariable } from '../variables-actions/variables-actions';
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

function confirmQuitAfterFlushingSaves(
  afterFlush?: () => void,
): AppThunkAction<Promise<void>> {
  return async (dispatch) => {
    let actionStarted = false;
    try {
      await attemptToLeave('quit', async (failureId) => {
        actionStarted = true;
        dispatch(setIsSavingBeforeQuit(true));
        try {
          await window.electronAPI.flushPendingSaves();
          afterFlush?.();
          return failureId === undefined
            ? window.electronAPI.confirmQuit()
            : window.electronAPI.confirmQuit({ discardUnsavedChanges: true });
        } finally {
          dispatch(setIsSavingBeforeQuit(false));
        }
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      if (actionStarted) {
        dispatch(setQuitAppRequest(false));
      }
    }
  };
}

function openFileAfterFlushingSaves(
  filePath?: string,
): AppThunkAction<Promise<void>> {
  return async (dispatch) => {
    let actionStarted = false;
    try {
      await attemptToLeave('open', async (failureId) => {
        actionStarted = true;
        dispatch(setIsSavingBeforeQuit(true));
        let result: SaveResult;
        try {
          result = await window.electronAPI.flushPendingSaves();
        } finally {
          dispatch(setIsSavingBeforeQuit(false));
        }
        if (result.status === 'failed' && failureId === undefined) {
          return { status: 'blocked', failure: result.failure };
        }
        if (filePath === undefined) {
          await window.electronAPI.openFile();
        } else {
          await window.electronAPI.openFile(filePath);
        }
        return { status: 'completed' };
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      if (actionStarted) {
        dispatch(setOpenFileRequest(null));
      }
    }
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
  void attemptToLeave('restart-and-update', () =>
    window.electronAPI.restartAndUpdate(),
  ).catch((error: unknown) => {
    toast.error(
      error instanceof Error ? error.message : text.updateApp.restartFailed,
    );
  });
}

function executeStatisticsDestination(
  destination: StatisticsDestination,
): AppThunkAction {
  return (dispatch) => {
    dispatch(navigateToView(View.Audit));
    dispatch(setSelectedResourceId(ROOT_PATH, 'auto'));
    setAttributionFilters(dispatch, destination.external, destination.filters);
    if (destination.resourceFilters) {
      dispatch(setVariable(RESOURCE_TREE_FILTERS, destination.resourceFilters));
      dispatch(setVariable(ALL_RESOURCES_SEARCH, ''));
    }
    if (destination.external) {
      dispatch(setUserSetting({ areHiddenSignalsVisible: false }));
      void window.electronAPI.updateUserSettings({
        areHiddenSignalsVisible: false,
      });
    }
  };
}

export function navigateFromStatistics(
  popupId: string,
  destination: StatisticsDestination,
): AppThunkAction {
  return (dispatch, getState) => {
    const entry = getState().viewState.popupInfo.find(
      ({ id }) => id === popupId,
    );
    if (entry?.info.popup !== PopupType.ProjectStatisticsPopup) {
      return;
    }
    dispatch(closePopup(entry.id));
    dispatch(
      withUnsavedCheck({
        executeImmediately: executeStatisticsDestination(destination),
        requestContinuation: (dispatch) =>
          dispatch(setVariable(STATISTICS_DESTINATION, destination)),
      }),
    );
  };
}

function executeAiReviewDestination(
  destination: AiReviewDestination,
): AppThunkAction {
  return (dispatch) => {
    dispatch(resetManualAuditFiltersPreservingSort());
    dispatch(navigateToView(View.Audit));
    dispatch(
      openResourceInResourceBrowser(destination.resourcePath, 'preserve'),
    );
    dispatch(
      setPendingAttributionNavigation({
        attributionUuid: destination.attributionUuid,
        fallbackResourcePath: destination.resourcePath,
      }),
    );
    dispatch(setSelectedAttributionId(destination.attributionUuid));
  };
}

export function navigateToAiReviewOrOpenUnsavedPopup(
  destination: AiReviewDestination,
): AppThunkAction {
  return withUnsavedCheck({
    executeImmediately: executeAiReviewDestination(destination),
    requestContinuation: (dispatch) =>
      dispatch(setVariable(AI_REVIEW_DESTINATION, destination)),
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

export function navigateToSelectedPathInAuditOrOpenUnsavedPopup(
  resourcePath: string,
  attributionSelectionPolicy: AttributionSelectionPolicy,
): AppThunkAction {
  return withUnsavedCheck({
    executeImmediately: (dispatch) => {
      dispatch(navigateToView(View.Audit));
      dispatch(
        openResourceInResourceBrowser(resourcePath, attributionSelectionPolicy),
      );
    },
    requestContinuation: (dispatch) => {
      dispatch(setTargetView(View.Audit));
      dispatch(
        setTargetSelectedResourceId(resourcePath, attributionSelectionPolicy),
      );
    },
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
    requestContinuation: (dispatch) => {
      dispatch(setTargetView(selectedView));
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
    executeImmediately: (dispatch) =>
      void dispatch(openFileAfterFlushingSaves(filePath)),
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
      void dispatch(confirmQuitAfterFlushingSaves()),
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

export function mergeOpossumFilesIntoCurrentFile(props: {
  partitionPaths: Array<string>;
  ignoreReadonlyResourceOutputConflicts: boolean;
  deleteSplitFilesAfterMerge: boolean;
}): AppThunkAction<Promise<MergeOpossumFilesResult>> {
  return async (dispatch) => {
    const result = await window.electronAPI.mergeOpossumFiles(props);
    if (result.status === 'error') {
      return result;
    }
    dispatch(resetResourceState());
    await invalidateBackendQueries();
    return result;
  };
}

export function proceedFromUnsavedPopup(
  popupId: string,
): AppThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const entry = getState().viewState.popupInfo.find(
      ({ id }) => id === popupId,
    );
    if (entry?.info.popup !== PopupType.NotSavedPopup) {
      return;
    }
    dispatch(
      initializePackageInfoEditing(
        getState().resourceState.originalDisplayPackageInfo,
      ),
    );
    const popup = entry.info;
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
      await dispatch(
        confirmQuitAfterFlushingSaves(() => {
          dispatch(closePopup(entry.id));
          dispatch(setTargetView(null));
          dispatch(setTargetSelectedResourceId(null));
          dispatch(setTargetSelectedAttributionId(null));
          dispatch(setTargetAttributionFilterChange(null));
          dispatch(setOpenFileRequest(null));
          dispatch(setImportFileRequest(null));
          dispatch(setMergeOpossumFilesRequest(null));
          dispatch(setExportFileRequest(null));
          dispatch(setSplitFileRequest(null));
        }),
      );
      return;
    }

    const statisticsDestination = getState().variablesState[
      STATISTICS_DESTINATION
    ] as StatisticsDestination | null | undefined;
    dispatch(closePopup(entry.id));
    if (statisticsDestination) {
      dispatch(setVariable(STATISTICS_DESTINATION, null));
      dispatch(executeStatisticsDestination(statisticsDestination));
    }

    const aiReviewDestination = getState().variablesState[
      AI_REVIEW_DESTINATION
    ] as AiReviewDestination | null | undefined;
    if (aiReviewDestination) {
      dispatch(setVariable(AI_REVIEW_DESTINATION, null));
      dispatch(executeAiReviewDestination(aiReviewDestination));
    }

    if (
      popup?.popup === PopupType.NotSavedPopup &&
      popup.continuation === 'restart-and-update'
    ) {
      restartAndUpdate();
      return;
    }

    if (openFileRequest) {
      void dispatch(
        openFileAfterFlushingSaves(
          openFileRequest.kind === 'path'
            ? openFileRequest.filePath
            : undefined,
        ),
      );

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

export function closePopupAndUnsetTargets(popupId: string): AppThunkAction {
  return (dispatch, getState) => {
    const entry = getState().viewState.popupInfo.find(
      ({ id }) => id === popupId,
    );
    if (entry?.info.popup !== PopupType.NotSavedPopup) {
      return;
    }
    dispatch(setTargetView(null));
    dispatch(setTargetSelectedResourceId(null));
    dispatch(setTargetSelectedAttributionId(null));
    dispatch(setTargetAttributionFilterChange(null));
    dispatch(setVariable(STATISTICS_DESTINATION, null));
    dispatch(setVariable(AI_REVIEW_DESTINATION, null));
    dispatch(closePopup(entry.id));
    dispatch(setOpenFileRequest(null));
    dispatch(setImportFileRequest(null));
    dispatch(setMergeOpossumFilesRequest(null));
    dispatch(setExportFileRequest(null));
    dispatch(setSplitFileRequest(null));
    dispatch(setQuitAppRequest(false));
    window.electronAPI.stopLoading();
  };
}
