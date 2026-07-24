// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { GlobalBackendState } from '../types/types';

export function getLoadedFilePath(
  globalBackendState: GlobalBackendState,
): string | null {
  return globalBackendState.opossumFilePath ?? null;
}

export function isFileLoaded(globalBackendState: GlobalBackendState): boolean {
  return globalBackendState.opossumFilePath !== undefined;
}
