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
  getAttributionsWithAllChildResourcesWithoutFolders,
  getAttributionsWithResources,
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
import { setLoading, writeInfoLogMessage } from '../view-actions/view-actions';

export function exportFile(exportType: ExportType): AppThunkAction {
  return (dispatch, getState) => {
    dispatch(setLoading(true));

    switch (exportType) {
      case ExportType.SpdxDocumentJson:
        dispatch(writeInfoLogMessage('Preparing data for SPDX (json) export'));
        exportSpdxDocument(getState(), ExportType.SpdxDocumentJson);
        break;

      case ExportType.SpdxDocumentYaml:
        dispatch(writeInfoLogMessage('Preparing data for SPDX (yaml) export'));
        exportSpdxDocument(getState(), ExportType.SpdxDocumentYaml);
        break;

      case ExportType.FollowUp:
        dispatch(writeInfoLogMessage('Preparing data for follow-up export'));
        exportFollowUp(getState());
        break;

      case ExportType.CompactBom:
        dispatch(
          writeInfoLogMessage(
            'Preparing data for compact component list export',
          ),
        );
        exportCompactBom(getState());
        break;

      case ExportType.DetailedBom:
        dispatch(
          writeInfoLogMessage(
            'Preparing data for detailed component list export',
          ),
        );
        exportDetailedBom(getState());
        break;
    }
  };
}

function exportFollowUp(state: State): void {
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

function exportSpdxDocument(
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

function exportDetailedBom(state: State): void {
  const bomAttributions = getBomAttributions(
    getManualData(state).attributions,
    ExportType.DetailedBom,
  );

  const bomAttributionsWithResources = getAttributionsWithResources(
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

function exportCompactBom(state: State): void {
  window.electronAPI.exportFile({
    type: ExportType.CompactBom,
    bomAttributions: getBomAttributions(
      getManualData(state).attributions,
      ExportType.CompactBom,
    ),
  });
}
