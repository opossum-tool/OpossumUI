// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ACTION_SET_FILE_SEARCH, SetFileSearch } from './types';

export function setFileSearch(search: string): SetFileSearch {
  return {
    type: ACTION_SET_FILE_SEARCH,
    payload: search,
  };
}
