// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { SelectedCriticality } from '../../../shared/shared-types';
import { State } from '../../types/types';

export function getLocatePopupSelectedCriticality(
  state: State,
): SelectedCriticality {
  return state.resourceState.locatePopup.selectedCriticality;
}

export function getLocatePopupSelectedLicenses(state: State): Set<string> {
  return state.resourceState.locatePopup.selectedLicenses;
}
