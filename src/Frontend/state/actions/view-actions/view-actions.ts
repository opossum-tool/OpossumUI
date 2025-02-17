// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  ExportType,
  FileFormatInfo,
  Log,
} from '../../../../shared/shared-types';
import { PopupType, View } from '../../../enums/enums';
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../../shared-constants';
import { State } from '../../../types/types';
import { getPackageInfoOfSelectedAttribution } from '../../selectors/resource-selectors';
import { getSelectedView } from '../../selectors/view-selector';
import { AppThunkAction, AppThunkDispatch } from '../../types';
import { setTemporaryDisplayPackageInfo } from '../resource-actions/all-views-simple-actions';
import {
  ACTION_CLOSE_POPUP,
  ACTION_OPEN_POPUP,
  ACTION_RESET_VIEW_STATE,
  ACTION_SET_EXPORT_FILE_REQUEST,
  ACTION_SET_IMPORT_FILE_REQUEST,
  ACTION_SET_LOADING,
  ACTION_SET_LOG_MESSAGE,
  ACTION_SET_OPEN_FILE_REQUEST,
  ACTION_SET_TARGET_VIEW,
  ACTION_SET_VIEW,
  ClosePopupAction,
  OpenPopupAction,
  ResetViewStateAction,
  SetExportFileRequestAction,
  SetImportFileRequestAction,
  SetLoadingAction,
  SetLogMessageAction,
  SetOpenFileRequestAction,
  SetTargetView,
  SetView,
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

    const updatedTemporaryDisplayPackageInfo =
      getPackageInfoOfSelectedAttribution(getState()) ||
      EMPTY_DISPLAY_PACKAGE_INFO;
    dispatch(
      setTemporaryDisplayPackageInfo(updatedTemporaryDisplayPackageInfo),
    );
  };
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

export function openPopup(
  popup: PopupType,
  attributionId?: string,
  fileFormat?: FileFormatInfo,
): OpenPopupAction {
  return {
    type: ACTION_OPEN_POPUP,
    payload: {
      popup,
      attributionId,
      fileFormat,
    },
  };
}

export function closePopup(): ClosePopupAction {
  return { type: ACTION_CLOSE_POPUP };
}

export function setOpenFileRequest(
  openFileRequest: boolean,
): SetOpenFileRequestAction {
  return { type: ACTION_SET_OPEN_FILE_REQUEST, payload: openFileRequest };
}

export function setImportFileRequest(
  fileFormat: FileFormatInfo | null,
): SetImportFileRequestAction {
  return { type: ACTION_SET_IMPORT_FILE_REQUEST, payload: fileFormat };
}

export function setExportFileRequest(
  exportFileRequest: ExportType | null,
): SetExportFileRequestAction {
  return { type: ACTION_SET_EXPORT_FILE_REQUEST, payload: exportFileRequest };
}

export function setLoading(loading: boolean): SetLoadingAction {
  return { type: ACTION_SET_LOADING, payload: loading };
}

export function writeLogMessage(log: Log): SetLogMessageAction {
  return { type: ACTION_SET_LOG_MESSAGE, payload: log };
}

export function writeInfoLogMessage(message: string): SetLogMessageAction {
  return writeLogMessage({
    date: new Date(),
    message,
    level: 'info',
  });
}
