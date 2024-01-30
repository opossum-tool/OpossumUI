// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { PackageInfo } from '../../../shared/shared-types';
import { useVariable } from './use-variable';

export const AUTOCOMPLETE_SIGNALS = 'autocomplete-signals';

export function useAutocompleteSignals() {
  return useVariable<Array<PackageInfo>>(AUTOCOMPLETE_SIGNALS, []);
}
