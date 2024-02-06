// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Attributions } from '../../../shared/shared-types';
import { useVariable } from './use-variable';

export const ATTRIBUTIONS_IN_FOLDER_CONTENT = 'attributions-in-folder-content';
export const SIGNALS_IN_FOLDER_CONTENT = 'signals-in-folder-content';

export function useAttributionsInFolderContent() {
  return useVariable<Attributions>(ATTRIBUTIONS_IN_FOLDER_CONTENT, {});
}

export function useSignalsInFolderContent() {
  return useVariable<Attributions>(SIGNALS_IN_FOLDER_CONTENT, {});
}
