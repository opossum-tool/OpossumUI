// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { IpcRendererEvent } from 'electron';
import { ReactElement } from 'react';
import pick from 'lodash/pick';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { IpcChannel } from '../../../shared/ipc-channels';
import {
  Attributions,
  BaseURLForRootArgs,
  ExportSpdxDocumentJsonArgs,
  ExportSpdxDocumentYamlArgs,
  ExportType,
  ParsedFileContent,
  ToggleHighlightForCriticalSignalsArgs,
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
import { getHighlightForCriticalSignals } from '../../state/selectors/view-selector';
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
  setHighlightForCriticalSignals,
} from '../../state/actions/view-actions/view-actions';

export function BackendCommunication(): ReactElement | null {
  const resources = useAppSelector(getResources);
  const manualData = useAppSelector(getManualData);
  const attributionBreakpoints = useAppSelector(getAttributionBreakpoints);
  const filesWithChildren = useAppSelector(getFilesWithChildren);
  const frequentLicenseTexts = useAppSelector(getFrequentLicensesTexts);
  const baseUrlsForSources = useAppSelector(getBaseUrlsForSources);
  const showHighlightForCriticalSignals = useAppSelector(
    getHighlightForCriticalSignals
  );
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

    window.ipcRenderer.invoke(IpcChannel.ExportFile, {
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

    window.ipcRenderer.invoke(IpcChannel.ExportFile, args);
  }

  function getDetailedBomExportListener(): void {
    const bomAttributions = getBomAttributions(manualData.attributions);

    const bomAttributionsWithResources = getAttributionsWithResources(
      bomAttributions,
      manualData.attributionsToResources
    );

    const bomAttributionsWithFormattedResources =
      removeSlashesFromFilesWithChildren(
        bomAttributionsWithResources,
        getFileWithChildrenCheck(filesWithChildren)
      );

    window.ipcRenderer.invoke(IpcChannel.ExportFile, {
      type: ExportType.DetailedBom,
      bomAttributionsWithResources: bomAttributionsWithFormattedResources,
    });
  }

  function getCompactBomExportListener(): void {
    window.ipcRenderer.invoke(IpcChannel.ExportFile, {
      type: ExportType.CompactBom,
      bomAttributions: getBomAttributions(manualData.attributions),
    });
  }

  function getBomAttributions(attributions: Attributions): Attributions {
    return pick(
      attributions,
      Object.keys(attributions).filter(
        (attributionId) =>
          !attributions[attributionId].followUp &&
          !attributions[attributionId].firstParty &&
          !attributions[attributionId].excludeFromNotice
      )
    );
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

  function setToggleHighlightForCriticalSignalsListener(
    event: IpcRendererEvent,
    toggleHighlightForCriticalSignalsArgs: ToggleHighlightForCriticalSignalsArgs
  ): void {
    if (
      toggleHighlightForCriticalSignalsArgs?.toggleHighlightForCriticalSignals
    ) {
      dispatch(
        setHighlightForCriticalSignals(!showHighlightForCriticalSignals)
      );
    }
  }

  useIpcRenderer(IpcChannel.FileLoaded, fileLoadedListener, [dispatch]);
  useIpcRenderer(IpcChannel.ResetLoadedFile, resetLoadedFileListener, [
    dispatch,
  ]);
  useIpcRenderer(IpcChannel.Logging, loggingListener, [dispatch]);
  useIpcRenderer(IpcChannel.ShowSearchPopup, showSearchPopupListener, [
    dispatch,
  ]);
  useIpcRenderer(
    IpcChannel.ShowProjectMetadataPopup,
    showProjectMetadataPopupListener,
    [dispatch]
  );
  useIpcRenderer(IpcChannel.SetBaseURLForRoot, setBaseURLForRootListener, [
    dispatch,
    baseUrlsForSources,
  ]);
  useIpcRenderer(IpcChannel.ExportFileRequest, getExportFileRequestListener, [
    manualData,
    attributionBreakpoints,
    frequentLicenseTexts,
    filesWithChildren,
  ]);
  useIpcRenderer(
    IpcChannel.ToggleHighlightForCriticalSignals,
    setToggleHighlightForCriticalSignalsListener,
    [dispatch, showHighlightForCriticalSignals]
  );

  return null;
}
