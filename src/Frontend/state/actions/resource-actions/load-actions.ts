// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { type ParsedFrontendFileContent } from '../../../../shared/shared-types';
import { type AppThunkAction } from '../../types';
import { setProjectMetadata } from './all-views-simple-actions';

export function loadFromFile(
  parsedFileContent: ParsedFrontendFileContent,
): AppThunkAction {
  return (dispatch) => {
    dispatch(setProjectMetadata(parsedFileContent.metadata));
  };
}
