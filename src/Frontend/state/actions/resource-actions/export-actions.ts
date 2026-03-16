// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ExportType } from '../../../../shared/shared-types';
import { backend } from '../../../util/backendClient';
import { type AppThunkAction } from '../../types';

export function exportFile(exportType: ExportType): AppThunkAction {
  return async () => {
    switch (exportType) {
      case ExportType.SpdxDocumentJson:
      case ExportType.SpdxDocumentYaml:
        await backend.exportSpdxDocument.query({ type: exportType });
        return;
      case ExportType.FollowUp:
        await backend.exportFollowUp.query();
        return;
      case ExportType.CompactBom:
        await backend.exportCompactBom.query();
        return;
      case ExportType.DetailedBom:
        await backend.exportDetailedBom.query();
    }
  };
}
