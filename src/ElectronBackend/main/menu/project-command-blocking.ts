// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { getGlobalBackendState } from '../globalBackendState';

export function isProjectCommandBlocked(): boolean {
  const state = getGlobalBackendState();
  return Boolean(state.frontendPopupOpen || state.frontendActivityActive);
}
