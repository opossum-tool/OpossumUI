// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useMemo } from 'react';

import { PackageInfo } from '../../../shared/shared-types';
import {
  AttributionFormConfig,
  FORM_ATTRIBUTES,
} from '../AttributionColumn/AttributionForm';

export function useAttributionFormConfigs({
  current,
  original,
}: {
  original: PackageInfo;
  current: PackageInfo;
}) {
  return useMemo(
    () =>
      FORM_ATTRIBUTES.reduce<[AttributionFormConfig, AttributionFormConfig]>(
        ([originalFormConfig, currentFormConfig], attribute) => {
          switch (attribute) {
            case 'copyright':
            case 'licenseName':
            case 'licenseText': {
              const isFirstPartyChanged =
                !!original.firstParty !== !!current.firstParty;
              const isAttributeValueChanged =
                original[attribute] !== current[attribute];
              const isChanged = isFirstPartyChanged || isAttributeValueChanged;
              originalFormConfig[attribute] = {
                color: isChanged ? 'error' : undefined,
                focused: isChanged,
              };
              currentFormConfig[attribute] = {
                color: isChanged ? 'success' : undefined,
                focused: isChanged,
              };
              break;
            }
            case 'packageName':
            case 'packageNamespace':
            case 'packageType':
            case 'packageVersion':
            case 'url': {
              const isChanged =
                (original[attribute] ?? '') !== (current[attribute] ?? '');
              originalFormConfig[attribute] = {
                color: isChanged ? 'error' : undefined,
                focused: isChanged,
              };
              currentFormConfig[attribute] = {
                color: isChanged ? 'success' : undefined,
                focused: isChanged,
              };
              break;
            }
            case 'firstParty': {
              break;
            }
          }
          return [originalFormConfig, currentFormConfig];
        },
        [{}, {}],
      ),
    [current, original],
  );
}
