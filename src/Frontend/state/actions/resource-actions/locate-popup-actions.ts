// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { SelectedCriticality } from '../../../../shared/shared-types';
import {
  SetLocatePopupSelectedCriticality,
  ACTION_SET_LOCATE_POPUP_SELECTED_CRITICALITY,
  SetLocatePopupSelectedLicenses,
  ACTION_SET_LOCATE_POPUP_SELECTED_LICENSES,
} from './types';

export function setLocatePopupSelectedCriticality(
  selectedCriticality: SelectedCriticality,
): SetLocatePopupSelectedCriticality {
  return {
    type: ACTION_SET_LOCATE_POPUP_SELECTED_CRITICALITY,
    payload: selectedCriticality,
  };
}

export function setLocatePopupSelectedLicenses(
  selectedLicenses: Set<string>,
): SetLocatePopupSelectedLicenses {
  return {
    type: ACTION_SET_LOCATE_POPUP_SELECTED_LICENSES,
    payload: selectedLicenses,
  };
}
