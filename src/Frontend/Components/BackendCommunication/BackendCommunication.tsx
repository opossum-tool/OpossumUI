// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import dayjs from 'dayjs';
import { IpcRendererEvent } from 'electron';
import pick from 'lodash/pick';
import { ReactElement } from 'react';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import {
  Attributions,
  BaseURLForRootArgs,
  ExportSpdxDocumentJsonArgs,
  ExportSpdxDocumentYamlArgs,
  ExportType,
  FileSupportPopupArgs,
  ParsedFileContent,
} from '../../../shared/shared-types';
import { PopupType } from '../../enums/enums';
import { ROOT_PATH } from '../../shared-constants';
import {
  resetResourceState,
  setBaseUrlsForSources,
} from '../../state/actions/resource-actions/all-views-simple-actions';
import { loadFromFile } from '../../state/actions/resource-actions/load-actions';
import { openPopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getAttributionBreakpoints,
  getBaseUrlsForSources,
  getFilesWithChildren,
  getFrequentLicensesTexts,
  getManualData,
  getResources,
} from '../../state/selectors/resource-selectors';
import {
  getAttributionsWithAllChildResourcesWithoutFolders,
  getAttributionsWithResources,
  removeSlashesFromFilesWithChildren,
} from '../../util/get-attributions-with-resources';
import { LoggingListener, useIpcRenderer } from '../../util/use-ipc-renderer';

export function BackendCommunication(): ReactElement | null {
  const resources = useAppSelector(getResources);
  const manualData = useAppSelector(getManualData);
  const attributionBreakpoints = useAppSelector(getAttributionBreakpoints);
  const filesWithChildren = useAppSelector(getFilesWithChildren);
  const frequentLicenseTexts = useAppSelector(getFrequentLicensesTexts);
  const baseUrlsForSources = useAppSelector(getBaseUrlsForSources);
  const dispatch = useAppDispatch();

  async function fileLoadedListener(
    _: IpcRendererEvent,
    parsedFileContent: ParsedFileContent,
  ): Promise<void> {
    dispatch(loadFromFile(parsedFileContent));
    (await window.electronAPI.getUserSetting('showProjectStatistics')) &&
      dispatch(openPopup(PopupType.ProjectStatisticsPopup));
  }

  function getExportFileRequestListener(
    _: IpcRendererEvent,
    exportType: ExportType,
  ): void {
    switch (exportType) {
      case ExportType.SpdxDocumentJson:
      case ExportType.SpdxDocumentYaml:
        return getSpdxDocumentExportListener(exportType);
      case ExportType.FollowUp:
        return getFollowUpExportListener();
      case ExportType.CompactBom:
        return getCompactBomExportListener();
      case ExportType.DetailedBom:
        return getDetailedBomExportListener();
    }
  }

  function getFollowUpExportListener(): void {
    const followUpAttributions = pick(
      manualData.attributions,
      Object.keys(manualData.attributions).filter(
        (attributionId) => manualData.attributions[attributionId].followUp,
      ),
    );

    const followUpAttributionsWithResources =
      getAttributionsWithAllChildResourcesWithoutFolders(
        followUpAttributions,
        manualData.attributionsToResources,
        manualData.resourcesToAttributions,
        resources || {},
        attributionBreakpoints,
        filesWithChildren,
      );
    const followUpAttributionsWithFormattedResources =
      removeSlashesFromFilesWithChildren(
        followUpAttributionsWithResources,
        filesWithChildren,
      );

    window.electronAPI.exportFile({
      type: ExportType.FollowUp,
      followUpAttributionsWithResources:
        followUpAttributionsWithFormattedResources,
    });
  }

  function getSpdxDocumentExportListener(
    exportType: ExportType.SpdxDocumentYaml | ExportType.SpdxDocumentJson,
  ): void {
    const attributions = Object.fromEntries(
      Object.entries(manualData.attributions).map((entry) => {
        const packageInfo = entry[1];

        const licenseName = packageInfo.licenseName || '';
        const isFrequentLicense =
          licenseName && licenseName in frequentLicenseTexts;
        const licenseText =
          packageInfo.licenseText || isFrequentLicense
            ? frequentLicenseTexts[licenseName]
            : '';
        return [
          entry[0],
          {
            ...entry[1],
            licenseText,
          },
        ];
      }),
    );

    const args: ExportSpdxDocumentYamlArgs | ExportSpdxDocumentJsonArgs = {
      type: exportType,
      spdxAttributions: attributions,
    };

    window.electronAPI.exportFile(args);
  }

  function getDetailedBomExportListener(): void {
    const bomAttributions = getBomAttributions(
      manualData.attributions,
      ExportType.DetailedBom,
    );

    const bomAttributionsWithResources = getAttributionsWithResources(
      bomAttributions,
      manualData.attributionsToResources,
    );

    const bomAttributionsWithFormattedResources =
      removeSlashesFromFilesWithChildren(
        bomAttributionsWithResources,
        filesWithChildren,
      );

    window.electronAPI.exportFile({
      type: ExportType.DetailedBom,
      bomAttributionsWithResources: bomAttributionsWithFormattedResources,
    });
  }

  function getCompactBomExportListener(): void {
    window.electronAPI.exportFile({
      type: ExportType.CompactBom,
      bomAttributions: getBomAttributions(
        manualData.attributions,
        ExportType.CompactBom,
      ),
    });
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

  function showFileSupportPopupListener(
    _: IpcRendererEvent,
    fileSupportPopupArgs: FileSupportPopupArgs,
  ): void {
    if (fileSupportPopupArgs && fileSupportPopupArgs.showFileSupportPopup) {
      if (fileSupportPopupArgs.dotOpossumFileAlreadyExists) {
        dispatch(openPopup(PopupType.FileSupportDotOpossumAlreadyExistsPopup));
      } else {
        dispatch(openPopup(PopupType.FileSupportPopup));
      }
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
    (_, { date, level, message }) =>
      console[level](`${dayjs(date).format('HH:mm:ss.SSS')} ${message}`),
    [dispatch],
  );
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
  useIpcRenderer(
    AllowedFrontendChannels.ExportFileRequest,
    getExportFileRequestListener,
    [
      manualData,
      attributionBreakpoints,
      frequentLicenseTexts,
      filesWithChildren,
    ],
  );
  useIpcRenderer(
    AllowedFrontendChannels.ShowFileSupportPopup,
    showFileSupportPopupListener,
    [dispatch],
  );
  useIpcRenderer(
    AllowedFrontendChannels.ShowUpdateAppPopup,
    showUpdateAppPopupListener,
    [dispatch],
  );

  return null;
}

export function getBomAttributions(
  attributions: Attributions,
  exportType: ExportType,
): Attributions {
  return pick(
    attributions,
    Object.keys(attributions).filter(
      (attributionId) =>
        !attributions[attributionId].followUp &&
        !attributions[attributionId].firstParty &&
        !(
          exportType === ExportType.CompactBom &&
          attributions[attributionId].excludeFromNotice
        ),
    ),
  );
}
