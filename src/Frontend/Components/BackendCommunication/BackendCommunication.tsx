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
  IsLoadingArgs,
  ParsedFileContent,
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
    event: IpcRendererEvent,
    parsedFileContent: ParsedFileContent
  ): void {
    dispatch(loadFromFile(parsedFileContent));
  }

  function getExportFileRequestListener(
    event: IpcRendererEvent,
    exportType: ExportType
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
        (attributionId) => manualData.attributions[attributionId].followUp
      )
    );

    const followUpAttributionsWithResources =
      getAttributionsWithAllChildResourcesWithoutFolders(
        followUpAttributions,
        manualData.attributionsToResources,
        manualData.resourcesToAttributions,
        resources || {},
        getAttributionBreakpointCheck(attributionBreakpoints),
        getFileWithChildrenCheck(filesWithChildren)
      );
    const followUpAttributionsWithFormattedResources =
      removeSlashesFromFilesWithChildren(
        followUpAttributionsWithResources,
        getFileWithChildrenCheck(filesWithChildren)
      );

    window.electronAPI.exportFile({
      type: ExportType.FollowUp,
      followUpAttributionsWithResources:
        followUpAttributionsWithFormattedResources,
    });
  }

  function getSpdxDocumentExportListener(
    exportType: ExportType.SpdxDocumentYaml | ExportType.SpdxDocumentJson
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
      })
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
      ExportType.DetailedBom
    );

    const bomAttributionsWithResources = getAttributionsWithResources(
      bomAttributions,
      manualData.attributionsToResources
    );

    const bomAttributionsWithFormattedResources =
      removeSlashesFromFilesWithChildren(
        bomAttributionsWithResources,
        getFileWithChildrenCheck(filesWithChildren)
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
        ExportType.CompactBom
      ),
    });
  }

  function resetLoadedFileListener(
    event: IpcRendererEvent,
    resetState: boolean
  ): void {
    if (resetState) {
      dispatch(resetResourceState());
    }
  }

  function loggingListener(event: IpcRendererEvent, logging: string): void {
    if (logging) {
      console.log(logging);
    }
  }

  function showSearchPopupListener(
    event: IpcRendererEvent,
    showSearchPopUp: boolean
  ): void {
    if (showSearchPopUp) {
      dispatch(openPopup(PopupType.FileSearchPopup));
    }
  }

  function showProjectMetadataPopupListener(
    event: IpcRendererEvent,
    showProjectMetadataPopup: boolean
  ): void {
    if (showProjectMetadataPopup) {
      dispatch(openPopup(PopupType.ProjectMetadataPopup));
    }
  }

  function showProjectStatisticsPopupListener(
    event: IpcRendererEvent,
    showProjectStatisticsPopup: boolean
  ): void {
    if (showProjectStatisticsPopup) {
      dispatch(openPopup(PopupType.ProjectStatisticsPopup));
    }
  }

  function showChangedInputFilePopupListener(
    event: IpcRendererEvent,
    showChangedInputFilePopup: boolean
  ): void {
    if (showChangedInputFilePopup) {
      dispatch(openPopup(PopupType.ChangedInputFilePopup));
    }
  }

  function setBaseURLForRootListener(
    event: IpcRendererEvent,
    baseURLForRootArgs: BaseURLForRootArgs
  ): void {
    if (baseURLForRootArgs?.baseURLForRoot) {
      dispatch(
        setBaseUrlsForSources({
          ...baseUrlsForSources,
          '/': baseURLForRootArgs.baseURLForRoot,
        })
      );
    }
  }

  function setFileLoadingListener(
    event: IpcRendererEvent,
    isLoadingArgs: IsLoadingArgs
  ): void {
    if (isLoadingArgs) {
      dispatch(setIsLoading(isLoadingArgs.isLoading));
    }
  }

  useIpcRenderer(AllowedFrontendChannels.FileLoaded, fileLoadedListener, [
    dispatch,
  ]);
  useIpcRenderer(
    AllowedFrontendChannels.ResetLoadedFile,
    resetLoadedFileListener,
    [dispatch]
  );
  useIpcRenderer(AllowedFrontendChannels.Logging, loggingListener, [dispatch]);
  useIpcRenderer(
    AllowedFrontendChannels.ShowSearchPopup,
    showSearchPopupListener,
    [dispatch]
  );
  useIpcRenderer(
    AllowedFrontendChannels.ShowProjectMetadataPopup,
    showProjectMetadataPopupListener,
    [dispatch]
  );
  useIpcRenderer(
    AllowedFrontendChannels.ShowChangedInputFilePopup,
    showChangedInputFilePopupListener,
    [dispatch]
  );
  useIpcRenderer(
    AllowedFrontendChannels.ShowProjectStatisticsPopup,
    showProjectStatisticsPopupListener,
    [dispatch]
  );
  useIpcRenderer(
    AllowedFrontendChannels.SetBaseURLForRoot,
    setBaseURLForRootListener,
    [dispatch, baseUrlsForSources]
  );
  useIpcRenderer(
    AllowedFrontendChannels.ExportFileRequest,
    getExportFileRequestListener,
    [
      manualData,
      attributionBreakpoints,
      frequentLicenseTexts,
      filesWithChildren,
    ]
  );
  useIpcRenderer(AllowedFrontendChannels.FileLoading, setFileLoadingListener, [
    dispatch,
  ]);

  return null;
}

export function getBomAttributions(
  attributions: Attributions,
  exportType: ExportType
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
        )
    )
  );
}
