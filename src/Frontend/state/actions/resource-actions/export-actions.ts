// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import pick from 'lodash/pick';

import {
  ExportSpdxDocumentJsonArgs,
  ExportSpdxDocumentYamlArgs,
  ExportType,
} from '../../../../shared/shared-types';
import { State } from '../../../types/types';
import {
  attributionUtils,
  getAttributionsWithAllChildResourcesWithoutFolders,
  getBomAttributions,
  removeSlashesFromFilesWithChildren,
} from '../../../util/attribution-utils';
import {
  getAttributionBreakpoints,
  getFilesWithChildren,
  getFrequentLicensesTexts,
  getManualData,
  getResources,
} from '../../selectors/resource-selectors';
import { AppThunkAction } from '../../types';

export function exportFile(exportType: ExportType): AppThunkAction {
  return (_, getState) => {
    switch (exportType) {
      case ExportType.SpdxDocumentJson:
      case ExportType.SpdxDocumentYaml:
        return getSpdxDocumentExportListener(getState(), exportType);
      case ExportType.FollowUp:
        return getFollowUpExportListener(getState());
      case ExportType.CompactBom:
        return getCompactBomExportListener(getState());
      case ExportType.DetailedBom:
        return getDetailedBomExportListener(getState());
    }
  };
}

function getFollowUpExportListener(state: State): void {
  const followUpAttributions = pick(
    getManualData(state).attributions,
    Object.keys(getManualData(state).attributions).filter(
      (attributionId) =>
        getManualData(state).attributions[attributionId].followUp,
    ),
  );

  const followUpAttributionsWithResources =
    getAttributionsWithAllChildResourcesWithoutFolders(
      followUpAttributions,
      getManualData(state).attributionsToResources,
      getManualData(state).resourcesToAttributions,
      getResources(state) || {},
      getAttributionBreakpoints(state),
      getFilesWithChildren(state),
    );
  const followUpAttributionsWithFormattedResources =
    removeSlashesFromFilesWithChildren(
      followUpAttributionsWithResources,
      getFilesWithChildren(state),
    );

  window.electronAPI.exportFile({
    type: ExportType.FollowUp,
    followUpAttributionsWithResources:
      followUpAttributionsWithFormattedResources,
  });
}

function getSpdxDocumentExportListener(
  state: State,
  exportType: ExportType.SpdxDocumentYaml | ExportType.SpdxDocumentJson,
): void {
  const attributions = Object.fromEntries(
    Object.entries(getManualData(state).attributions).map((entry) => {
      const packageInfo = entry[1];

      const licenseName = packageInfo.licenseName || '';
      const isFrequentLicense =
        licenseName && licenseName in getFrequentLicensesTexts(state);
      const licenseText =
        packageInfo.licenseText || isFrequentLicense
          ? getFrequentLicensesTexts(state)[licenseName]
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

function getDetailedBomExportListener(state: State): void {
  const bomAttributions = getBomAttributions(
    getManualData(state).attributions,
    ExportType.DetailedBom,
  );

  const bomAttributionsWithResources = attributionUtils(
    bomAttributions,
    getManualData(state).attributionsToResources,
  );

  const bomAttributionsWithFormattedResources =
    removeSlashesFromFilesWithChildren(
      bomAttributionsWithResources,
      getFilesWithChildren(state),
    );

  window.electronAPI.exportFile({
    type: ExportType.DetailedBom,
    bomAttributionsWithResources: bomAttributionsWithFormattedResources,
  });
}

function getCompactBomExportListener(state: State): void {
  window.electronAPI.exportFile({
    type: ExportType.CompactBom,
    bomAttributions: getBomAttributions(
      getManualData(state).attributions,
      ExportType.CompactBom,
    ),
  });
}
