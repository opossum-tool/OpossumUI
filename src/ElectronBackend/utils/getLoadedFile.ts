// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { LoadedFileFormat } from '../enums/enums';
import { GlobalBackendState } from '../types/types';

export function getLoadedFilePath(
  globalBackendState: GlobalBackendState,
): string | null {
  if (globalBackendState.resourceFilePath) {
    return globalBackendState.resourceFilePath;
  } else if (globalBackendState.opossumFilePath) {
    return globalBackendState.opossumFilePath;
  }
  return null;
}

export function isFileLoaded(globalBackendState: GlobalBackendState): boolean {
  return (
    globalBackendState.resourceFilePath !== undefined ||
    globalBackendState.opossumFilePath !== undefined
  );
}

export function getLoadedFileType(
  globalBackendState: GlobalBackendState,
): LoadedFileFormat {
  if (globalBackendState.resourceFilePath) {
    return LoadedFileFormat.Json;
  } else if (globalBackendState.opossumFilePath) {
    return LoadedFileFormat.Opossum;
  } else throw Error('Tried to get file type when no file is loaded');
}
