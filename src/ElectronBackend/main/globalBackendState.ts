// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { GlobalBackendState } from '../types/types';

let globalBackendState: GlobalBackendState = {};

export function getGlobalBackendState(): GlobalBackendState {
  return globalBackendState;
}

export function setGlobalBackendState(
  newGlobalBackendState: GlobalBackendState,
): void {
  globalBackendState = newGlobalBackendState;
}
