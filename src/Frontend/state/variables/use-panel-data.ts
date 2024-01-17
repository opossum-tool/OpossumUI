// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { PanelData } from '../../types/types';
import { useVariable } from './use-variable';

export const PANEL_DATA = 'panel-data';

interface WorkerPanelData {
  attributionsInFolderContent: PanelData;
  signalsInFolderContent: PanelData;
}

const initialWorkerPanelData: WorkerPanelData = {
  attributionsInFolderContent: {
    sortedPackageCardIds: [],
    displayPackageInfos: {},
  },
  signalsInFolderContent: {
    sortedPackageCardIds: [],
    displayPackageInfos: {},
  },
};

export function usePanelData() {
  return useVariable<WorkerPanelData>(PANEL_DATA, initialWorkerPanelData);
}
