// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { v4 as uuid4 } from 'uuid';

import type {
  ExportType,
  FileFormatInfo,
} from '../../../../shared/shared-types';
import { PopupType, type View } from '../../../enums/enums';
import type {
  PopupInfo,
  PopupWithoutPayload,
  State,
} from '../../../types/types';
import {
  getUserSettings,
  getUserSettingsLoaded,
} from '../../selectors/user-settings-selector';
import { getSelectedView } from '../../selectors/view-selector';
import type { AppThunkAction, AppThunkDispatch } from '../../types';
import { fetchUserSettings } from '../user-settings-actions/user-settings-actions';
import {
  ACTION_CLOSE_POPUP,
  ACTION_OPEN_POPUP,
  ACTION_RESET_VIEW_STATE,
  ACTION_SET_EXPORT_FILE_REQUEST,
  ACTION_SET_IMPORT_FILE_REQUEST,
  ACTION_SET_MERGE_OPOSSUM_FILES_REQUEST,
  ACTION_SET_OPEN_FILE_REQUEST,
  ACTION_SET_SPLIT_FILE_REQUEST,
  ACTION_SET_TARGET_VIEW,
  ACTION_SET_VIEW,
  type ClosePopupAction,
  type ImportFileRequest,
  type MergeOpossumFilesRequest,
  type OpenFileRequest,
  type OpenPopupAction,
  type ResetViewStateAction,
  type SetExportFileRequestAction,
  type SetImportFileRequestAction,
  type SetMergeOpossumFilesRequestAction,
  type SetOpenFileRequestAction,
  type SetSplitFileRequestAction,
  type SetTargetView,
  type SetView,
  type SplitFileRequest,
} from './types';

export function resetViewState(): ResetViewStateAction {
  return { type: ACTION_RESET_VIEW_STATE };
}

export function navigateToView(view: View): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    if (getSelectedView(getState()) === view) {
      return;
    }

    dispatch(setTargetView(null));
    dispatch(setView(view));
  };
}

export async function openStatisticsPopupAfterFileLoadIfEnabled(
  dispatch: AppThunkDispatch,
  getState: () => State,
): Promise<void> {
  try {
    if (!getUserSettingsLoaded(getState())) {
      await dispatch(fetchUserSettings());
    }
    const showStatisticsPopup =
      getUserSettings(getState()).showProjectStatistics;
    if (showStatisticsPopup) {
      dispatch(openPopup(PopupType.ProjectStatisticsPopup));
    }
  } catch (error) {
    console.error('Could not load user settings for project statistics', error);
  }
}

export function setView(view: View): SetView {
  return {
    type: ACTION_SET_VIEW,
    payload: view,
  };
}

export function setTargetView(targetView: View | null): SetTargetView {
  return {
    type: ACTION_SET_TARGET_VIEW,
    payload: targetView,
  };
}

function createOpenPopupAction(info: PopupInfo): OpenPopupAction {
  return {
    type: ACTION_OPEN_POPUP,
    payload: { id: uuid4(), info },
  };
}

export function openPopup(popup: PopupWithoutPayload): OpenPopupAction;
export function openPopup(
  popup: PopupType.NotSavedPopup,
  attributionId?: string,
): OpenPopupAction;
export function openPopup(
  popup: PopupWithoutPayload | PopupType.NotSavedPopup,
  attributionId?: string,
): OpenPopupAction {
  return createOpenPopupAction(
    popup === PopupType.NotSavedPopup ? { popup, attributionId } : { popup },
  );
}

export function openNotSavedPopup(
  attributionId?: string,
  continuation?: 'restart-and-update',
): OpenPopupAction {
  return createOpenPopupAction({
    popup: PopupType.NotSavedPopup,
    attributionId,
    ...(continuation && { continuation }),
  });
}

export function openImportDialog(
  fileFormat: FileFormatInfo,
  canImportIntoCurrentProject = false,
): OpenPopupAction {
  return createOpenPopupAction({
    popup: PopupType.ImportDialog,
    fileFormat,
    canImportIntoCurrentProject,
  });
}

export function openMergeOpossumFilesDialog(
  canMergeIntoCurrentFile: boolean,
  currentFilePath?: string,
): OpenPopupAction {
  return createOpenPopupAction({
    popup: PopupType.MergeOpossumFilesDialog,
    canMergeIntoCurrentFile,
    currentFilePath,
  });
}

export function openSplitDialog(resourcePath?: string): OpenPopupAction {
  return createOpenPopupAction({
    popup: PopupType.SplitDialog,
    ...(resourcePath && { resourcePath }),
  });
}

export function closePopup(popupId: string): ClosePopupAction {
  return { type: ACTION_CLOSE_POPUP, payload: popupId };
}

export function setOpenFileRequest(
  openFileRequest: OpenFileRequest | null,
): SetOpenFileRequestAction {
  return { type: ACTION_SET_OPEN_FILE_REQUEST, payload: openFileRequest };
}

export function setImportFileRequest(
  importFileRequest: ImportFileRequest | null,
): SetImportFileRequestAction {
  return { type: ACTION_SET_IMPORT_FILE_REQUEST, payload: importFileRequest };
}

export function setMergeOpossumFilesRequest(
  mergeOpossumFilesRequest: MergeOpossumFilesRequest | null,
): SetMergeOpossumFilesRequestAction {
  return {
    type: ACTION_SET_MERGE_OPOSSUM_FILES_REQUEST,
    payload: mergeOpossumFilesRequest,
  };
}

export function setExportFileRequest(
  exportFileRequest: ExportType | null,
): SetExportFileRequestAction {
  return { type: ACTION_SET_EXPORT_FILE_REQUEST, payload: exportFileRequest };
}

export function setSplitFileRequest(
  splitFileRequest: SplitFileRequest | null,
): SetSplitFileRequestAction {
  return { type: ACTION_SET_SPLIT_FILE_REQUEST, payload: splitFileRequest };
}
