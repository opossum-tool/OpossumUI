// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { LocatePopupFilters, State } from '../../types/types';
import { initialResourceState } from '../reducers/resource-reducer';

export function getLocatePopupFilters(state: State): LocatePopupFilters {
  return state.resourceState.locatePopup;
}

export function isLocateSignalActive(state: State): boolean {
  const locatePopupFilters = getLocatePopupFilters(state);

  return (
    locatePopupFilters.selectedCriticality !==
    initialResourceState.locatePopup.selectedCriticality ||
    locatePopupFilters.selectedLicenses.size > 0 ||
    locatePopupFilters.searchTerm !== ''
  );
}

export function getShowNoSignalsLocatedMessage(state: State): boolean {
  return state.viewState.showNoSignalsLocatedMessage;
}
