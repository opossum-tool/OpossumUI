// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { type ExportType } from '../../../../shared/shared-types';
import { type AppThunkAction } from '../../types';

export function exportFile(exportType: ExportType): AppThunkAction {
  return async () => {
    await window.electronAPI.exportFile(exportType);
  };
}
