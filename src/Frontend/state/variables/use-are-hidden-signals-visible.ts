// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useAppSelector } from '../hooks';
import { getAreHiddenSignalsVisible } from '../selectors/user-settings-selector';

export function useAreHiddenSignalsVisible() {
  return useAppSelector(getAreHiddenSignalsVisible);
}
