// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { LocatePopupFilters } from '../../../types/types';
import {
  SetLocatePopupFilters,
  ACTION_SET_LOCATE_POPUP_FILTERS,
} from './types';

export function setLocatePopupFilters(
  locatePopupFilters: LocatePopupFilters,
): SetLocatePopupFilters {
  return {
    type: ACTION_SET_LOCATE_POPUP_FILTERS,
    payload: locatePopupFilters,
  };
}
