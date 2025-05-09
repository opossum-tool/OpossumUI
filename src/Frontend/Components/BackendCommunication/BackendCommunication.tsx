// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import dayjs from 'dayjs';
import { IpcRendererEvent } from 'electron';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import {
  BaseURLForRootArgs,
  ParsedFileContent,
} from '../../../shared/shared-types';
import { PopupType } from '../../enums/enums';
import { ROOT_PATH } from '../../shared-constants';
import {
  exportFileOrOpenUnsavedPopup,
  openFileOrOpenUnsavedPopup,
  showImportDialogOrOpenUnsavedPopup,
  showMergeDialogOrOpenUnsavedPopup,
} from '../../state/actions/popup-actions/popup-actions';
import {
  resetResourceState,
  setBaseUrlsForSources,
} from '../../state/actions/resource-actions/all-views-simple-actions';
import { loadFromFile } from '../../state/actions/resource-actions/load-actions';
import {
  openPopup,
  openStatisticsPopupAfterFileLoadIfEnabled,
} from '../../state/actions/view-actions/view-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { getBaseUrlsForSources } from '../../state/selectors/resource-selectors';
import {
  ExportFileRequestListener,
  LoggingListener,
  ShowImportDialogListener,
  ShowMergeDialogListener,
  useIpcRenderer,
} from '../../util/use-ipc-renderer';
import { useSyncProcessingStatusUpdatesToFrontendLogs } from '../../util/use-processing-status-updated';

export const BackendCommunication: React.FC = () => {
  const baseUrlsForSources = useAppSelector(getBaseUrlsForSources);
  const dispatch = useAppDispatch();

  function fileLoadedListener(
    _: IpcRendererEvent,
    parsedFileContent: ParsedFileContent,
  ): void {
    dispatch(loadFromFile(parsedFileContent));
    dispatch(openStatisticsPopupAfterFileLoadIfEnabled);
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

  function setBaseURLForRootListener(
    _: IpcRendererEvent,
    baseURLForRootArgs: BaseURLForRootArgs,
  ): void {
    if (baseURLForRootArgs?.baseURLForRoot) {
      dispatch(
        setBaseUrlsForSources({
          ...baseUrlsForSources,
          [ROOT_PATH]: baseURLForRootArgs.baseURLForRoot,
        }),
      );
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
  useIpcRenderer(
    AllowedFrontendChannels.SetBaseURLForRoot,
    setBaseURLForRootListener,
    [dispatch, baseUrlsForSources],
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

  return null;
};
