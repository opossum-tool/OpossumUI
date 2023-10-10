// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { IpcRendererEvent } from 'electron';
import { ReactElement } from 'react';
import pick from 'lodash/pick';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import {
  Attributions,
  BaseURLForRootArgs,
  ExportSpdxDocumentJsonArgs,
  ExportSpdxDocumentYamlArgs,
  ExportType,
  FileSupportPopupArgs,
  IsLoadingArgs,
  ParsedFileContent,
  QAModeArgs,
} from '../../../shared/shared-types';
import { PopupType } from '../../enums/enums';
import {
  resetResourceState,
  setBaseUrlsForSources,
} from '../../state/actions/resource-actions/all-views-simple-actions';
import { loadFromFile } from '../../state/actions/resource-actions/load-actions';
import {
  getAttributionBreakpoints,
  getBaseUrlsForSources,
  getFilesWithChildren,
  getFrequentLicensesTexts,
  getManualData,
  getResources,
} from '../../state/selectors/all-views-resource-selectors';
import {
  getAttributionsWithAllChildResourcesWithoutFolders,
  getAttributionsWithResources,
  removeSlashesFromFilesWithChildren,
} from '../../util/get-attributions-with-resources';
import { useIpcRenderer } from '../../util/use-ipc-renderer';
import { getAttributionBreakpointCheck } from '../../util/is-attribution-breakpoint';
import { getFileWithChildrenCheck } from '../../util/is-file-with-children';
import {
  openPopup,
  setIsLoading,
  setQAMode,
} from '../../state/actions/view-actions/view-actions';

export function BackendCommunication(): ReactElement | null {
  const resources = useAppSelector(getResources);
  const manualData = useAppSelector(getManualData);
  const attributionBreakpoints = useAppSelector(getAttributionBreakpoints);
  const filesWithChildren = useAppSelector(getFilesWithChildren);
  const frequentLicenseTexts = useAppSelector(getFrequentLicensesTexts);
  const baseUrlsForSources = useAppSelector(getBaseUrlsForSources);
  const dispatch = useAppDispatch();

  function fileLoadedListener(
    _: IpcRendererEvent,
    parsedFileContent: ParsedFileContent,
  ): void {
    dispatch(loadFromFile(parsedFileContent));
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
        getAttributionBreakpointCheck(attributionBreakpoints),
        getFileWithChildrenCheck(filesWithChildren),
      );
    const followUpAttributionsWithFormattedResources =
      removeSlashesFromFilesWithChildren(
        followUpAttributionsWithResources,
        getFileWithChildrenCheck(filesWithChildren),
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
        getFileWithChildrenCheck(filesWithChildren),
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

  function loggingListener(_: IpcRendererEvent, logging: string): void {
    if (logging) {
      console.log(logging);
    }
  }

  function showSearchPopupListener(
    _: IpcRendererEvent,
    showSearchPopUp: boolean,
  ): void {
    if (showSearchPopUp) {
      dispatch(openPopup(PopupType.FileSearchPopup));
    }
  }

  function showLocatorPopupListener(
    _: IpcRendererEvent,
    showLocatePopUp: boolean,
  ): void {
    if (showLocatePopUp) {
      dispatch(openPopup(PopupType.LocatorPopup));
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

  function showChangedInputFilePopupListener(
    _: IpcRendererEvent,
    showChangedInputFilePopup: boolean,
  ): void {
    if (showChangedInputFilePopup) {
      dispatch(openPopup(PopupType.ChangedInputFilePopup));
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
          '/': baseURLForRootArgs.baseURLForRoot,
        }),
      );
    }
  }

  function setFileLoadingListener(
    _: IpcRendererEvent,
    isLoadingArgs: IsLoadingArgs,
  ): void {
    if (isLoadingArgs) {
      dispatch(setIsLoading(isLoadingArgs.isLoading));
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

  function setQAModeListener(
    _: IpcRendererEvent,
    qaModeArgs: QAModeArgs,
  ): void {
    if (qaModeArgs) {
      dispatch(setQAMode(qaModeArgs.qaMode));
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
  useIpcRenderer(AllowedFrontendChannels.Logging, loggingListener, [dispatch]);
  useIpcRenderer(
    AllowedFrontendChannels.ShowSearchPopup,
    showSearchPopupListener,
    [dispatch],
  );
  useIpcRenderer(
    AllowedFrontendChannels.ShowLocatorPopup,
    showLocatorPopupListener,
    [dispatch],
  );
  useIpcRenderer(
    AllowedFrontendChannels.ShowProjectMetadataPopup,
    showProjectMetadataPopupListener,
    [dispatch],
  );
  useIpcRenderer(
    AllowedFrontendChannels.ShowChangedInputFilePopup,
    showChangedInputFilePopupListener,
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
  useIpcRenderer(AllowedFrontendChannels.FileLoading, setFileLoadingListener, [
    dispatch,
  ]);
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
  useIpcRenderer(AllowedFrontendChannels.SetQAMode, setQAModeListener, [
    dispatch,
  ]);

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
          exportType == ExportType.CompactBom &&
          attributions[attributionId].excludeFromNotice
        ),
    ),
  );
}
