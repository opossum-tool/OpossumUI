// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  ACTION_SET_SELECTED_ATTRIBUTION_ID,
  ACTION_SET_TARGET_SELECTED_ATTRIBUTION_ID,
  SetSelectedAttributionId,
  SetTargetSelectedAttributionIdAction,
} from './types';

export function setSelectedAttributionId(
  selectedAttributionId: string
): SetSelectedAttributionId {
  return {
    type: ACTION_SET_SELECTED_ATTRIBUTION_ID,
    payload: selectedAttributionId,
  };
}

export function setTargetSelectedAttributionId(
  targetSelectedAttributionId: string
): SetTargetSelectedAttributionIdAction {
  return {
    type: ACTION_SET_TARGET_SELECTED_ATTRIBUTION_ID,
    payload: targetSelectedAttributionId,
  };
}
