// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import dayjs from 'dayjs';
import { type IpcRendererEvent } from 'electron';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { type ParsedFrontendFileContent } from '../../../shared/shared-types';
import { PopupType } from '../../enums/enums';
import {
  exportFileOrOpenUnsavedPopup,
  openFileOrOpenUnsavedPopup,
  showImportDialogOrOpenUnsavedPopup,
  showMergeDialogOrOpenUnsavedPopup,
} from '../../state/actions/popup-actions/popup-actions';
import { resetResourceState } from '../../state/actions/resource-actions/all-views-simple-actions';
import { loadFromFile } from '../../state/actions/resource-actions/load-actions';
import { openPopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch } from '../../state/hooks';
import { backend, setDatabaseInitialized } from '../../util/backendClient';
import {
  type ExportFileRequestListener,
  type LoggingListener,
  type SetBaseURLForRootListener,
  type SetDatabaseInitializedListener,
  type ShowImportDialogListener,
  type ShowMergeDialogListener,
  useIpcRenderer,
} from '../../util/use-ipc-renderer';
import { useSyncProcessingStatusUpdatesToFrontendLogs } from '../../util/use-processing-status-updated';

export const BackendCommunication: React.FC = () => {
  const dispatch = useAppDispatch();

  function fileLoadedListener(
    _: IpcRendererEvent,
    parsedFileContent: ParsedFrontendFileContent,
  ): void {
    dispatch(loadFromFile(parsedFileContent));
  }

  function resetLoadedFileListener(
    _: IpcRendererEvent,
    resetState: boolean,
  ): void {
    if (resetState) {
      dispatch(resetResourceState());
    }
  }

  function showProjectMetadataPopupListener(
    _: IpcRendererEvent,
    showProjectMetadataPopup: boolean,
  ): void {
    if (showProjectMetadataPopup) {
      dispatch(openPopup(PopupType.ProjectMetadataPopup));
    }
  }

  function showProjectStatisticsPopupListener(
    _: IpcRendererEvent,
    showProjectStatisticsPopup: boolean,
  ): void {
    if (showProjectStatisticsPopup) {
      dispatch(openPopup(PopupType.ProjectStatisticsPopup));
    }
  }

  function showUpdateAppPopupListener(
    _: IpcRendererEvent,
    showUpdateAppPopup: boolean,
  ): void {
    if (showUpdateAppPopup) {
      dispatch(openPopup(PopupType.UpdateAppPopup));
    }
  }

  useIpcRenderer(AllowedFrontendChannels.FileLoaded, fileLoadedListener, [
    dispatch,
  ]);
  useIpcRenderer(
    AllowedFrontendChannels.ResetLoadedFile,
    resetLoadedFileListener,
    [dispatch],
  );
  useIpcRenderer<LoggingListener>(
    AllowedFrontendChannels.Logging,
    (_, log) => {
      const { date, level, message } = log;
      console[level](`${dayjs(date).format('HH:mm:ss.SSS')} ${message}`);
    },
    [dispatch],
  );
  useSyncProcessingStatusUpdatesToFrontendLogs();

  useIpcRenderer(
    AllowedFrontendChannels.ShowProjectMetadataPopup,
    showProjectMetadataPopupListener,
    [dispatch],
  );
  useIpcRenderer(
    AllowedFrontendChannels.ShowProjectStatisticsPopup,
    showProjectStatisticsPopupListener,
    [dispatch],
  );
  useIpcRenderer<SetBaseURLForRootListener>(
    AllowedFrontendChannels.SetBaseURLForRoot,
    (_, baseURL) => backend.updateRootBaseURL.mutate({ baseURL }),
    [],
  );
  useIpcRenderer<ExportFileRequestListener>(
    AllowedFrontendChannels.ExportFileRequest,
    (_, exportType) => dispatch(exportFileOrOpenUnsavedPopup(exportType)),
    [dispatch],
  );
  useIpcRenderer(
    AllowedFrontendChannels.ShowUpdateAppPopup,
    showUpdateAppPopupListener,
    [dispatch],
  );
  useIpcRenderer(
    AllowedFrontendChannels.OpenFileWithUnsavedCheck,
    () => dispatch(openFileOrOpenUnsavedPopup()),
    [dispatch],
  );
  useIpcRenderer<ShowImportDialogListener>(
    AllowedFrontendChannels.ShowImportDialog,
    (_, fileFormat) => dispatch(showImportDialogOrOpenUnsavedPopup(fileFormat)),
    [dispatch],
  );
  useIpcRenderer<ShowMergeDialogListener>(
    AllowedFrontendChannels.ShowMergeDialog,
    (_, fileFormat) => dispatch(showMergeDialogOrOpenUnsavedPopup(fileFormat)),
    [dispatch],
  );
  useIpcRenderer<SetDatabaseInitializedListener>(
    AllowedFrontendChannels.SetDatabaseInitialized,
    (_, databaseInitialized) => setDatabaseInitialized(databaseInitialized),
    [],
  );

  return null;
};
