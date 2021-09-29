// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { makeStyles } from '@material-ui/core/styles';
import MuiToggleButton from '@material-ui/lab/ToggleButton';
import MuiToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import { IpcRendererEvent } from 'electron';
import pick from 'lodash/pick';
import React, { ReactElement } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IpcChannel } from '../../../shared/ipc-channels';
import {
  AttributionData,
  Attributions,
  ExportSpdxDocumentJsonArgs,
  ExportSpdxDocumentYamlArgs,
  ExportType,
  ParsedFileContent,
} from '../../../shared/shared-types';
import { PopupType, View } from '../../enums/enums';
import { setViewOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { resetResourceState } from '../../state/actions/resource-actions/all-views-simple-actions';
import { loadFromFile } from '../../state/actions/resource-actions/load-actions';
import {
  getAttributionBreakpoints,
  getFilesWithChildren,
  getFrequentLicensesTexts,
  getManualData,
  getResources,
} from '../../state/selectors/all-views-resource-selectors';
import { getSelectedView } from '../../state/selectors/view-selector';
import {
  getAttributionsWithAllChildResourcesWithoutFolders,
  removeSlashesFromFilesWithChildren,
} from '../../util/get-attributions-with-resources';
import { useIpcRenderer } from '../../util/use-ipc-renderer';
import { CommitInfoDisplay } from '../CommitInfoDisplay/CommitInfoDisplay';
import { OpenFileIcon } from '../Icons/Icons';
import { ProgressBar } from '../ProgressBar/ProgressBar';
import { OpossumColors } from '../../shared-styles';

import { getAttributionBreakpointCheck } from '../../util/is-attribution-breakpoint';
import { getFileWithChildrenCheck } from '../../util/is-file-with-children';
import { openPopup } from '../../state/actions/view-actions/view-actions';

const useStyles = makeStyles({
  root: {
    height: 36,
    background: OpossumColors.darkBlue,
    display: 'flex',
  },
  openFileIcon: {
    margin: 8,
    width: 18,
    height: 18,
    padding: 2,
    color: OpossumColors.white,
    '&:hover': {
      background: OpossumColors.middleBlue,
    },
  },
  viewButtons: {
    background: OpossumColors.lightestBlue,
    color: OpossumColors.black,
    border: `2px ${OpossumColors.darkBlue} solid`,
    '&:hover': {
      background: OpossumColors.lightestBlueOnHover,
    },
    '&.Mui-selected': {
      background: OpossumColors.middleBlue,
      color: OpossumColors.black,
    },
  },
  versionInfo: {
    margin: '8px 12px 8px 12px',
    color: OpossumColors.white,
    background: OpossumColors.darkBlue,
    float: 'right',
  },
});

export function TopBar(): ReactElement {
  const classes = useStyles();

  const resources = useSelector(getResources);
  const manualData = useSelector(getManualData);
  const selectedView = useSelector(getSelectedView);
  const attributionBreakpoints = useSelector(getAttributionBreakpoints);
  const filesWithChildren = useSelector(getFilesWithChildren);
  const frequentLicenseTexts = useSelector(getFrequentLicensesTexts);
  const dispatch = useDispatch();

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
    window.ipcRenderer.invoke(IpcChannel.ExportFile, {
      type: ExportType.DetailedBom,
      bomAttributions: getBomAttributions(manualData),
    });
  }

  function getCompactBomExportListener(): void {
    window.ipcRenderer.invoke(IpcChannel.ExportFile, {
      type: ExportType.CompactBom,
      bomAttributions: getBomAttributions(manualData),
    });
  }

  function getBomAttributions(manualData: AttributionData): Attributions {
    return pick(
      manualData.attributions,
      Object.keys(manualData.attributions).filter(
        (attributionId) =>
          !manualData.attributions[attributionId].followUp &&
          !manualData.attributions[attributionId].firstParty
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
  useIpcRenderer(IpcChannel.ExportFileRequest, getExportFileRequestListener, [
    manualData,
    attributionBreakpoints,
    frequentLicenseTexts,
    filesWithChildren,
  ]);

  function getOpenFile() {
    return (): void => {
      window.ipcRenderer.invoke(IpcChannel.OpenFile);
    };
  }

  function handleClick(
    event: React.MouseEvent<HTMLElement>,
    selectedView: View
  ): void {
    dispatch(setViewOrOpenUnsavedPopup(selectedView));
  }

  return (
    <div className={classes.root}>
      <OpenFileIcon
        label={'open file'}
        onClick={getOpenFile()}
        className={classes.openFileIcon}
      />
      <ProgressBar />
      <MuiToggleButtonGroup
        size="small"
        value={selectedView}
        exclusive
        onChange={handleClick}
      >
        <MuiToggleButton
          value={View.Audit}
          className={classes.viewButtons}
          disabled={selectedView === View.Audit}
        >
          {'Audit'}
        </MuiToggleButton>
        <MuiToggleButton
          value={View.Attribution}
          className={classes.viewButtons}
          disabled={selectedView === View.Attribution}
        >
          {'Attribution'}
        </MuiToggleButton>
        <MuiToggleButton
          value={View.Report}
          className={classes.viewButtons}
          disabled={selectedView === View.Report}
        >
          {'Report'}
        </MuiToggleButton>
      </MuiToggleButtonGroup>
      <div className={classes.versionInfo}>
        <CommitInfoDisplay />
      </div>
    </div>
  );
}
