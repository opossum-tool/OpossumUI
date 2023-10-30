// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { State } from '../../types/types';

export function getFileSearch(state: State): string {
  return state.resourceState.fileSearchPopup.fileSearch;
}
