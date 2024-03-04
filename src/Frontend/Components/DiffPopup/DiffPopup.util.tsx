// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useCallback, useMemo, useState } from 'react';

import {
  COMPARABLE_ATTRIBUTES,
  ComparableAttribute,
} from '../../../shared/get-comparable-attributes';
import { PackageInfo } from '../../../shared/shared-types';
import { AttributionFormConfig } from '../AttributionForm/AttributionForm';
import { DiffEndIcon } from '../DiffEndIcon/DiffEndIcon';

export function useAttributionFormConfigs({
  original,
  current,
}: {
  original: PackageInfo;
  current: PackageInfo;
}) {
  const [bufferPackageInfo, setBufferPackageInfo] = useState(current);

  const getEndIcon = useCallback(
    ({
      isChanged,
      wasChanged,
      attribute,
    }: {
      isChanged: boolean;
      wasChanged: boolean;
      attribute: ComparableAttribute;
    }) => {
      if (isChanged && attribute !== 'firstParty') {
        return (
          <DiffEndIcon
            variant={'undo'}
            onClick={() => {
              setBufferPackageInfo({
                ...bufferPackageInfo,
                [attribute]: original[attribute],
              });
            }}
            data-testid={`${attribute}-undo`}
          />
        );
      }
      if (isChanged && attribute === 'firstParty') {
        return (
          <DiffEndIcon
            variant={current?.firstParty ? 'undo' : 'redo'}
            onClick={() => {
              setBufferPackageInfo({
                ...bufferPackageInfo,
                [attribute]: original[attribute],
                copyright: original['copyright'],
                licenseName: original['licenseName'],
                licenseText: original['licenseText'],
              });
            }}
            size={'big'}
            data-testid={`${attribute}-${current?.firstParty ? 'undo' : 'redo'}`}
          />
        );
      }
      if (wasChanged && attribute !== 'firstParty') {
        return (
          <DiffEndIcon
            variant={'redo'}
            onClick={() => {
              setBufferPackageInfo({
                ...bufferPackageInfo,
                [attribute]: current[attribute],
              });
            }}
            data-testid={`${attribute}-redo`}
          />
        );
      }
      if (wasChanged && attribute === 'firstParty') {
        return (
          <DiffEndIcon
            variant={current?.firstParty ? 'redo' : 'undo'}
            onClick={() => {
              if (!bufferPackageInfo.firstParty && current.firstParty) {
                setBufferPackageInfo({
                  ...bufferPackageInfo,
                  [attribute]: current[attribute],
                  copyright: undefined,
                  licenseName: undefined,
                  licenseText: undefined,
                });
              } else {
                setBufferPackageInfo({
                  ...bufferPackageInfo,
                  [attribute]: current[attribute],
                  copyright: current['copyright'],
                  licenseName: current['licenseName'],
                  licenseText: current['licenseText'],
                });
              }
            }}
            size={'big'}
            data-testid={`${attribute}-${current?.firstParty ? 'redo' : 'undo'}`}
          />
        );
      }
      return undefined;
    },
    [bufferPackageInfo, original, current],
  );

  const [originalFormConfig, bufferFormConfig] = useMemo(
    () =>
      COMPARABLE_ATTRIBUTES.reduce<
        [AttributionFormConfig, AttributionFormConfig]
      >(
        ([originalFormConfig, bufferFormConfig], attribute) => {
          switch (attribute) {
            case 'copyright':
            case 'licenseName':
            case 'licenseText': {
              const isThirdPartyUnchanged =
                !original.firstParty === !bufferPackageInfo.firstParty &&
                !original.firstParty;
              const isAttributeValueChanged =
                original[attribute] !== bufferPackageInfo[attribute];
              const wasThirdPartyUnchanged =
                !original.firstParty === !current.firstParty &&
                !original.firstParty;
              const wasAttributeValueChanged =
                original[attribute] !== current[attribute];
              const isChanged =
                isThirdPartyUnchanged && isAttributeValueChanged;
              const wasChanged =
                wasThirdPartyUnchanged && wasAttributeValueChanged;
              originalFormConfig[attribute] = {
                color: isChanged ? 'error' : undefined,
                focused: isChanged,
              };
              bufferFormConfig[attribute] = {
                color: isChanged ? 'success' : undefined,
                focused: isChanged,
                endIcon: getEndIcon({
                  isChanged,
                  wasChanged,
                  attribute,
                }),
              };
              break;
            }
            case 'comment':
            case 'packageName':
            case 'packageNamespace':
            case 'packageType':
            case 'packageVersion':
            case 'url': {
              const isChanged =
                (original[attribute] ?? '') !==
                (bufferPackageInfo[attribute] ?? '');
              const wasChanged =
                (original[attribute] ?? '') !== (current[attribute] ?? '');
              originalFormConfig[attribute] = {
                color: isChanged ? 'error' : undefined,
                focused: isChanged,
              };
              bufferFormConfig[attribute] = {
                color: isChanged ? 'success' : undefined,
                focused: isChanged,
                endIcon: getEndIcon({
                  isChanged,
                  wasChanged,
                  attribute,
                }),
              };
              break;
            }
            case 'firstParty': {
              const isChanged =
                !!original.firstParty !== !!bufferPackageInfo.firstParty;
              const wasChanged = !!original.firstParty !== !!current.firstParty;
              originalFormConfig[attribute] = {
                color: isChanged ? 'error' : undefined,
              };
              bufferFormConfig[attribute] = {
                color: isChanged ? 'success' : undefined,
                endIcon: getEndIcon({
                  isChanged,
                  wasChanged,
                  attribute,
                }),
              };
              break;
            }
          }
          return [originalFormConfig, bufferFormConfig];
        },
        [{}, {}],
      ),
    [bufferPackageInfo, original, current, getEndIcon],
  );
  return {
    originalFormConfig,
    bufferFormConfig,
    bufferPackageInfo,
    setBufferPackageInfo,
  };
}

export function stripLicenseInfoIfFirstParty(packageInfo: PackageInfo) {
  return packageInfo.firstParty
    ? {
        ...packageInfo,
        copyright: undefined,
        licenseName: undefined,
        licenseText: undefined,
      }
    : packageInfo;
}
